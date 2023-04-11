import './popup.css'
import { loadCustomOptions, saveCustomOptions } from '../utils/options'
import { type Options } from '../types'

const excludeDomainsInputId = 'ExcludeDomains'
const matchSelectorsInputId = 'MatchSelectors'
const statusDivId = 'Status'
const saveButtonId = 'SaveButton'

const getElementById = (id: string): HTMLElement => {
  const dom = document.getElementById(id)
  if (dom == null) {
    throw new Error(`cannot found element by id: ${id}`)
  }
  return dom
}

/**
 * 字符串数组转字符串
 */
const optionsArrayToStr = (array: string[]): string => {
  let res = ''
  for (const element of array) {
    res += element + '\n'
  }
  return res.substring(0, res.length - 1)
}

/**
 * 字符串转字符串数组
 */
const optionsStrToArray = (str: string): string[] => {
  let array = str.split('\n')
  array = array.map((item) => item.trim())
  array = array.filter((item) => item !== '')
  return array
}

const getInputValue = (id: string): string => {
  const dom = getElementById(id) as HTMLInputElement
  return dom.value
}

const setInputValue = (id: string, value: string): void => {
  const dom = getElementById(id) as HTMLInputElement
  dom.value = value
}

const displaySaveSuccess = (): void => {
  const status = getElementById(statusDivId)
  status.textContent = 'Options Saved.'
  setTimeout(() => {
    status.textContent = ''
  }, 2000)
}

/**
 * 保存配置
 */
const saveOptions = async (): Promise<void> => {
  const excludeDomainList = optionsStrToArray(getInputValue(excludeDomainsInputId))
  const matchSelectorList = optionsStrToArray(getInputValue(matchSelectorsInputId))

  const options: Options = {
    excludeDomainList,
    matchSelectorList
  }

  await saveCustomOptions(options)

  // 保存成功提示信息
  displaySaveSuccess()
}

/**
 * 读取并填充当前配置
 */
const restoreOptions = async (): Promise<void> => {
  const options = await loadCustomOptions()
  const excludeDomainList = options.excludeDomainList == null ? [] : options.excludeDomainList
  const matchSelectorList = options.matchSelectorList == null ? [] : options.matchSelectorList
  console.debug('storage', options)
  setInputValue(excludeDomainsInputId, optionsArrayToStr(excludeDomainList))
  setInputValue(matchSelectorsInputId, optionsArrayToStr(matchSelectorList))
}

// 保存按钮点击事件
getElementById(saveButtonId).addEventListener('click', saveOptions as () => void)
// 页面加载完成后，读取并填充当前配置
document.addEventListener('DOMContentLoaded', restoreOptions as () => void)
