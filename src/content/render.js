import mermaid from "mermaid";
import { notRenderSelector, queryContainers } from "./selectors";

/**
 * 用于保存原始mermaid code的key
 * @type {string}
 */
export const rawDataKey = "data-mermaid-previewer-raw";

/**
 * mermaid图表正则匹配
 * @type {RegExp}
 */
const mermaidRegex =
  /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+title\s.+|requirementDiagram|gitGraph)\s*\n/gm;

/**
 * 匹配符合条件的dom
 * @param mermaidDomList dom列表
 * @return NodeList 符合条件的dom结点数组
 */
const matchMermaidExp = async (mermaidDomList) => {
  // 过滤不符合正则的dom
  return Array.from(mermaidDomList).filter((mermaidDom) => {
    console.debug("" + mermaidDom.innerText);
    return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
  });
};

/**
 * 缓存mermaid原始code
 * @param mermaidDomList
 */
const saveRawCode = async (mermaidDomList) => {
  for (const mermaidDom of mermaidDomList) {
    // 缓存mermaid原始内容
    mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML);
  }
};

/**
 * 查找并保存原始mermaid code
 * @param dom 从这个dom结点搜索
 * @return NodeList 符合条件的dom结点数组
 */
export const queryAndSaveRaw = async (dom) => {
  const notRenderSelectors = await notRenderSelector();
  const mermaidDomList = await queryContainers(dom, notRenderSelectors);
  const filteredDomList = await matchMermaidExp(mermaidDomList);
  await saveRawCode(filteredDomList);
  return filteredDomList;
};

/**
 * 渲染mermaid图
 */
export const render = async (dom) => {
  mermaid.init(undefined, dom);
};
