import type { ExcludeConfig, Experimental, SelectorConfig } from "~types";

export const storageKey = {
  excludeURLs: "mermaid-previewer.excludeURLs",
  matchSelectors: "mermaid-previewer.matchSelectors",
  downloadSelectors: "mermaid-previewer.downloadSelectors",
  experimental: "mermaid-previewer.experimental",
} as const;

type Settings = {
  [storageKey.excludeURLs]: ExcludeConfig[];
  [storageKey.matchSelectors]: SelectorConfig[];
  [storageKey.downloadSelectors]: SelectorConfig[];
  [storageKey.experimental]: Experimental;
};

const legacyKey: Partial<Record<keyof Settings, string>> = {
  [storageKey.excludeURLs]: "excludeDomainList",
  [storageKey.matchSelectors]: "matchSelectorList",
};

export const ruleStorageKeys = [
  storageKey.excludeURLs,
  storageKey.matchSelectors,
  storageKey.downloadSelectors,
  "excludeDomainList",
  "matchSelectorList",
];

export const defaultExcludes: ExcludeConfig[] = [
  { match: "https://chromewebstore.google.com/*" },
];

export const defaultMatchSelectors: SelectorConfig[] = [
  { match: "*://bitbucket.org/*", selector: "div.codehilite > pre" },
  { match: "file:///*.mmd", selector: "body > pre" },
  { match: "file:///*.mermaid", selector: "body > pre" },
];

export const defaultDownloadSelectors: SelectorConfig[] = [
  {
    match: "https://viewscreen.githubusercontent.com/markdown/mermaid*",
    selector: "div.mermaid-view div.mermaid",
  },
  { match: "https://gitlab.com/-/sandbox/mermaid*", selector: "div#app" },
];

const defaults: Settings = {
  [storageKey.excludeURLs]: [],
  [storageKey.matchSelectors]: [],
  [storageKey.downloadSelectors]: [],
  [storageKey.experimental]: { sandbox: false },
};

export function decodeSetting<K extends keyof Settings>(
  key: K,
  value: unknown,
): Settings[K] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (error) {
      console.warn(`Invalid Mermaid Previewer setting ${key}`, error);
      return defaults[key];
    }
  }

  if (key === storageKey.experimental) {
    return (
      value &&
      typeof value === "object" &&
      "sandbox" in value &&
      typeof value.sandbox === "boolean"
        ? value
        : defaults[key]
    ) as Settings[K];
  }

  if (!Array.isArray(value)) return defaults[key];
  return value.filter(
    (rule) =>
      rule &&
      (typeof rule.match === "string" || typeof rule.regex === "string") &&
      (key === storageKey.excludeURLs || typeof rule.selector === "string"),
  ) as Settings[K];
}

function decodeStoredSetting<K extends keyof Settings>(
  key: K,
  stored: Record<string, unknown>,
) {
  if (Object.hasOwn(stored, key)) return decodeSetting(key, stored[key]);
  const fallback = legacyKey[key];
  const oldValue = fallback && stored[fallback];
  if (!Array.isArray(oldValue)) return defaults[key];

  // Releases before Plasmo stored literal URL fragments and unscoped CSS selectors.
  const strings = oldValue.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  const rules =
    key === storageKey.excludeURLs
      ? strings.map((fragment) => ({
          regex: fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        }))
      : strings.map((selector) => ({ match: "<all_urls>", selector }));
  return decodeSetting(key, rules);
}

export function settingKeys<K extends keyof Settings>(key: K) {
  const fallback = legacyKey[key];
  return fallback ? [key, fallback] : [key];
}

export async function readSetting<K extends keyof Settings>(
  key: K,
): Promise<Settings[K]> {
  return decodeStoredSetting(
    key,
    await chrome.storage.sync.get(settingKeys(key)),
  );
}

export async function writeSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
) {
  // Plasmo 1.x stores each setting as a JSON string in sync storage.
  await chrome.storage.sync.set({ [key]: JSON.stringify(value) });
}

export async function readRules() {
  const { excludeURLs, matchSelectors, downloadSelectors } = storageKey;
  const stored = await chrome.storage.sync.get(ruleStorageKeys);
  return {
    excludes: [...defaultExcludes, ...decodeStoredSetting(excludeURLs, stored)],
    preview: [
      ...defaultMatchSelectors,
      ...decodeStoredSetting(matchSelectors, stored),
    ],
    download: [
      ...defaultDownloadSelectors,
      ...decodeStoredSetting(downloadSelectors, stored),
    ],
  };
}
