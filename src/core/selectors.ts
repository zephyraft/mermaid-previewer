import { getMatchSelectorList } from "~core/options";

/**
 * 用于判断是否已被渲染的key，由mermaid jsapi定义
 * @type {string}
 */
export const HadRenderedKey = "data-processed";
export const HadRenderedSelector = `[${HadRenderedKey}=true]`;

const getURL = (): string => {
  return window.location.href;
};

export const matchURL = (regex: string): boolean => {
  return new RegExp(regex).test(getURL());
};

export const inMatchURLs = async (): Promise<boolean> => {
  const matchSelectorList = await getMatchSelectorList();
  let inSelectors = false;
  for (const selector of matchSelectorList) {
    if (matchURL(selector.regex)) {
      inSelectors = true;
      break;
    }
  }
  return inSelectors;
};

const getNotSelector = (selector: string): string => {
  return `:not(${selector})`;
};

const mapSelector = async (selectorSuffix: string): Promise<string> => {
  const matchSelectorList = await getMatchSelectorList();
  return matchSelectorList
    .filter((it) => matchURL(it.regex))
    .map((it) => it.selector)
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
export const notRenderSelector = async (): Promise<string> => {
  return await mapSelector(getNotSelector(HadRenderedSelector));
};

/**
 * 已渲染selector
 * @return string 已渲染selector
 */
export const renderedSelector = async (): Promise<string> => {
  return await mapSelector(HadRenderedSelector);
};

/**
 * 匹配符合条件的dom
 * @param dom 从这个dom结点搜索
 * @param selectors dom selector
 * @return NodeList 符合条件的dom结点数组
 */
export const queryContainers = async (
  dom: Document | Element,
  selectors: string,
): Promise<HTMLElement[]> => {
  // console.debug("selectors", selectors)
  if (selectors === "") {
    return [];
  }
  const mermaidDomList = dom.querySelectorAll<HTMLElement>(selectors);
  mermaidDomList.forEach((mermaidDom) => {
    // 去除内部多余的html tag，主要是为了兼容bitbucket
    const mermaidText = mermaidDom.innerText;
    // 防止Dom based XSS
    mermaidDom.innerHTML = "";
    mermaidDom.textContent = mermaidText;
    // console.debug(
    //   "innerHTML",
    //   mermaidDom.innerHTML,
    //   "textContent",
    //   mermaidDom.textContent
    // )
  });
  return Array.from(mermaidDomList);
};
