import type {
  ExcludeConfig,
  Experimental,
  Renderer,
  SelectorConfig,
} from "~types";

export const storageKey = {
  excludeURLs: "mermaid-previewer.excludeURLs",
  matchSelectors: "mermaid-previewer.matchSelectors",
  downloadSelectors: "mermaid-previewer.downloadSelectors",
  experimental: "mermaid-previewer.experimental",
  renderer: "mermaid-previewer.renderer",
} as const;

// Older versions ignore entries without a URL pattern or regular expression.
type DisabledDefaultRule = { disabledDefault: string };
export type RuleEntry<T extends ExcludeConfig> = T | DisabledDefaultRule;
export type DefaultRule<T extends ExcludeConfig> = T & { id: string };

type Settings = {
  [storageKey.excludeURLs]: RuleEntry<ExcludeConfig>[];
  [storageKey.matchSelectors]: RuleEntry<SelectorConfig>[];
  [storageKey.downloadSelectors]: RuleEntry<SelectorConfig>[];
  [storageKey.experimental]: Experimental;
  [storageKey.renderer]: Renderer;
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

export const defaultExcludes: DefaultRule<ExcludeConfig>[] = [
  { id: "chrome-web-store", match: "https://chromewebstore.google.com/*" },
];

export const markdownFenceAttribute = "data-mermaid-previewer-fence";
export const localMarkdownPreviewRule: DefaultRule<SelectorConfig> = {
  id: "local-markdown",
  match: "file:///*.md",
  selector: `[${markdownFenceAttribute}]`,
};

export const defaultMatchSelectors: DefaultRule<SelectorConfig>[] = [
  {
    id: "bitbucket",
    match: "*://bitbucket.org/*",
    selector: "div.codehilite > pre",
  },
  localMarkdownPreviewRule,
  { id: "local-mmd", match: "file:///*.mmd", selector: "body > pre" },
  { id: "local-mermaid", match: "file:///*.mermaid", selector: "body > pre" },
];

export const defaultDownloadSelectors: DefaultRule<SelectorConfig>[] = [
  {
    id: "github",
    match: "https://viewscreen.githubusercontent.com/markdown/mermaid*",
    selector: "div.mermaid-view div.mermaid",
  },
  {
    id: "gitlab",
    match: "https://gitlab.com/-/sandbox/mermaid*",
    selector: "div#app",
  },
];

const defaults: Settings = {
  [storageKey.excludeURLs]: [],
  [storageKey.matchSelectors]: [],
  [storageKey.downloadSelectors]: [],
  [storageKey.experimental]: { sandbox: false },
  [storageKey.renderer]: "pele",
};

export function isDisabledDefaultRule(
  value: unknown,
): value is DisabledDefaultRule {
  return (
    !!value &&
    typeof value === "object" &&
    "disabledDefault" in value &&
    typeof value.disabledDefault === "string"
  );
}

export function resolveRuleSettings<T extends ExcludeConfig>(
  defaultRules: DefaultRule<T>[],
  entries: RuleEntry<T>[],
) {
  const disabledDefaults = new Set(
    entries.filter(isDisabledDefaultRule).map((entry) => entry.disabledDefault),
  );
  return {
    defaultConfigs: defaultRules.map((rule) =>
      disabledDefaults.has(rule.id) ? { ...rule, enabled: false } : rule,
    ),
    customConfigs: entries.filter(
      (entry): entry is T => !isDisabledDefaultRule(entry),
    ),
  };
}

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

  if (key === storageKey.renderer) {
    return (value === "mermaid" ? "mermaid" : "pele") as Settings[K];
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
      isDisabledDefaultRule(rule) ||
      (rule &&
        (typeof rule.match === "string" || typeof rule.regex === "string") &&
        (key === storageKey.excludeURLs || typeof rule.selector === "string")),
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

function enabledRules<T extends ExcludeConfig>(
  defaultRules: DefaultRule<T>[],
  entries: RuleEntry<T>[],
) {
  const { defaultConfigs, customConfigs } = resolveRuleSettings(
    defaultRules,
    entries,
  );
  return [...defaultConfigs, ...customConfigs].filter(
    (rule) => rule.enabled !== false,
  );
}

export async function readRules() {
  const { excludeURLs, matchSelectors, downloadSelectors } = storageKey;
  const stored = await chrome.storage.sync.get(ruleStorageKeys);
  return {
    excludes: enabledRules(
      defaultExcludes,
      decodeStoredSetting(excludeURLs, stored),
    ),
    preview: enabledRules(
      defaultMatchSelectors,
      decodeStoredSetting(matchSelectors, stored),
    ),
    download: enabledRules(
      defaultDownloadSelectors,
      decodeStoredSetting(downloadSelectors, stored),
    ),
  };
}
