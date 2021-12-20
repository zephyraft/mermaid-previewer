export const MESSAGE_TYPE_TOAST = "Toast"
export const MESSAGE_TOAST_LEVEL_INFO = "Info"
export const MESSAGE_TOAST_LEVEL_ERROR = "Error"

const sendTabMessage = (tabId, message) => {
  // noinspection JSUnresolvedVariable, JSUnresolvedFunction
  chrome.tabs.sendMessage(tabId, message);
};

export const downloadSuccessMessage = (tabId) => {
  sendTabMessage(tabId, {
    type: MESSAGE_TYPE_TOAST,
    level: MESSAGE_TOAST_LEVEL_INFO,
    text: "Export Success"
  });
};

export const downloadFailMessage = (tabId) => {
  sendTabMessage(tabId, {
    type: MESSAGE_TYPE_TOAST,
    level: MESSAGE_TOAST_LEVEL_ERROR,
    text: "Please use it above the specific mermaid diagram"
  });
};