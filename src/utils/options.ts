import { storage } from 'webextension-polyfill'
import { type Options } from '../types'

const defaultOptions: Options = {
  excludeDomainList: [
    'chrome.google.com', // chrome官网无法execute
    'gitlab.com' // https://gitlab.com/zzzzzzzephyr/test
  ],
  matchSelectorList: [
    "pre[lang='mermaid'] > code", // github
    'div.codehilite > pre' // bitbucket
  ]
}

/**
 * 获取排除域名列表，包含默认配置和自定义配置
 */
export const getExcludeDomainList = async (): Promise<string[]> => {
  const customOptions = await loadCustomOptions()
  const customExcludeDomainList = customOptions.excludeDomainList == null ? [] : customOptions.excludeDomainList
  console.debug('customExcludeDomainList', customExcludeDomainList)
  console.debug('defaultExcludeDomainList', defaultOptions.excludeDomainList)
  const excludeDomainList = customExcludeDomainList.concat(
    defaultOptions.excludeDomainList
  )
  console.debug('concatExcludeDomainList', excludeDomainList)
  return excludeDomainList
}

/**
 * 获取匹配选择器列表，包含默认配置和自定义配置
 */
export const getMatchSelectorList = async (): Promise<string[]> => {
  const customOptions = await loadCustomOptions()
  const customMatchSelectorList = customOptions.matchSelectorList == null ? [] : customOptions.matchSelectorList
  console.debug('customMatchSelectorList', customMatchSelectorList)
  console.debug('defaultMatchSelectorList', defaultOptions.matchSelectorList)
  const concatMatchSelectorList = customMatchSelectorList.concat(
    defaultOptions.matchSelectorList
  )
  console.debug('concatMatchSelectorList', concatMatchSelectorList)
  return concatMatchSelectorList
}

/**
 * 获取自定义配置
 */
export const loadCustomOptions = async (): Promise<Record<string, any>> => {
  const store = await storage.sync.get()
  console.log('store=', store)
  return store
}

/**
 * 保存自定义配置
 */
export const saveCustomOptions = async (options: Options): Promise<void> => {
  await storage.sync.set(options)
}
