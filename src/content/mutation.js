/**
 * 已渲染selector
 * @return string 已渲染selector
 */
import { queryAndSaveRaw, rawDataKey, render } from "./render";
import { HadRenderedKey, queryContainers, renderedSelector } from "./selectors";
import { escapeHtml } from "../utils/escape.js";

/**
 * 解决bitbucket预览加载问题
 * 加载缓存的原始mermaid，重新进行渲染
 * @param mutation
 */
const bitbucketPreviewHack = async (mutation) => {
  console.debug(`mutation=${JSON.stringify(mutation)}`);
  if (
    mutation.target ===
      document.querySelector("div#editor-container.maskable") &&
    mutation.removedNodes.length !== 0
  ) {
    console.debug("hack render for bitbucket preview cancel");
    const mermaidDomList = await queryContainers(
      document,
      await renderedSelector()
    );
    console.debug("mermaidDomList", mermaidDomList);
    if (mermaidDomList.length !== 0) {
      // 恢复原始mermaid
      for (const mermaidDom of mermaidDomList) {
        console.debug(mermaidDom);
        mermaidDom.innerHTML = escapeHtml(mermaidDom.getAttribute(rawDataKey));
        mermaidDom.removeAttribute(HadRenderedKey);
      }
      // 重新渲染
      await render(mermaidDomList);
    }
  }
};

/**
 * dom树改变时触发的回调
 * @param mutations dom改变事件
 */
async function mermaidPreviewerMutationCallback(mutations) {
  console.debug("mutation", mutations);
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
 * 监听动态插入的dom，渲染其中符合条件的部分
 */
export const watchDomMutation = async () => {
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
};
