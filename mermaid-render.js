// 使用长变量名，尽可能减少命名重复的可能
// TODO 增加专用的配置页面，提供给用户配置
window.mermaidPreviewerExcludeList = [
    "gitlab.com",
];

// TODO 增加专用的配置页面，提供给高级用户进行配置
// dom selector
window.mermaidPreviewerSelectorList = [
    "pre[lang='mermaid'] > code:not([data-processed=true])", // github
    "div[class='codehilite'] > pre", // bitbucket
];

// 隐藏dom的class
window.mermaidPreviewerHiddenClass = "mermaid-previewer-hidden-node";

/**
 * dom树改变时触发的回调
 * @param mutations dom改变事件
 */
function mermaidPreviewerMutationCallback(mutations) {
    // console.log('mutation', mutations);
    for (let mutation of mutations) {
        // 处理新增结点
        for (let node of mutation.addedNodes) {
            // 只关注HTMLElement，跳过其他节点（例如文本节点）
            if (!(node instanceof HTMLElement)) {
                continue;
            }

            const container = mermaidPreviewerFindContainers(node);
            if (container && container.length !== 0) {
                mermaidPreviewerRender(container);
            }
        }

        // 解决bitbucket预览加载问题
        mermaidPreviewerBitbucketPreviewHack(mutation)
    }
}

/**
 * 解决bitbucket预览加载问题
 * 加载缓存的原始mermaid，重新进行渲染
 * @param mutation
 */
function mermaidPreviewerBitbucketPreviewHack(mutation) {
    // 判断是否符合bitbucket 预览取消时的mutation
    if (
        mutation.target === document.querySelector('div#editor-container.maskable') &&
        mutation.removedNodes.length !== 0
    ) {
        // console.log('hack render for bitbucket preview cancel');
        const hiddenDom = document.querySelectorAll("span." + window.mermaidPreviewerHiddenClass);
        for (let hiddenDomElement of hiddenDom) {
            const mermaidDom = hiddenDomElement.previousSibling;
            mermaidDom.innerHTML = hiddenDomElement.innerHTML;
            mermaidDom.removeAttribute('data-processed');
            mermaidPreviewerRender(mermaidDom);
        }
    }
}

/**
 * 监听动态插入的dom，渲染其中符合条件的部分
 */
function mermaidPreviewerObserverDynamicInsertDom() {
    // 使用长变量名，尽可能减少命名重复的可能
    // 若已存在observer，先disconnect
    if (window.mermaidPreviewerMutationObserver) {
        window.mermaidPreviewerMutationObserver.disconnect();
    }

    // 定义observer callback
    window.mermaidPreviewerMutationObserver = new window.MutationObserver(mutations => {
        mermaidPreviewerMutationCallback(mutations);
    });
    // observe
    window.mermaidPreviewerMutationObserver.observe(document, {childList: true, subtree: true});
}

/**
 * 匹配符合条件的dom
 * @param dom 从这个dom结点搜索
 * @return 符合条件的dom结点数组
 */
function mermaidPreviewerFindContainers(dom) {
    // 排除某些域名
    let needExclude = false;
    for (const excludeItem of window.mermaidPreviewerExcludeList) {
        if (window.location.href.includes(excludeItem)) {
            needExclude = true;
        }
    }
    if (needExclude) {
        return dom.querySelectorAll(undefined);
    }

    // TODO 适配非markdown页面
    const mermaidDom = dom.querySelectorAll(mermaidPreviewerSelectorList.join(", "));
    for (let domElement of mermaidDom) {
        // 去除内部多余的html tag
        domElement.innerHTML = domElement.innerText
        // console.log('mermaid-debug', domElement.innerText)
        // 缓存mermaid原始内容
        mermaidPreviewerSaveRawByHiddenDom(domElement)
    }

    return dom.querySelectorAll(mermaidPreviewerSelectorList.join(", "));
}

/**
 * 新增隐藏dom，缓存mermaid原始内容
 * 主要用于解决bitbucket预览加载问题，使用mermaidPreviewerBitbucketPreviewHack读取缓存内容
 * @param mermaidDom
 */
function mermaidPreviewerSaveRawByHiddenDom(mermaidDom) {
    // 创建
    const hiddenNode = document.createElement("span");
    // 设置class，便于后续搜索此dom
    hiddenNode.setAttribute('class', window.mermaidPreviewerHiddenClass);
    // 缓存原始内容
    hiddenNode.innerHTML = mermaidDom.innerHTML;
    // 设置为隐藏
    hiddenNode.style.display = "none";
    // 插入到domElement后
    mermaidDom.parentNode.insertBefore(hiddenNode, mermaidDom.nextSibling);
}

/**
 * 渲染mermaid图
 * @param dom 需要渲染的dom结点
 */
function mermaidPreviewerRender(dom) {
    mermaid.init(undefined, dom);
}

// 首次进入页面时，执行render
mermaidPreviewerRender(mermaidPreviewerFindContainers(document));
// 监听动态插入的dom
mermaidPreviewerObserverDynamicInsertDom();
