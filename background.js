chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // 加载依赖项
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['vendor/mermaid.min.js']
        }, () => {
            // 加载render脚本
            chrome.scripting.executeScript({
                target: { tabId: tabId},
                files: ['mermaid-render.js']
            });
        });
    }
})
