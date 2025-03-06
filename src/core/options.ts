import { Storage } from "@plasmohq/storage";

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
    regex: "https:\\/\\/.*chrome\\.google\\.com.*",
  },
  {
    regex: "chrome:\\/\\/.*",
  },
  {
    regex: "chrome-extension:\\/\\/.*",
  },
];

export const defaultMatchSelectors: SelectorConfig[] = [
  {
    regex: ".*bitbucket\\.org.*",
    selector: "div.codehilite > pre",
  },
  {
    regex: "file:\\/\\/.*.mmd",
    selector: "body > pre",
  },
  {
    regex: "file:\\/\\/.*.mermaid",
    selector: "body > pre",
  },
  {
    regex: ".*gist\\.github\\.com.*",
    selector: "div.highlight-source-mermaid > pre.notranslate",
  },
];

export const defaultDownloadSelectors: SelectorConfig[] = [
  {
    regex: "https:\\/\\/viewscreen\\.githubusercontent\\.com.*",
    selector: "div.mermaid-view div.mermaid",
  },
  {
    regex: "https:\\/\\/.*gitlab\\.com.*",
    selector: "div#app",
  },
];

/**
 * 获取排除域名列表，包含默认配置和自定义配置
 */
export const getExcludeURLRegexes = async (): Promise<ExcludeConfig[]> => {
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
