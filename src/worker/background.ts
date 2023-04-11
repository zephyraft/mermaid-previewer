import { contextMenus, type Menus, runtime, type Tabs, tabs } from 'webextension-polyfill'
import { installedListener, menuClickListener, menuMessageListener, tabsUpdateListener } from './listener'

const tabsOnUpdated = tabsUpdateListener as (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) => void
const contextMenusOnClicked = menuClickListener as (info: Menus.OnClickData, tab: Tabs.Tab | undefined) => void

if (!tabs.onUpdated.hasListener(tabsOnUpdated)) {
  // tab改变时，注入content脚本
  tabs.onUpdated.addListener(tabsOnUpdated)
}

if (!contextMenus.onClicked.hasListener(contextMenusOnClicked)) {
  // contextMenu点击事件
  contextMenus.onClicked.addListener(contextMenusOnClicked)
}

if (!runtime.onMessage.hasListener(menuMessageListener)) {
  // contextMenu点击触发runtime消息的监听
  runtime.onMessage.addListener(menuMessageListener)
}

if (!runtime.onInstalled.hasListener(installedListener)) {
  // 扩展安装完成回调，注册contextMenu
  runtime.onInstalled.addListener(installedListener)
}
