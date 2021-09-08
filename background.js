// TODO 增加专用的配置页面，提供给用户配置
// 定义域名排除列表
excludeDomainList = [
    "gitlab.com", // https://gitlab.com/zzzzzzzephyr/test
    "chrome.google.com" // chrome官网无法execute
];

// noinspection JSUnresolvedVariable
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.get(tabId, tab => {
            // console.log(tab.url);
            // 只有当获取到了url时才继续，如 chrome://extensions/ 页面无法获取到
            if (tab.url) {
                // 判断是否需要执行脚本
                let needExecute = true;
                for (const excludeItem of excludeDomainList) {
                    if (tab.url.includes(excludeItem)) {
                        needExecute = false;
                        break;
                    }
                }
                if (needExecute) {
                    // 加载依赖项
                    // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['vendor/mermaid.min.js']
                    }, () => {
                        // 加载render脚本
                        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        chrome.scripting.executeScript({
                            target: { tabId: tabId},
                            files: ['mermaid-render.js']
                        });
                    });
                }
            }
        });
    }
})
