/**
 * svg转png
 * @param svgContainer
 * @param callback
 */
import { toast } from "../utils/toast";
import { MESSAGE_TYPE_TOAST, sendMenuMessage } from "../utils/message";
import { renderedSelector } from "./selectors";

const svgToPng = async (svgContainer, callback) => {
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
};

/**
 * 监听Toast类型的message
 */
const watchToastMessage = async () => {
  if (!window.mermaidPreviewerHadWatchToast && !inIframe()) {
    // noinspection JSUnresolvedVariable
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message?.type === MESSAGE_TYPE_TOAST) {
        await toast(message.text, message.level);
      }
    });
    window.mermaidPreviewerHadWatchToast = true;
  }
};

/**
 * 增强右键上下文菜单
 */
const watchRightClick = async () => {
  window.oncontextmenu = async function (e) {
    console.debug(e.target);
    // github原生mermaid
    const githubNativeMermaidDom = e.target.closest("div.mermaid-view div.mermaid");
    console.debug("github native dom", githubNativeMermaidDom);
    // 寻找父级最近的符合selector的元素
    const parentMermaidDom = e.target.closest(await renderedSelector());
    console.debug("oncontextmenu", e.target, parentMermaidDom);
    if (inIframe() && githubNativeMermaidDom) {
      // 发送png url
      await svgToPng(githubNativeMermaidDom, sendMenuMessage);
    } else if (parentMermaidDom) {
      // 发送png url
      await svgToPng(parentMermaidDom, sendMenuMessage);
    } else {
      // 发送空url
      await sendMenuMessage(null, null);
    }
    return true; // 不阻止默认事件
  };
};

const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export const initDownload = async () => {
  /**
   * 监听右键点击事件
   */
  await watchRightClick();
  /**
   * 监听toast消息
   */
  await watchToastMessage();
};
