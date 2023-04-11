import { runtime, tabs } from 'webextension-polyfill'
import { type MenuMessage, type Message, MessageType, type ToastMessage, ToastType } from '../types'

const sendTabMessage = <T extends Message>(tabId: number, message: T): void => {
  console.debug(tabId, message)
  tabs.sendMessage(tabId, message).catch(e => { console.error(e) })
}

const sendRuntimeMessage = (name: string | null, src: string | null): void => {
  runtime.sendMessage({
    type: MessageType.MENU,
    name,
    src
  } satisfies MenuMessage).catch(e => { console.error(e) })
}

/**
 * 发送下载触发消息
 * @param name 文件名
 * @param src url
 */
export const sendDownloadTriggerMessage = (name: string | null, src: string | null): void => {
  sendRuntimeMessage(name, src)
}

/**
 * 发送下载成功消息
 */
export const sendDownloadSuccessMessage = (tabId: number): void => {
  sendTabMessage(tabId, {
    type: MessageType.TOAST,
    level: ToastType.INFO,
    text: 'Export Success'
  } satisfies ToastMessage)
}

/**
 * 发送下载失败消息
 */
export const sendDownloadFailMessage = (tabId: number): void => {
  sendTabMessage(tabId, {
    type: MessageType.TOAST,
    level: ToastType.ERROR,
    text: 'Please use it above the specific mermaid diagram'
  } satisfies ToastMessage)
}
