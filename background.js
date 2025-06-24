// This script uses the debugger API to intercept WebSocket traffic.

const DEBUGGER_VERSION = "1.3";

// --- Debugger Management ---

// Keep track of which tabs we are attached to
const attachedTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;

    const isN8nWorkflow = tab.url.includes('/workflow/') || tab.url.includes('/workflows/');
    
    // Attach debugger if it's an n8n workflow page and we aren't already attached
    if (isN8nWorkflow && !attachedTabs.has(tabId)) {
        chrome.debugger.attach({ tabId: tabId }, DEBUGGER_VERSION, () => {
            if (chrome.runtime.lastError) {
                console.error(`Debugger attach error on tab ${tabId}:`, chrome.runtime.lastError.message);
                return;
            }
            attachedTabs.add(tabId);
            console.log(`Debugger attached to tab ${tabId}.`);
            chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable", {}, () => {
                 if (chrome.runtime.lastError) {
                    console.error("Failed to enable network monitoring:", chrome.runtime.lastError.message);
                }
            });
        });
    }
});

// Detach debugger and clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (attachedTabs.has(tabId)) {
        chrome.debugger.detach({ tabId: tabId }, () => {
            attachedTabs.delete(tabId);
            console.log(`Debugger detached from closed tab ${tabId}.`);
        });
    }
});

// --- WebSocket Data Interception ---

chrome.debugger.onEvent.addListener((source, method, params) => {
    // We only care about received WebSocket frames
    if (method !== "Network.webSocketFrameReceived") return;

    try {
        const payload = JSON.parse(params.response.payloadData);

        // This is the key change: We are now looking for the 'nodeExecuteAfter' message
        // and its specific data structure, as you discovered.
        if (payload.type === 'nodeExecuteAfter' && payload.data?.data?.data?.main) {
            
            const resultsArray = payload.data.data.data.main[0];
            
            if (Array.isArray(resultsArray) && resultsArray.length > 0) {
                console.log(`Found 'nodeExecuteAfter' message with ${resultsArray.length} items.`);

                // Extract the first two items, or fewer if not available.
                const itemsToStore = resultsArray.slice(0, 2).map(item => item.json);
                
                const storageKey = `jsonData_${source.tabId}`;
                chrome.storage.local.set({ [storageKey]: itemsToStore }, () => {
                    console.log("Successfully extracted and stored the first two items.");
                });
            }
        }
    } catch (e) {
        // Not a JSON message or not the one we want, so we can ignore it.
    }
});
