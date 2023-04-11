export interface Options {
  excludeDomainList: string[]
  matchSelectorList: string[]
}

export enum ToastType {
  INFO = 'Info',
  ERROR = 'Error'
}

export enum MessageType {
  TOAST = 'Toast',
  MENU = 'ContextMenu'
}

export interface Message {
  type: MessageType
}

export interface ToastMessage extends Message {
  type: MessageType.TOAST
  level: ToastType
  text: string
}

export interface MenuMessage extends Message {
  type: MessageType.MENU
  name: string | null
  src: string | null
}

export interface DownloadContext {
  src: string | null
  name: string | null
}
