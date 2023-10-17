import mermaid from "mermaid/dist/mermaid.min.js"

import { mermaidHover } from "~core/hover"

import { notRenderSelector, queryContainers } from "./selectors"
import { enableSandbox } from "~core/options";

/**
 * 用于保存原始mermaid code的key
 * @type {string}
 */
export const rawDataKey = "data-mermaid-previewer-raw"

/**
 * mermaid图表正则匹配
 * @type {RegExp}
 */
const mermaidRegex =
  /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+showData|pie\s+title\s.+|requirementDiagram|gitGraph|quadrantChart|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline)\s*\n/gm

/**
 * 匹配符合条件的dom
 * @param mermaidDomList dom列表
 */
const matchMermaidExp = async (
  mermaidDomList: HTMLElement[]
): Promise<HTMLElement[]> => {
  // 过滤不符合正则的dom
  return Array.from(mermaidDomList).filter((mermaidDom) => {
    // console.debug("" + mermaidDom.innerText)
    return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim())
  })
}

/**
 * 缓存mermaid原始code
 * @param mermaidDomList
 */
const saveRawCode = async (mermaidDomList: HTMLElement[]): Promise<void> => {
  mermaidDomList.forEach((mermaidDom) => {
    // 缓存mermaid原始内容
    mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML)
  })
}

/**
 * 查找并保存原始mermaid code
 * @param dom 从这个dom结点搜索
 * @return NodeList 符合条件的dom结点数组
 */
export const queryAndSaveRaw = async (
  dom: Document | Element
): Promise<HTMLElement[]> => {
  const notRenderSelectors = await notRenderSelector()
  const mermaidDomList = await queryContainers(dom, notRenderSelectors)
  const filteredDomList = await matchMermaidExp(mermaidDomList)
  await saveRawCode(filteredDomList)
  return filteredDomList
}

/**
 * 渲染mermaid图
 */
export const render = async (domList: HTMLElement[]): Promise<void> => {
  mermaid.initialize({
    securityLevel: await enableSandbox() ? 'sandbox' : 'strict',
    startOnLoad: false
  });
  await mermaid.run({
    nodes: domList
  })
  await mermaidHover(domList, false)
}
