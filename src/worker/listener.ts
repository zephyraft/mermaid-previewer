import { contextMenus, downloads, type Menus, scripting, type Tabs } from 'webextension-polyfill'
import { getExcludeDomainList } from '../utils/options'
import { type DownloadContext, type MenuMessage, MessageType } from '../types'
import { sendDownloadFailMessage, sendDownloadSuccessMessage } from '../utils/message'

const downloadContext: DownloadContext = {
  src: null,
  name: null
}

const isNeedExecute = async (tab: Tabs.Tab): Promise<boolean> => {
  const url = tab.url ?? ''
  console.debug('tab url', url)
  if ((url === '')) {
    return false
  }

  // 域名排除列表
  const excludeDomainList = await getExcludeDomainList()

  let needExecute = true
  for (const excludeItem of excludeDomainList) {
    if (url.includes(excludeItem)) {
      needExecute = false
      console.debug('domain match excludeItem', excludeItem)
      break
    }
  }
  return needExecute
}

export const tabsUpdateListener = async (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab): Promise<void> => {
  // 判断是否需要执行脚本
  const needExecute = await isNeedExecute(tab)

  // tab加载完成，执行内容脚本
  if (changeInfo.status === 'complete' && needExecute) {
    // font-awesome
    await scripting.insertCSS({
      target: { tabId, allFrames: true }, // 注入所有iframe
      files: [
        'public/css/font-awesome.min.css'
      ]
    })
    await scripting.executeScript({
      target: { tabId, allFrames: true }, // 注入所有iframe
      files: ['content.js']
    })
  }
}

export const menuClickListener = async (info: Menus.OnClickData, tab: Tabs.Tab | undefined): Promise<void> => {
  if (tab == null || tab.id == null) {
    console.warn('无法获取到tabId')
    return
  }

  if (downloadContext.src != null && downloadContext.name != null) {
    await downloads.download({
      filename: downloadContext.name,
      url: downloadContext.src
    })
    sendDownloadSuccessMessage(tab.id)
  } else {
    console.debug('downloadContext', downloadContext)
    sendDownloadFailMessage(tab.id)
  }
}

export const menuMessageListener = (message: any): void => {
  const menuMessage = message as MenuMessage
  if (menuMessage.type === MessageType.MENU) {
    downloadContext.src = message.src
    downloadContext.name = message.name
  }
}

export const installedListener = (): void => {
  // 初始化菜单
  contextMenus.create({
    id: 'exportSVG', // 唯一id
    title: 'Export SVG',
    contexts: ['all'] // 配置菜单可以出现的上下文
  })
}
