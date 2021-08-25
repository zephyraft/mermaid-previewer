const GITHUB_SELECTOR = "pre[lang='mermaid'] > code"

function observerGitHubEditorPreview() {
    const observer = new window.MutationObserver(mutations => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                // 我们只跟踪元素，跳过其他节点（例如文本节点）
                if (!(node instanceof HTMLElement)) {
                    continue;
                }

                const container = findContainers(node);
                if (container) {
                    render(container);
                }
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});
}

function findContainers(dom) {
    return dom.querySelectorAll(GITHUB_SELECTOR);
}

function render(dom) {
    console.debug('render mermaid by plugin');
    mermaid?.init(undefined, dom);
}

observerGitHubEditorPreview();
chrome.runtime.onMessage.addListener((request, sender, response) => {
    const containers = findContainers(document);
    render(containers);
})
