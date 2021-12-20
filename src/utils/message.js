export const MESSAGE_TYPE_TOAST = "Toast";
export const MESSAGE_TYPE_MENU = "ContextMenu";
export const MESSAGE_TOAST_LEVEL_INFO = "Info";
export const MESSAGE_TOAST_LEVEL_ERROR = "Error";

const sendMessage = (tabId, message) => {
  console.debug(tabId, message);
  // noinspection JSUnresolvedVariable, JSUnresolvedFunction
  chrome.tabs.sendMessage(tabId, message);
};

export const downloadSuccessMessage = (tabId) => {
  sendMessage(tabId, {
    type: MESSAGE_TYPE_TOAST,
    level: MESSAGE_TOAST_LEVEL_INFO,
    text: "Export Success"
  });
};

export const downloadFailMessage = (tabId) => {
  sendMessage(tabId, {
    type: MESSAGE_TYPE_TOAST,
    level: MESSAGE_TOAST_LEVEL_ERROR,
    text: "Please use it above the specific mermaid diagram"
  });
};

/**
 * 发送消息
 * @param name 文件名
 * @param src 源
 */
export const sendMenuMessage = async (name, src) => {
  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPE_MENU,
    name: name,
    src: src
  });
};