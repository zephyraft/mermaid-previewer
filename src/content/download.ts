import { sendDownloadTriggerMessage } from '../utils/message'
import { renderedSelector } from './selectors'
import { runtime } from 'webextension-polyfill'
import { type Message, MessageType, type ToastMessage } from '../types'
import { toast } from '../utils/toast'

const containsFontAwesome = (svgData: string): boolean => {
  return svgData.includes('<i class="fa')
}

const svgToPng = async (svgContainer: Element, callback: (name: string, src: string) => void): Promise<void> => {
  const svgDom = svgContainer.querySelector('svg')
  if (svgDom == null) {
    console.warn('无法找到svg')
    return
  }

  let svgData = new XMLSerializer().serializeToString(svgDom)
  if (containsFontAwesome(svgData)) {
    const styleIndex = svgData.indexOf('<style>')
    const fontAwesomeCSS = '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css" type="text/css"/>'
    svgData = `${svgData.substring(0, styleIndex)}${fontAwesomeCSS}${svgData.substring(styleIndex)}`
  }
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
  const name = svgDom.id + '.svg'
  callback(name, url)
}

/**
 * 监听Toast类型的message
 */
const watchToastMessage = async (): Promise<void> => {
  const w = (window as any)
  const hadWatch = w.mermaidPreviewerHadWatchToast as boolean
  if (!hadWatch && !inIframe()) {
    const toastMessageListener = async (message: Message): Promise<void> => {
      const downloadResultMessage = message as ToastMessage
      if (downloadResultMessage.type === MessageType.TOAST) {
        await toast(downloadResultMessage.text, downloadResultMessage.level)
      }
    }

    if (!runtime.onMessage.hasListener(toastMessageListener)) {
      console.log('watchToastMessage!')
      runtime.onMessage.addListener(toastMessageListener)
      w.mermaidPreviewerHadWatchToast = true
    }
  }
}

/**
 * 增强右键上下文菜单
 */
const watchRightClick = async (): Promise<void> => {
  window.oncontextmenu = async function (e) {
    console.debug(e.target)
    if (e.target == null) {
      return true
    }
    const target = e.target as HTMLElement

    // github原生mermaid
    const githubNativeMermaidDom = target.closest('div.mermaid-view div.mermaid')
    console.debug('github native dom', githubNativeMermaidDom)
    // 寻找父级最近的符合selector的元素
    const parentMermaidDom = target.closest(await renderedSelector())
    console.debug('oncontextmenu', target, parentMermaidDom)
    if (inIframe() && (githubNativeMermaidDom != null)) {
      // 发送png url
      await svgToPng(githubNativeMermaidDom, sendDownloadTriggerMessage)
    } else if (parentMermaidDom != null) {
      // 发送png url
      await svgToPng(parentMermaidDom, sendDownloadTriggerMessage)
    } else {
      // 发送空url
      sendDownloadTriggerMessage(null, null)
    }
    return true // 不阻止默认事件
  }
}

const inIframe = (): boolean => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

export const initDownload = async (): Promise<void> => {
  /**
     * 监听右键点击事件
     */
  await watchRightClick()
  /**
     * 监听toast消息
     */
  await watchToastMessage()
}
