import {
  defaultMatchSelectorList,
  getSync,
  STORAGE_KEY_MATCH_SELECTOR
} from "../utils/storage";
import { escapeHtml } from "../utils/escape.js";

/**
 * 用于判断是否已被渲染的key，由mermaid jsapi定义
 * @type {string}
 */
export const HadRenderedKey = "data-processed";
export const HadRenderedSelector = `[${HadRenderedKey}=true]`;

/**
 * 获取selectors
 */
const getMatchSelectorList = async () => {
  const customMatchSelectorList = await getSync(STORAGE_KEY_MATCH_SELECTOR);
  console.debug("customMatchSelectorList", customMatchSelectorList);
  console.debug("defaultMatchSelectorList", defaultMatchSelectorList);
  const concatMatchSelectorList = customMatchSelectorList.concat(
    defaultMatchSelectorList
  );
  console.debug("concatMatchSelectorList", concatMatchSelectorList);
  return concatMatchSelectorList;
};

const getNotSelector = (selector) => {
  return `:not(${selector})`;
};

const mapSelector = async (selectorSuffix) => {
  const matchSelectorList = await getMatchSelectorList();
  return matchSelectorList
    .map((selector) => {
      selector += selectorSuffix;
      return selector;
    })
    .join(", ");
};

/**
 * 未渲染selector
 * @return string 未渲染selector
 */
export const notRenderSelector = async () => {
  return mapSelector(getNotSelector(HadRenderedSelector));
};

export const renderedSelector = async () => {
  return mapSelector(HadRenderedSelector);
};

/**
 * 匹配符合条件的dom
 * @param dom 从这个dom结点搜索
 * @param selectors dom selector
 * @return NodeList 符合条件的dom结点数组
 */
export const queryContainers = async (dom, selectors) => {
  const mermaidDomList = dom.querySelectorAll(selectors);
  for (const mermaidDom of mermaidDomList) {
    // 去除内部多余的html tag，主要是为了兼容bitbucket
    mermaidDom.innerHTML = escapeHtml(mermaidDom.innerText);
    console.debug("innerHTML", mermaidDom.innerHTML, "innerText", mermaidDom.innerText);
  }
  return mermaidDomList;
};
