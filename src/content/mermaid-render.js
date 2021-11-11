// noinspection JSUnresolvedVariable,JSUnresolvedFunction
// 使用块作用域，避免变量污染
{
    /**
     * 用于保存原始mermaid code的key
     * @type {string}
     */
    const rawDataKey = "data-mermaid-previewer-raw";

    /**
     * 用于判断是否已被渲染的key，由mermaid jsapi定义
     * @type {string}
     */
    const HadRenderedKey = "data-processed";

    /**
     * mermaid图表正则匹配
     * @type {RegExp}
     */
    const mermaidRegex = /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+title\s.+|requirementDiagram|gitGraph:)\s*\n/mg

    /**
     * dom树改变时触发的回调
     * @param mutations dom改变事件
     */
    async function mermaidPreviewerMutationCallback(mutations) {
        // console.log('mutation', mutations);
        for (let mutation of mutations) {
            // 处理新增结点
            for (let node of mutation.addedNodes) {
                // 只关注HTMLElement，跳过其他节点（例如文本节点）
                if (!(node instanceof HTMLElement)) {
                    continue;
                }

                const mermaidDomList = await queryAndSaveRaw(node);
                if (mermaidDomList.length !== 0) {
                    await render(mermaidDomList);
                }
            }

            // 解决bitbucket预览加载问题
            await bitbucketPreviewHack(mutation);
        }
    }

    /**
     * 解决bitbucket预览加载问题
     * 加载缓存的原始mermaid，重新进行渲染
     * @param mutation
     */
    async function bitbucketPreviewHack(mutation) {
        // TODO 判断是否符合bitbucket 预览取消时的mutation
        if (
            mutation.target === document.querySelector('div#editor-container.maskable') &&
            mutation.removedNodes.length !== 0
        ) {
            // console.log('hack render for bitbucket preview cancel');
            const mermaidDomList = await queryContainers(document, renderedSelector());
            if (mermaidDomList.length !== 0) {
                // 恢复原始mermaid
                for (const mermaidDom of mermaidDomList) {
                    // console.log(mermaidDom);
                    mermaidDom.innerHTML = mermaidDom.getAttribute(rawDataKey);
                    mermaidDom.removeAttribute(HadRenderedKey);
                }
                // 重新渲染
                await render(mermaidDomList);
            }
        }
    }

    /**
     * 监听动态插入的dom，渲染其中符合条件的部分
     */
    async function watchDomMutation() {
        // 使用长变量名，尽可能减少命名重复的可能
        // 若已存在observer，先disconnect
        if (window.mermaidPreviewerMutationObserver) {
            window.mermaidPreviewerMutationObserver.disconnect();
        }

        // 定义observer callback
        window.mermaidPreviewerMutationObserver = new window.MutationObserver(async mutations => {
            await mermaidPreviewerMutationCallback(mutations);
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
    async function queryContainers(dom, selectors) {
        const mermaidDomList = dom.querySelectorAll(selectors);
        for (const mermaidDom of mermaidDomList) {
            // 去除内部多余的html tag，主要是为了兼容bitbucket
            mermaidDom.innerHTML = mermaidDom.innerText;
            // console.log('mermaid-debug', domElement.innerText)
        }
        return mermaidDomList;
    }

    /**
     * 匹配符合条件的dom
     * @param mermaidDomList dom列表
     * @return NodeList 符合条件的dom结点数组
     */
    async function matchMermaidExp(mermaidDomList) {
        // 过滤不符合正则的dom
        return Array.from(mermaidDomList).filter(mermaidDom => {
            // console.log("" + mermaidDom.innerText);
            return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
        });
    }

    async function getMatchSelectorList() {
        const storage = await chrome.storage.sync.get(['matchSelectorList']);
        console.debug('storage', storage);
        const localStorage = await chrome.storage.local.get(['defaultMatchSelectorList']);
        console.debug('localStorage', localStorage);
        return storage.matchSelectorList || localStorage.defaultMatchSelectorList;
    }

    /**
     * 未渲染selector
     * @return string 未渲染selector
     */
    async function notRenderSelector() {
        const matchSelectorList = await getMatchSelectorList();
        return matchSelectorList.map(selector => {
            selector += `:not([${HadRenderedKey}=true])`;
            return selector;
        }).join(", ");
    }

    /**
     * 已渲染selector
     * @return string 已渲染selector
     */
    async function renderedSelector() {
        const matchSelectorList = await getMatchSelectorList();
        return matchSelectorList.map(selector => {
            selector += `[${HadRenderedKey}=true]`;
            return selector;
        }).join(", ");
    }

    /**
     * 缓存mermaid原始code
     * @param mermaidDomList
     */
    async function saveRawCode(mermaidDomList) {
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
    async function queryAndSaveRaw(dom) {
        const mermaidDomList = await queryContainers(dom, await notRenderSelector());
        const filteredDomList = await matchMermaidExp(mermaidDomList);
        await saveRawCode(filteredDomList)
        return filteredDomList;
    }

    /**
     * 渲染mermaid图
     * @param mermaidDomList 需要渲染的dom结点
     */
    async function render(mermaidDomList) {
        if (mermaid !== undefined) {
            mermaid.init(undefined, await mermaidDomList);
        }
    }

    /**
     * svg转png
     * @param svgContainer
     * @param callback
     */
    async function svgToPng(svgContainer, callback) {
        const svgDom = svgContainer.querySelector("svg");
        const svgData = new XMLSerializer().serializeToString(svgDom);
        const imgDom = document.createElement("img");
        imgDom.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

        const canvasDom = document.createElement("canvas");
        const svgSize = svgDom.getBoundingClientRect();
        // canvasDom.width = svgSize.width;
        // 使用maxWidth避免导出图片宽度不够被截断
        canvasDom.width = parseInt(window.getComputedStyle(svgDom).maxWidth);
        canvasDom.height = svgSize.height;
        const ctx = canvasDom.getContext("2d");
        imgDom.onload = async function () {
            ctx.drawImage(imgDom, 0, 0);
            const pngSrc = canvasDom.toDataURL("image/png");
            await callback(svgDom.id + ".png", pngSrc);
        };
    }

    /**
     * 发送消息
     * @param name 文件名
     * @param src 源
     */
    async function sendPngSrc(name, src) {
        chrome.runtime.sendMessage({
            type: "ContextMenuPngSrc",
            name: name,
            src: src,
        });
    }

    /**
     * 增强右键上下文菜单
     */
    async function watchRightClick() {
        window.oncontextmenu = async function (e) {
            // 寻找父级最近的符合selector的元素
            const parentMermaidDom = e.target.closest(await renderedSelector())
            // console.log("oncontextmenu", e.target, parentMermaidDom);
            if (parentMermaidDom) {
                // 发送png url
                await svgToPng(parentMermaidDom, sendPngSrc);
            } else {
                // 发送空url
                await sendPngSrc(null);
            }
            return true; // 不阻止默认事件
        }
    }

    /**
     * 监听Toast类型的message
     */
    async function watchToastMessage() {
        if (!window.mermaidPreviewerHadWatchToast) {
            // noinspection JSDeprecatedSymbols
            chrome.runtime.onMessage.addListener(async (message) => {
                if (message?.type === 'Toast') {
                    await toast(message.text, message.level);
                }
            });
            window.mermaidPreviewerHadWatchToast = true;
        }
    }

    /**
     * 弹出toast
     * @param text 内容
     * @param level 为Error时显示红色
     */
    async function toast(text, level) {
        const css = level === "Error" ? {
            style: {
                color: 'rgba(239, 68, 68, 1)',
                textAlign: 'center',
                borderColor: 'rgba(248, 113, 113, 1)',
                borderWidth: '1px',
                borderRadius: '0.375rem',
                background: "rgba(254, 242, 242, 1)",
            },
        } : {
            style: {
                color: 'rgba(59, 130, 246, 1)',
                textAlign: 'center',
                borderColor: 'rgba(96, 165, 250, 1)',
                borderWidth: '1px',
                borderRadius: '0.375rem',
                background: "rgba(239, 246, 255, 1)",
            },
        }

        Toastify({
            text: text,
            duration: 3000,
            style: css.style,
            close: true,
            position: "center",
            offset: {
                y: 200 // vertical axis - can be a number or a string indicating unity. eg: '2em'
            },
        }).showToast();
    }

    /**
     * 首次进入页面时，执行render
     */
    render(queryAndSaveRaw(document)).then(_ => {
        /**
         * 监听动态插入的dom
         */
        watchDomMutation().then(_ => {});
        /**
         * 监听右键点击事件
         */
        watchRightClick().then(_ => {});
        /**
         * 监听toast消息
         */
        watchToastMessage().then(_ => {});
    });
}
