// 使用长变量名，尽可能减少命名重复的可能
// TODO 增加专用的配置页面，提供给用户配置
window.mermaidPreviewerExcludeList = [
    "gitlab.com",
];

// TODO 增加专用的配置页面，提供给高级用户进行配置
// dom selector
window.mermaidPreviewerSelectorList = [
    "pre[lang='mermaid'] > code", // github
    "div[class='codehilite'] > pre", // bitbucket
];

/**
 * 用于保存原始mermaid code的key
 * @type {string}
 */
window.mermaidPreviewerRawDataKey = "data-mermaid-previewer-raw";

/**
 * 用于判断是否已被渲染的key，由mermaid jsapi定义
 * @type {string}
 */
window.mermaidPreviewerHadRenderedKey = "data-processed";

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

            const mermaidDomList = mermaidPreviewerFindAndSaveRaw(node);
            // noinspection JSUnresolvedVariable
            if (mermaidDomList.length !== 0) {
                mermaidPreviewerRender(mermaidDomList);
            }
        }

        // 解决bitbucket预览加载问题
        mermaidPreviewerBitbucketPreviewHack(mutation);
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
        const mermaidDomList = mermaidPreviewerFindContainers(document, mermaidPreviewerRenderedSelector());
        // noinspection JSUnresolvedVariable
        if (mermaidDomList.length !== 0) {
            // 恢复原始mermaid
            for (const mermaidDom of mermaidDomList) {
                // console.log(mermaidDom);
                // noinspection JSUnresolvedFunction
                mermaidDom.innerHTML = mermaidDom.getAttribute(window.mermaidPreviewerRawDataKey);
                // noinspection JSUnresolvedFunction
                mermaidDom.removeAttribute(window.mermaidPreviewerHadRenderedKey);
            }
            // 重新渲染
            mermaidPreviewerRender(mermaidDomList);
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
 * @param selectors dom selector
 * @return 符合条件的dom结点数组
 */
function mermaidPreviewerFindContainers(dom, selectors) {
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

    const mermaidDomList = dom.querySelectorAll(selectors);
    for (const mermaidDom of mermaidDomList) {
        // 去除内部多余的html tag
        mermaidDom.innerHTML = mermaidDom.innerText
        // console.log('mermaid-debug', domElement.innerText)
    }
    return mermaidDomList;
}

/**
 * 未渲染selector
 * @return 未渲染selector
 */
function mermaidPreviewerNotRenderSelector() {
    // noinspection UnnecessaryLocalVariableJS
    const selectors = mermaidPreviewerSelectorList.map(selector => {
        selector += `:not([${window.mermaidPreviewerHadRenderedKey}=true])`;
        return selector;
    }).join(", ");
    // console.log(selectors);
    return selectors;
}

/**
 * 已渲染selector
 * @return 已渲染selector
 */
function mermaidPreviewerRenderedSelector() {
    // noinspection UnnecessaryLocalVariableJS
    const selectors = mermaidPreviewerSelectorList.map(selector => {
        selector += `[${window.mermaidPreviewerHadRenderedKey}=true]`;
        return selector;
    }).join(", ");
    // console.log(selectors);
    return selectors;
}

/**
 * 缓存mermaid原始内容
 * @param mermaidDomList
 */
function mermaidPreviewerSaveRaw(mermaidDomList) {
    for (const mermaidDom of mermaidDomList) {
        // 缓存mermaid原始内容
        mermaidDom.setAttribute(window.mermaidPreviewerRawDataKey, mermaidDom.innerHTML)
    }
}

/**
 * 查找并保存原始mermaid code
 * @param dom 从这个dom结点搜索
 * @return 符合条件的dom结点数组
 */
function mermaidPreviewerFindAndSaveRaw(dom) {
    const mermaidDomList = mermaidPreviewerFindContainers(dom, mermaidPreviewerNotRenderSelector());
    mermaidPreviewerSaveRaw(mermaidDomList)
    return mermaidDomList;
}

/**
 * 渲染mermaid图
 * @param mermaidDomList 需要渲染的dom结点
 */
function mermaidPreviewerRender(mermaidDomList) {
    // noinspection JSUnresolvedVariable
    mermaid.init(undefined, mermaidDomList);
}

// 首次进入页面时，执行render
mermaidPreviewerRender(mermaidPreviewerFindAndSaveRaw(document));
// 监听动态插入的dom
mermaidPreviewerObserverDynamicInsertDom();
