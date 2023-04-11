import { sendDownloadTriggerMessage } from '../utils/message'
import { renderedSelector } from './selectors'
import { runtime } from 'webextension-polyfill'
import { type Message, MessageType, type ToastMessage } from '../types'
import { toast } from '../utils/toast'

const svgToPng = async (svgContainer: Element, callback: (name: string, src: string) => void): Promise<void> => {
  const svgDom = svgContainer.querySelector('svg')
  if (svgDom == null) {
    console.warn('无法找到svg')
    return
  }

  const svgData = new XMLSerializer().serializeToString(svgDom)
  const imgDom = document.createElement('img')
  imgDom.setAttribute(
    'src',
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
  )

  const canvasDom = document.createElement('canvas')
  const svgSize = svgDom.getBoundingClientRect()
  // canvasDom.width = svgSize.width;
  // 使用maxWidth避免导出图片宽度不够被截断
  canvasDom.width = parseInt(window.getComputedStyle(svgDom).maxWidth)
  canvasDom.height = svgSize.height
  const ctx = canvasDom.getContext('2d')
  imgDom.onload = async function () {
    ctx?.drawImage(imgDom, 0, 0)
    const name = svgDom.id + '.png'
    const url = canvasDom.toDataURL('image/png')
    callback(name, url)
  }
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
