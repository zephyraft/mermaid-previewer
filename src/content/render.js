import mermaid from "mermaid";

import { getLocal, getSync, STORAGE_KEY_DEFAULT_MATCH_SELECTOR, STORAGE_KEY_MATCH_SELECTOR } from "../utils/storage";
import { toast } from "../utils/toast";
import { MESSAGE_TYPE_TOAST } from "../utils/message";

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
  const mermaidRegex =
    /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+title\s.+|requirementDiagram|gitGraph:)\s*\n/gm;

  /**
   * dom树改变时触发的回调
   * @param mutations dom改变事件
   */
  async function mermaidPreviewerMutationCallback(mutations) {
    console.debug('mutation', mutations);
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
    console.debug(`mutation=${JSON.stringify(mutation)}`);
    if (
      mutation.target ===
        document.querySelector("div#editor-container.maskable") &&
      mutation.removedNodes.length !== 0
    ) {
      console.debug('hack render for bitbucket preview cancel');
      const mermaidDomList = await queryContainers(
        document,
        await renderedSelector()
      );
      console.debug('mermaidDomList', mermaidDomList);
      if (mermaidDomList.length !== 0) {
        // 恢复原始mermaid
        for (const mermaidDom of mermaidDomList) {
          console.debug(mermaidDom);
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
    window.mermaidPreviewerMutationObserver = new window.MutationObserver(
      async (mutations) => {
        await mermaidPreviewerMutationCallback(mutations);
      }
    );
    // observe
    window.mermaidPreviewerMutationObserver.observe(document, {
      childList: true,
      subtree: true,
    });
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
      console.debug('mermaid-debug', mermaidDom.innerText)
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
    return Array.from(mermaidDomList).filter((mermaidDom) => {
      console.debug("" + mermaidDom.innerText);
      return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
    });
  }

  async function getMatchSelectorList() {
    const customMatchSelectorList = await getSync(STORAGE_KEY_MATCH_SELECTOR);
    console.debug("customMatchSelectorList", customMatchSelectorList);
    const defaultMatchSelectorList = await getLocal(STORAGE_KEY_DEFAULT_MATCH_SELECTOR);
    console.debug("defaultMatchSelectorList", defaultMatchSelectorList);
    const concatMatchSelectorList = customMatchSelectorList.concat(defaultMatchSelectorList);
    console.debug("concatMatchSelectorList", concatMatchSelectorList);
    return concatMatchSelectorList;
  }

  /**
   * 未渲染selector
   * @return string 未渲染selector
   */
  async function notRenderSelector() {
    const matchSelectorList = await getMatchSelectorList();
    return matchSelectorList
      .map((selector) => {
        selector += `:not([${HadRenderedKey}=true])`;
        return selector;
      })
      .join(", ");
  }

  /**
   * 已渲染selector
   * @return string 已渲染selector
   */
  async function renderedSelector() {
    const matchSelectorList = await getMatchSelectorList();
    return matchSelectorList
      .map((selector) => {
        selector += `[${HadRenderedKey}=true]`;
        return selector;
      })
      .join(", ");
  }

  /**
   * 缓存mermaid原始code
   * @param mermaidDomList
   */
  async function saveRawCode(mermaidDomList) {
    for (const mermaidDom of mermaidDomList) {
      // 缓存mermaid原始内容
      mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML);
    }
  }

  /**
   * 查找并保存原始mermaid code
   * @param dom 从这个dom结点搜索
   * @return NodeList 符合条件的dom结点数组
   */
  async function queryAndSaveRaw(dom) {
    const mermaidDomList = await queryContainers(
      dom,
      await notRenderSelector()
    );
    const filteredDomList = await matchMermaidExp(mermaidDomList);
    await saveRawCode(filteredDomList);
    return filteredDomList;
  }

  /**
   * 渲染mermaid图
   * @param mermaidDomList 需要渲染的dom结点
   */
  async function render(mermaidDomList) {
    mermaid.init(undefined, await mermaidDomList);
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
    imgDom.setAttribute(
      "src",
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    );

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
    // noinspection JSUnresolvedVariable,JSUnresolvedFunction
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
      const parentMermaidDom = e.target.closest(await renderedSelector());
      console.debug("oncontextmenu", e.target, parentMermaidDom);
      if (parentMermaidDom) {
        // 发送png url
        await svgToPng(parentMermaidDom, sendPngSrc);
      } else {
        // 发送空url
        await sendPngSrc(null);
      }
      return true; // 不阻止默认事件
    };
  }

  /**
   * 监听Toast类型的message
   */
  async function watchToastMessage() {
    if (!window.mermaidPreviewerHadWatchToast) {
      chrome.runtime.onMessage.addListener(async (message) => {
        if (message?.type === MESSAGE_TYPE_TOAST) {
          await toast(message.text, message.level);
        }
      });
      window.mermaidPreviewerHadWatchToast = true;
    }
  }

  /**
   * 首次进入页面时，执行render
   */
  render(queryAndSaveRaw(document)).then((_) => {
    /**
     * 监听动态插入的dom
     */
    watchDomMutation().then((_) => {});
    /**
     * 监听右键点击事件
     */
    watchRightClick().then((_) => {});
    /**
     * 监听toast消息
     */
    watchToastMessage().then((_) => {});
  });
}
