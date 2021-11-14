// noinspection JSUnresolvedVariable,JSUnresolvedFunction,JSDeprecatedSymbols
// 监听tab改变
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // 域名排除列表
    const storage = await chrome.storage.sync.get(['excludeDomainList']);
    console.debug('storage', storage);
    const localStorage = await chrome.storage.local.get(['defaultExcludeDomainList']);
    console.debug('localStorage', localStorage);
    const excludeDomainList = storage.excludeDomainList || localStorage.defaultExcludeDomainList;

    // 判断是否需要执行脚本
    let needExecute = true;
    for (const excludeItem of excludeDomainList) {
        if (!tab.url || tab.url.includes(excludeItem)) {
            needExecute = false;
            console.debug('domain match excludeItem', excludeItem);
            break;
        }
    }

    // tab加载完成
    if (changeInfo.status === 'complete' && needExecute) {
        // TODO 使用打包工具简化脚本使用
        // 加载依赖项
        await chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['static/vendor/mermaid.min.js']
        });
        await chrome.scripting.insertCSS({
            target: { tabId: tabId},
            files: ['static/vendor/toastify.min.css']
        });
        await chrome.scripting.executeScript({
            target: { tabId: tabId},
            files: ['static/vendor/toastify.min.js']
        });
        await chrome.scripting.executeScript({
            target: { tabId: tabId},
            files: ['src/content/mermaid-render.js']
        });
    }
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "exportPNG", // 唯一id
        title: "Export png",
        contexts: ["all"], // 配置菜单可以出现的上下文
    });
});

let src = null;
let name = null;

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
    if (src) {
        chrome.downloads.download({filename: name, url: src});
        chrome.tabs.sendMessage(tab.id, {
            type: "Toast",
            level: "Info",
            text: "Export Success",
        });
    } else {
        console.debug("name", name);
        console.debug("src", src);
        chrome.tabs.sendMessage(tab.id, {
            type: "Toast",
            level: "Error",
            text: "Please use it above the specific mermaid diagram",
        });
    }
});

// 监听ContextMenuPngSrc消息
// noinspection JSUnusedLocalSymbols
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'ContextMenuPngSrc') {
        src = message.src
        name = message.name
    }
});

chrome.runtime.onInstalled.addListener(() => {
    // 默认配置
    const defaultExcludeDomainList = [
        "chrome.google.com", // chrome官网无法execute
        "gitlab.com", // https://gitlab.com/zzzzzzzephyr/test
    ];
    const defaultMatchSelectorList = [
        "pre[lang='mermaid'] > code", // github
        "div[class='codehilite'] > pre", // bitbucket
    ];

    chrome.storage.local.set({
        defaultExcludeDomainList,
        defaultMatchSelectorList
    });

    console.debug('set default settings');
});
