import {
  installedListener,
  menuClickListener,
  menuMessageListener,
  tabsUpdateListener,
} from "./listener";

// tab改变
// noinspection JSUnresolvedVariable
chrome.tabs.onUpdated.addListener(tabsUpdateListener);

// 右键菜单点击
// noinspection JSUnresolvedVariable
chrome.contextMenus.onClicked.addListener(menuClickListener);

// 菜单点击事件
// noinspection JSUnresolvedVariable
chrome.runtime.onMessage.addListener(menuMessageListener);

// 扩展安装完成回调
// noinspection JSUnresolvedVariable
chrome.runtime.onInstalled.addListener(installedListener);
