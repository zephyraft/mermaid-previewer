// 使用块作用域，避免变量污染
{
    // TODO 增加专用的配置页面，提供给用户配置
    excludeDomainList = [
        "gitlab.com", // https://gitlab.com/zzzzzzzephyr/test
    ];

    // TODO 增加专用的配置页面，提供给高级用户进行配置
    matchSelectorList = [
        "pre[lang='mermaid'] > code", // github
        "div[class='codehilite'] > pre", // bitbucket
    ];

    /**
     * 用于保存原始mermaid code的key
     * @type {string}
     */
    rawDataKey = "data-mermaid-previewer-raw";

    /**
     * 用于判断是否已被渲染的key，由mermaid jsapi定义
     * @type {string}
     */
    HadRenderedKey = "data-processed";

    /**
     * mermaid图表正则匹配
     * @type {RegExp}
     */
    mermaidRegex = /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+title\s.+|requirementDiagram|gitGraph:)\s*\n/mg

    /**
     * mermaid md 代码块正则匹配
     * @type {RegExp}
     */
    mermaidCodeRegex = /```mermaid\s*\n([^`]|\n)*\n\s*```/g

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

                const mermaidDomList = queryAndSaveRaw(node);
                // noinspection JSUnresolvedVariable
                if (mermaidDomList.length !== 0) {
                    render(mermaidDomList);
                }
            }

            // 解决bitbucket预览加载问题
            bitbucketPreviewHack(mutation);
        }
    }

    /**
     * 解决bitbucket预览加载问题
     * 加载缓存的原始mermaid，重新进行渲染
     * @param mutation
     */
    function bitbucketPreviewHack(mutation) {
        // 判断是否符合bitbucket 预览取消时的mutation
        if (
            mutation.target === document.querySelector('div#editor-container.maskable') &&
            mutation.removedNodes.length !== 0
        ) {
            // console.log('hack render for bitbucket preview cancel');
            const mermaidDomList = queryContainers(document, renderedSelector());
            // noinspection JSUnresolvedVariable
            if (mermaidDomList.length !== 0) {
                // 恢复原始mermaid
                for (const mermaidDom of mermaidDomList) {
                    // console.log(mermaidDom);
                    // noinspection JSUnresolvedFunction
                    mermaidDom.innerHTML = mermaidDom.getAttribute(rawDataKey);
                    // noinspection JSUnresolvedFunction
                    mermaidDom.removeAttribute(HadRenderedKey);
                }
                // 重新渲染
                render(mermaidDomList);
            }
        }
    }

    /**
     * 监听动态插入的dom，渲染其中符合条件的部分
     */
    function watchDomMutation() {
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
     * @return NodeList 符合条件的dom结点数组
     */
    function queryContainers(dom, selectors) {
        // 排除某些域名
        let needExclude = false;
        for (const excludeItem of excludeDomainList) {
            if (window.location.href.includes(excludeItem)) {
                needExclude = true;
            }
        }
        if (needExclude) {
            return dom.querySelectorAll(undefined);
        }

        const mermaidDomList = dom.querySelectorAll(selectors);
        for (const mermaidDom of mermaidDomList) {
            // 去除内部多余的html tag，主要是为了兼容bitbucket
            mermaidDom.innerHTML = mermaidDom.innerText
            // console.log('mermaid-debug', domElement.innerText)
        }
        // 过滤不符合正则的dom
        return Array.from(mermaidDomList).filter(mermaidDom => {
            // console.log("" + mermaidDom.innerText);
            return new RegExp(mermaidRegex).test(mermaidDom.innerText);
        })
    }

    /**
     * 未渲染selector
     * @return string 未渲染selector
     */
    function notRenderSelector() {
        // noinspection UnnecessaryLocalVariableJS
        const selectors = matchSelectorList.map(selector => {
            selector += `:not([${HadRenderedKey}=true])`;
            return selector;
        }).join(", ");
        // console.log(selectors);
        return selectors;
    }

    /**
     * 已渲染selector
     * @return string 已渲染selector
     */
    function renderedSelector() {
        // noinspection UnnecessaryLocalVariableJS
        const selectors = matchSelectorList.map(selector => {
            selector += `[${HadRenderedKey}=true]`;
            return selector;
        }).join(", ");
        // console.log(selectors);
        return selectors;
    }

    /**
     * 缓存mermaid原始code
     * @param mermaidDomList
     */
    function saveRawCode(mermaidDomList) {
        for (const mermaidDom of mermaidDomList) {
            // 缓存mermaid原始内容
            mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML)
        }
    }

    /**
     * 查找并保存原始mermaid code
     * @param dom 从这个dom结点搜索
     * @return NodeList 符合条件的dom结点数组
     */
    function queryAndSaveRaw(dom) {
        const mermaidDomList = queryContainers(dom, notRenderSelector());
        saveRawCode(mermaidDomList)
        return mermaidDomList;
    }

    /**
     * 渲染mermaid图
     * @param mermaidDomList 需要渲染的dom结点
     */
    function render(mermaidDomList) {
        // noinspection JSUnresolvedVariable
        mermaid.init(undefined, mermaidDomList);
    }

    /**
     * 首次进入页面时，执行render
     */
    render(queryAndSaveRaw(document));
    /**
     * 监听动态插入的dom
     */
    watchDomMutation();
}
