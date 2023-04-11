import { getMatchSelectorList } from '../utils/options'

/**
 * 用于判断是否已被渲染的key，由mermaid jsapi定义
 * @type {string}
 */
export const HadRenderedKey = 'data-processed'
export const HadRenderedSelector = `[${HadRenderedKey}=true]`

const getNotSelector = (selector: string): string => {
  return `:not(${selector})`
}

const mapSelector = async (selectorSuffix: string): Promise<string> => {
  const matchSelectorList = await getMatchSelectorList()
  return matchSelectorList
    .map((selector) => {
      selector += selectorSuffix
      return selector
    })
    .join(', ')
}

/**
 * 未渲染selector
 * @return string 未渲染selector
 */
export const notRenderSelector = async (): Promise<string> => {
  return await mapSelector(getNotSelector(HadRenderedSelector))
}

/**
 * 已渲染selector
 * @return string 已渲染selector
 */
export const renderedSelector = async (): Promise<string> => {
  return await mapSelector(HadRenderedSelector)
}

/**
 * 匹配符合条件的dom
 * @param dom 从这个dom结点搜索
 * @param selectors dom selector
 * @return NodeList 符合条件的dom结点数组
 */
export const queryContainers = async (dom: Document | Element, selectors: string): Promise<HTMLElement[]> => {
  const mermaidDomList = dom.querySelectorAll<HTMLElement>(selectors)
  mermaidDomList.forEach((mermaidDom) => {
    // 去除内部多余的html tag，主要是为了兼容bitbucket
    const mermaidText = mermaidDom.innerText
    // 防止Dom based XSS
    mermaidDom.innerHTML = ''
    mermaidDom.textContent = mermaidText
    console.debug('innerHTML', mermaidDom.innerHTML, 'textContent', mermaidDom.textContent)
  })
  return Array.from(mermaidDomList)
}
