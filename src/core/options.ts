import { Storage, type StorageCallbackMap, type StorageWatchCallback } from "@plasmohq/storage";

import type { ExcludeConfig, Experimental, SelectorConfig } from "~types";

const storage = new Storage();
const storageKeyPrefix = "mermaid-previewer.";

export const storageKey = {
  excludeURLs: `${storageKeyPrefix}excludeURLs`,
  matchSelectors: `${storageKeyPrefix}matchSelectors`,
  downloadSelectors: `${storageKeyPrefix}downloadSelectors`,
  experimental: `${storageKeyPrefix}experimental`,
};

export const defaultExcludes: ExcludeConfig[] = [
  {
    match: "https://chromewebstore.google.com/*"
  }
];

export const defaultMatchSelectors: SelectorConfig[] = [
  {
    match: "*://bitbucket.org/*",
    selector: "div.codehilite > pre",
  },
  {
    match: "file:///*.mmd",
    selector: "body > pre",
  },
  {
    match: "file:///*.mermaid",
    selector: "body > pre",
  },
];

export const defaultDownloadSelectors: SelectorConfig[] = [
  {
    match: "https://viewscreen.githubusercontent.com/markdown/mermaid*",
    selector: "div.mermaid-view div.mermaid",
  },
  {
    match: "https://gitlab.com/-/sandbox/mermaid",
    selector: "div#app",
  }
];

/**
 * 获取排除域名列表，包含默认配置和自定义配置
 */
export const getExcludeURL = async (): Promise<ExcludeConfig[]> => {
  const customExcludes =
    (await storage.get<ExcludeConfig[] | undefined>(storageKey.excludeURLs)) ??
    [];
  return customExcludes.concat(defaultExcludes);
};

/**
 * 获取匹配选择器列表，包含默认配置和自定义配置
 */
export const getMatchSelectorList = async (): Promise<SelectorConfig[]> => {
  const customSelectors =
    (await storage.get<SelectorConfig[] | undefined>(
      storageKey.matchSelectors,
    )) ?? [];
  return customSelectors.concat(defaultMatchSelectors);
};

/**
 * 获取匹配选择器列表，包含默认配置和自定义配置
 */
export const getDownloadSelectorList = async (): Promise<SelectorConfig[]> => {
  const customSelectors =
    (await storage.get<SelectorConfig[] | undefined>(
      storageKey.downloadSelectors,
    )) ?? [];
  return customSelectors.concat(defaultDownloadSelectors);
};

export const enableSandbox = async (): Promise<boolean> => {
  const experimental: Experimental | undefined = await storage.get<
    Experimental | undefined
  >(storageKey.experimental);
  return experimental ? experimental.sandbox : false;
};

export const watchStorage = (callback: StorageWatchCallback) => {
  const callbackMap: StorageCallbackMap = {}
  for (let key in storageKey) {
    callbackMap[storageKey[key]] = callback;
    console.log("watching", storageKey[key]);
  }
  storage.watch(callbackMap);
}
