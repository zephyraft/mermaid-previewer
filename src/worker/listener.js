import {
  defaultExcludeDomainList,
  getSync,
  STORAGE_KEY_EXCLUDE_DOMAIN,
} from "../utils/storage";
import {
  downloadFailMessage,
  downloadSuccessMessage,
  MESSAGE_TYPE_MENU,
} from "../utils/message";

const downloadContext = {
  src: null,
  name: null,
};

const getExcludeDomainList = async () => {
  const customExcludeDomainList = await getSync(STORAGE_KEY_EXCLUDE_DOMAIN);
  console.debug("customExcludeDomainList", customExcludeDomainList);
  console.debug("defaultExcludeDomainList", defaultExcludeDomainList);
  const excludeDomainList = customExcludeDomainList.concat(
    defaultExcludeDomainList
  );
  console.debug("concatExcludeDomainList", excludeDomainList);
  return excludeDomainList;
};

const judgeExec = (excludeDomainList, url) => {
  let needExecute = true;
  for (const excludeItem of excludeDomainList) {
    if (!url || url.includes(excludeItem)) {
      needExecute = false;
      console.debug("domain match excludeItem", excludeItem);
      break;
    }
  }
  return needExecute;
};

export const installedListener = async () => {
  // 初始化菜单
  // noinspection JSUnresolvedVariable
  chrome.contextMenus.create({
    id: "exportPNG", // 唯一id
    title: "Export png",
    contexts: ["all"], // 配置菜单可以出现的上下文
  });
};

// 监听ContextMenuPngSrc消息
export const menuMessageListener = (message) => {
  if (message?.type === MESSAGE_TYPE_MENU) {
    downloadContext.src = message.src;
    downloadContext.name = message.name;
  }
};

export const menuClickListener = async (info, tab) => {
  if (downloadContext.src) {
    // noinspection JSUnresolvedVariable
    chrome.downloads.download({
      filename: downloadContext.name,
      url: downloadContext.src,
    });
    downloadSuccessMessage(tab.id);
  } else {
    console.debug("downloadContext", downloadContext);
    downloadFailMessage(tab.id);
  }
};

export const tabsUpdateListener = async (tabId, changeInfo, tab) => {
  // 域名排除列表
  const excludeDomainList = await getExcludeDomainList();
  // 判断是否需要执行脚本
  const needExecute = judgeExec(excludeDomainList, tab.url);

  // tab加载完成，执行内容脚本
  if (changeInfo.status === "complete" && needExecute) {
    // noinspection JSUnresolvedVariable, JSUnresolvedFunction
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true }, // 注入所有iframe
      files: ["src/content/content.js"],
    });
  }
};
