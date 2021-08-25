function mutationCallback(mutations) {
    for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
            // 我们只跟踪元素，跳过其他节点（例如文本节点）
            if (!(node instanceof HTMLElement)) {
                continue;
            }

            const container = findContainers(node);
            if (container && container.length !== 0) {
                render(container);
            }
        }
    }
}

function observerGitHubEditorPreview() {
    // 若已存在observer，先disconnect
    if (window.observer) {
        window.observer.disconnect();
    }

    window.observer = new window.MutationObserver(mutations => {
        mutationCallback(mutations);
    });
    window.observer.observe(document, {childList: true, subtree: true});
}

function findContainers(dom) {
    const GITHUB_SELECTOR = "pre[lang='mermaid'] > code:not([data-processed=true])"

    return dom.querySelectorAll(GITHUB_SELECTOR);
}

function render(dom) {
    mermaid.init(undefined, dom);
}

render(findContainers(document));
observerGitHubEditorPreview();
