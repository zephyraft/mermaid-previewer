export const STORAGE_KEY_EXCLUDE_DOMAIN = "excludeDomainList";
export const STORAGE_KEY_MATCH_SELECTOR = "matchSelectorList";
export const STORAGE_KEY_DEFAULT_EXCLUDE_DOMAIN = "defaultExcludeDomainList";
export const STORAGE_KEY_DEFAULT_MATCH_SELECTOR = "defaultMatchSelectorList";

// 默认配置
export const defaultExcludeDomainList = [
  "chrome.google.com", // chrome官网无法execute
  "gitlab.com", // https://gitlab.com/zzzzzzzephyr/test
];
export const defaultMatchSelectorList = [
  "pre[lang='mermaid'] > code", // github
  "div.codehilite > pre", // bitbucket
];

/**
 * 数组转字符串
 */
export function optionsArrayToStr(array) {
  let res = "";
  for (const element of array) {
    res += element + "\n";
  }
  return res.substr(0, res.length - 1);
}

/**
 * 字符串转数组
 */
export function optionsStrToArray(string) {
  let array = string.split("\n");
  array = array.map((item) => item.trim());
  array = array.filter((item) => item && item !== "");
  return array;
}

export async function getSync(key) {
  // noinspection JSUnresolvedVariable
  const storage = await chrome.storage.sync.get([key]);
  return storage[key] || [];
}

export async function setSync(obj) {
  // noinspection JSUnresolvedVariable
  await chrome.storage.sync.set(obj);
}

export async function getLocal(key) {
  // noinspection JSUnresolvedVariable
  const storage = await chrome.storage.local.get([key]);
  return storage[key] || [];
}

export async function setLocal(obj) {
  // noinspection JSUnresolvedVariable
  await chrome.storage.local.set(obj);
}
