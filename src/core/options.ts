import { Storage, type StorageCallbackMap, type StorageWatchCallback } from "@plasmohq/storage";

import type { ExcludeConfig, Experimental, SelectorConfig, ThemeSetting } from "~types";

const storage = new Storage();
const storageKeyPrefix = "mermaid-previewer.";

export const storageKey = {
  excludeURLs: `${storageKeyPrefix}excludeURLs`,
  matchSelectors: `${storageKeyPrefix}matchSelectors`,
  downloadSelectors: `${storageKeyPrefix}downloadSelectors`,
  experimental: `${storageKeyPrefix}experimental`,
  theme: `${storageKeyPrefix}theme`,
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

/**
 * 主题状态循环顺序：light -> dark -> auto
 */
const themeCycle: ThemeSetting[] = ["light", "dark", "auto"];

/**
 * 获取当前主题设置，默认 auto
 */
export const getThemeSetting = async (): Promise<ThemeSetting> => {
  return (await storage.get<ThemeSetting>(storageKey.theme)) ?? "auto";
};

/**
 * 保存主题设置（全局持久化）
 */
export const setThemeSetting = async (theme: ThemeSetting): Promise<void> => {
  await storage.set(storageKey.theme, theme);
};

/**
 * 解析实际生效的主题：auto 跟随系统深色模式
 */
export const getEffectiveTheme = async (): Promise<"light" | "dark"> => {
  const setting = await getThemeSetting();
  if (setting === "light") {
    return "light";
  }
  if (setting === "dark") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * 循环到下一个主题状态
 */
export const cycleTheme = (current: ThemeSetting): ThemeSetting => {
  const index = themeCycle.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % themeCycle.length;
  return themeCycle[nextIndex];
};

export const watchStorage = (callback: StorageWatchCallback) => {
  const callbackMap: StorageCallbackMap = {}
  for (let key in storageKey) {
    callbackMap[storageKey[key]] = callback;
    console.log("watching", storageKey[key]);
  }
  storage.watch(callbackMap);
}
