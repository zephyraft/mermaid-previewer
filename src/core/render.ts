import { mermaidHover } from "~core/hover";

import { notRenderSelector, queryContainers, renderedSelector, HadRenderedKey } from "./selectors";
import { enableSandbox, getEffectiveTheme } from "~core/options";
import type { Mermaid } from "mermaid";

/**
 * 用于保存原始mermaid code的key
 */
export const rawDataKey: string = "data-mermaid-previewer-raw";

/**
 * mermaid图表正则匹配
 */
const mermaidRegex: RegExp =
  /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+showData|pie\s+title\s.+|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|kanban|architecture-beta)\s*\n/gm;

/**
 * 匹配符合条件的dom
 * @param mermaidDomList dom列表
 */
const matchMermaidExp = async (
  mermaidDomList: HTMLElement[],
): Promise<HTMLElement[]> => {
  // 过滤不符合正则的dom
  return Array.from(mermaidDomList).filter((mermaidDom) => {
    // console.debug("" + mermaidDom.innerText)
    return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
  });
};

/**
 * 缓存mermaid原始code
 * @param mermaidDomList
 */
const saveRawCode = async (mermaidDomList: HTMLElement[]): Promise<void> => {
  mermaidDomList.forEach((mermaidDom) => {
    // 缓存mermaid原始内容
    mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML);
  });
};

/**
 * 查找并保存原始mermaid code
 * @param dom 从这个dom结点搜索
 * @return NodeList 符合条件的dom结点数组
 */
export const queryAndSaveRaw = async (
  dom: Document | Element,
): Promise<HTMLElement[]> => {
  const notRenderSelectors = await notRenderSelector();
  const mermaidDomList = await queryContainers(dom, notRenderSelectors);
  const filteredDomList = await matchMermaidExp(mermaidDomList);
  await saveRawCode(filteredDomList);
  return filteredDomList;
};

/**
 * 渲染mermaid图
 */
export const render = async (
  mermaid: Mermaid,
  domList: HTMLElement[],
): Promise<void> => {
  const effective = await getEffectiveTheme();
  const theme = effective === "dark" ? "dark" : "default";
  // 让页面整体跟随当前模式：暗色/亮色（不写死颜色，由浏览器按 color-scheme 渲染）
  document.documentElement.style.colorScheme =
    effective === "dark" ? "dark" : "light";
  mermaid.initialize({
    securityLevel: (await enableSandbox()) ? "sandbox" : "strict",
    startOnLoad: false,
    theme,
  });
  try {
    await mermaid.run({
      nodes: domList,
    });
  } catch (e) {
    console.error(e);
  }
  await mermaidHover(domList, false);
};

/**
 * 用当前主题重新渲染页面上所有已渲染的mermaid图
 */
export const rerenderAll = async (mermaid: Mermaid): Promise<void> => {
  const mermaidDomList = await queryContainers(
    document,
    await renderedSelector(),
  );
  for (const mermaidDom of mermaidDomList) {
    const rawData = mermaidDom.getAttribute(rawDataKey);
    if (rawData != null) {
      mermaidDom.innerHTML = rawData;
      mermaidDom.removeAttribute(HadRenderedKey);
    }
  }
  await render(mermaid, mermaidDomList);
};
