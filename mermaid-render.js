// 使用长变量名，尽可能减少命名重复的可能
// TODO 增加专用的配置页面，提供给用户配置
window.mermaidPreviewerExcludeList = [
    "gitlab.com"
]

function mermaidPreviewerMutationCallback(mutations) {
    for (let mutation of mutations) {
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
    }
}

function mermaidPreviewerObserverGitHubEditorPreview() {
    // 使用长变量名，尽可能减少命名重复的可能
    // 若已存在observer，先disconnect
    if (window.mermaidPreviewerMutationObserver) {
        window.mermaidPreviewerMutationObserver.disconnect();
    }

    window.mermaidPreviewerMutationObserver = new window.MutationObserver(mutations => {
        mermaidPreviewerMutationCallback(mutations);
    });
    window.mermaidPreviewerMutationObserver.observe(document, {childList: true, subtree: true});
}

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
    const GITHUB_SELECTOR = "pre[lang='mermaid'] > code:not([data-processed=true])"
    return dom.querySelectorAll(GITHUB_SELECTOR);
}

function mermaidPreviewerRender(dom) {
    mermaid.init(undefined, dom);
}

mermaidPreviewerRender(mermaidPreviewerFindContainers(document));
mermaidPreviewerObserverGitHubEditorPreview();
