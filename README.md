# n8n Data Tool - Chrome Extension

A browser extension for Chrome to aid in the development and testing of [n8n](https://n8n.io/) workflows. This tool allows you to easily capture, save, and browse test data directly from the n8n editor.

## The Problem It Solves

When testing complex n8n nodes, it can be cumbersome to repeatedly copy and paste the output data for use in other nodes or for testing. Sometimes, N8N does not even allow test runs with data pinned. This extension simplifies the process by providing a persistent, browsable storage for your test executions right in your browser.

## Features

- **Live Data Inspection:** Automatically intercepts the full, uncompressed JSON output when you run a node test.
- **Context-Aware Display:** The popup shows the name of the current workflow and the active node you have open.
- **Save Test Data:** Save the output from a node test with a single click. The data is stored locally under the current workflow and node name.
- **Browse Saved Tests:** Easily browse through your saved tests using custom dropdown menus, organized by workflow and then by node.
- **Data Management:** Delete individual node tests or entire workflow test suites to keep your saved data clean.
- **Copy to Clipboard:** Quickly copy both live and saved JSON data to your clipboard for easy use elsewhere.

## How to Install

Since this extension is not on the Chrome Web Store, you need to load it as an unpacked extension in developer mode.

1.  **Download:** Download this project's files as a `.zip` and extract them, or clone the repository to your local machine.
2.  **Open Chrome Extensions:** Open Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** In the top right corner, toggle on "Developer mode".
4.  **Load Unpacked:** Click the "Load unpacked" button that appears.
5.  **Select Folder:** In the file selection dialog, select the folder where you saved the extension's files (the folder that contains `manifest.json`).
6.  The extension "n8n Data Interceptor" will now appear in your extensions list and toolbar.

## How to Use

1.  Navigate to an active n8n workflow in your browser.
2.  Open a node in the n8n editor.
3.  Run a test for that node using the "Test step" button.
4.  Click the extension icon in your Chrome toolbar to open the popup.
    - The "Live Node Data" section will automatically show the captured JSON output.
5.  Click **"Save Test"** to store the current live data.
6.  Use the dropdowns in the **"Saved Tests"** section to browse and view your previously saved data.

---

*This extension utilizes the `chrome.debugger` API to intercept network traffic from the n8n tab. This is necessary to reliably capture the complete execution data sent from the n8n backend via WebSockets.*
