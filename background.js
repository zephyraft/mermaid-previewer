chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // when tab load complete, execute mermaid render script
        chrome.tabs.sendMessage(tabId, "tab complete");
    }
})
