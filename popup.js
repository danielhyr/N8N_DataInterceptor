document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const liveWorkflowNameEl = document.getElementById('live-workflow-name');
    const liveNodeNameEl = document.getElementById('live-node-name');
    const liveJsonDataEl = document.getElementById('live-json-data');
    const refreshViewBtn = document.getElementById('refresh-view-btn');
    const saveDataBtn = document.getElementById('save-data-btn');
    const copyLiveJsonBtn = document.getElementById('copy-live-json-btn');
    const savedJsonDataEl = document.getElementById('saved-json-data');
    const copySavedJsonBtn = document.getElementById('copy-saved-json-btn');
    const statusMessageEl = document.getElementById('status-message');
    // Workflow Dropdown Elements
    const workflowDropdownBtn = document.getElementById('workflow-dropdown-btn');
    const workflowDropdownLabel = document.getElementById('workflow-dropdown-label');
    const workflowDropdownList = document.getElementById('workflow-dropdown-list');
    // Node Dropdown Elements
    const nodeDropdownBtn = document.getElementById('node-dropdown-btn');
    const nodeDropdownLabel = document.getElementById('node-dropdown-label');
    const nodeDropdownList = document.getElementById('node-dropdown-list');

    let currentLiveData = null;
    let currentTabId = null;

    function getPageDetails() {
        const details = { workflowName: null, nodeName: null };
        const wfNameEl = document.querySelector('span[data-test-id="workflow-name-input"]');
        if (wfNameEl) details.workflowName = wfNameEl.getAttribute('title');
        const nodeModal = document.getElementById('ndv');
        if (nodeModal) {
            const nodeNameEl = nodeModal.querySelector('._container_86rol_123.node-name ._title_86rol_133');
            if (nodeNameEl) details.nodeName = nodeNameEl.firstChild.textContent.trim();
        }
        return details;
    }

    function refreshLiveView(tabId) {
        chrome.scripting.executeScript({ target: { tabId }, function: getPageDetails }, (results) => {
            if (results && results[0] && results[0].result) {
                const { workflowName, nodeName } = results[0].result;
                liveWorkflowNameEl.textContent = workflowName || 'N/A';
                liveNodeNameEl.textContent = nodeName || 'No node selected';
            }
        });
        const storageKey = `jsonData_${tabId}`;
        chrome.storage.local.get([storageKey], (result) => {
            if (result[storageKey]) {
                liveJsonDataEl.textContent = JSON.stringify(result[storageKey], null, 2);
                currentLiveData = result[storageKey];
                saveDataBtn.disabled = false;
                copyLiveJsonBtn.disabled = false;
            } else {
                liveJsonDataEl.textContent = 'No execution data captured. Run a node test.';
                currentLiveData = null;
                saveDataBtn.disabled = true;
                copyLiveJsonBtn.disabled = true;
            }
        });
    }

    function loadSavedWorkflows() {
        chrome.storage.local.get(['savedWorkflows'], (result) => {
            const savedWorkflows = result.savedWorkflows || {};
            const workflowNames = Object.keys(savedWorkflows);
            workflowDropdownList.innerHTML = '';
            if (workflowNames.length > 0) {
                workflowDropdownBtn.disabled = false;
                workflowNames.forEach(name => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'flex justify-between items-center p-2 hover:bg-gray-200 cursor-pointer workflow-item';
                    itemDiv.dataset.workflowName = name;
                    itemDiv.innerHTML = `<span class="truncate">${name}</span><button class="delete-workflow text-red-500 hover:text-red-700 font-bold px-2" title="Delete this workflow">&times;</button>`;
                    workflowDropdownList.appendChild(itemDiv);
                });
                workflowDropdownLabel.textContent = workflowNames[0];
                loadNodesForWorkflow(workflowNames[0]);
            } else {
                workflowDropdownBtn.disabled = true;
                workflowDropdownLabel.textContent = 'No saved workflows';
                workflowDropdownList.innerHTML = '<div class="p-2 text-gray-500">Nothing saved yet.</div>';
                nodeDropdownBtn.disabled = true;
                nodeDropdownLabel.textContent = 'No saved nodes';
                savedJsonDataEl.textContent = 'Select a workflow and node to view data.';
                copySavedJsonBtn.disabled = true;
            }
        });
    }

    function loadNodesForWorkflow(workflowName) {
        nodeDropdownList.innerHTML = '';
        savedJsonDataEl.textContent = 'Select a node to view data.';
        copySavedJsonBtn.disabled = true;
        
        chrome.storage.local.get(['savedWorkflows'], (result) => {
            const nodes = result.savedWorkflows?.[workflowName] || {};
            const nodeNames = Object.keys(nodes);

            if (nodeNames.length > 0) {
                nodeDropdownBtn.disabled = false;
                nodeNames.forEach(nodeName => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'flex justify-between items-center p-2 hover:bg-gray-200 cursor-pointer node-item';
                    itemDiv.dataset.nodeName = nodeName;
                    itemDiv.dataset.workflowName = workflowName;
                    itemDiv.innerHTML = `<span class="truncate">${nodeName}</span><button class="delete-node text-red-500 hover:text-red-700 font-bold px-2" title="Delete this node">&times;</button>`;
                    nodeDropdownList.appendChild(itemDiv);
                });
                nodeDropdownLabel.textContent = nodeNames[0];
                savedJsonDataEl.textContent = JSON.stringify(nodes[nodeNames[0]], null, 2);
                copySavedJsonBtn.disabled = false;
            } else {
                nodeDropdownBtn.disabled = true;
                nodeDropdownLabel.textContent = 'No saved nodes';
            }
        });
    }

    function handleDeleteWorkflow(workflowName) {
        if (!confirm(`Are you sure you want to delete the entire workflow table "${workflowName}"?`)) return;
        chrome.storage.local.get(['savedWorkflows'], (result) => {
            let saved = result.savedWorkflows || {};
            delete saved[workflowName];
            chrome.storage.local.set({ savedWorkflows: saved }, loadSavedWorkflows);
        });
    }

    function handleDeleteNode(workflowName, nodeName) {
        if (!confirm(`Delete node "${nodeName}" from workflow "${workflowName}"?`)) return;
        chrome.storage.local.get(['savedWorkflows'], (result) => {
            let saved = result.savedWorkflows || {};
            if (saved[workflowName]?.[nodeName]) {
                delete saved[workflowName][nodeName];
                if (Object.keys(saved[workflowName]).length === 0) {
                    delete saved[workflowName];
                }
                chrome.storage.local.set({ savedWorkflows: saved }, loadSavedWorkflows);
            }
        });
    }
    
    function copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => {
            statusMessageEl.textContent = message;
            setTimeout(() => statusMessageEl.textContent = '', 2000);
        }).catch(() => statusMessageEl.textContent = 'Failed to copy.');
    }

    // --- Event Listeners ---
    saveDataBtn.addEventListener('click', () => {
        const workflowName = liveWorkflowNameEl.textContent;
        const nodeName = liveNodeNameEl.textContent;
        if (!currentLiveData || workflowName === 'N/A' || nodeName === 'No node selected') return;
        chrome.storage.local.get(['savedWorkflows'], (result) => {
            let saved = result.savedWorkflows || {};
            saved[workflowName] = saved[workflowName] || {};
            saved[workflowName][nodeName] = currentLiveData;
            chrome.storage.local.set({ savedWorkflows: saved }, () => {
                statusMessageEl.textContent = `Data for "${nodeName}" saved.`;
                setTimeout(() => statusMessageEl.textContent = '', 2000);
                loadSavedWorkflows();
            });
        });
    });

    workflowDropdownBtn.addEventListener('click', () => workflowDropdownList.classList.toggle('hidden'));
    nodeDropdownBtn.addEventListener('click', () => nodeDropdownList.classList.toggle('hidden'));
    
    workflowDropdownList.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.workflow-item');
        if (!targetItem) return;
        const workflowName = targetItem.dataset.workflowName;

        if (e.target.classList.contains('delete-workflow')) {
            handleDeleteWorkflow(workflowName);
        } else {
            workflowDropdownLabel.textContent = workflowName;
            loadNodesForWorkflow(workflowName);
        }
        workflowDropdownList.classList.add('hidden');
    });
    
    nodeDropdownList.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.node-item');
        if (!targetItem) return;
        const { workflowName, nodeName } = targetItem.dataset;

        if (e.target.classList.contains('delete-node')) {
            handleDeleteNode(workflowName, nodeName);
        } else {
            chrome.storage.local.get(['savedWorkflows'], (result) => {
                 const nodeData = result.savedWorkflows?.[workflowName]?.[nodeName];
                 if (nodeData) {
                    nodeDropdownLabel.textContent = nodeName;
                    savedJsonDataEl.textContent = JSON.stringify(nodeData, null, 2);
                    copySavedJsonBtn.disabled = false;
                 }
            });
        }
        nodeDropdownList.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!workflowDropdownBtn.contains(e.target) && !workflowDropdownList.contains(e.target)) {
            workflowDropdownList.classList.add('hidden');
        }
        if (!nodeDropdownBtn.contains(e.target) && !nodeDropdownList.contains(e.target)) {
            nodeDropdownList.classList.add('hidden');
        }
    });
    
    copyLiveJsonBtn.addEventListener('click', () => copyToClipboard(liveJsonDataEl.textContent, 'Live JSON copied!'));
    copySavedJsonBtn.addEventListener('click', () => copyToClipboard(savedJsonDataEl.textContent, 'Saved JSON copied!'));

    // --- Initial Load ---
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        currentTabId = tabs[0].id;
        refreshViewBtn.addEventListener('click', () => refreshLiveView(currentTabId));
        refreshLiveView(currentTabId);
        loadSavedWorkflows();
    });
});
