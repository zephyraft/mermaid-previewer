import type {
  DiagramTheme,
  ExcludeConfig,
  PreviewConfig,
  Renderer,
  SelectorConfig,
} from "~types";

export const storageKey = {
  excludeURLs: "mermaid-previewer.excludeURLs",
  matchSelectors: "mermaid-previewer.matchSelectors",
  downloadSelectors: "mermaid-previewer.downloadSelectors",
  renderer: "mermaid-previewer.renderer",
  theme: "mermaid-previewer.theme",
} as const;

// Older versions ignore entries without a URL pattern or regular expression.
type RuleOverride =
  { disabledDefault: string } | { liveDefault: string; live: boolean };
export type RuleEntry<T extends ExcludeConfig> = T | RuleOverride;
export type DefaultRule<T extends ExcludeConfig> = T & { id: string };

type Settings = {
  [storageKey.excludeURLs]: RuleEntry<ExcludeConfig>[];
  [storageKey.matchSelectors]: RuleEntry<PreviewConfig>[];
  [storageKey.downloadSelectors]: RuleEntry<SelectorConfig>[];
  [storageKey.renderer]: Renderer;
  [storageKey.theme]: DiagramTheme;
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
export const localMarkdownPreviewRule: DefaultRule<PreviewConfig> = {
  id: "local-markdown",
  match: "file:///*.md",
  selector: `[${markdownFenceAttribute}]`,
};

export const defaultMatchSelectors: DefaultRule<PreviewConfig>[] = [
  {
    id: "bitbucket",
    match: "*://bitbucket.org/*",
    selector: "div.codehilite > pre",
  },
  {
    id: "gemini",
    match: "https://gemini.google.com/*",
    selector: ".code-block pre > code",
    live: true,
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
  [storageKey.renderer]: "pele",
  [storageKey.theme]: "auto",
};

export function isRuleOverride(value: unknown): value is RuleOverride {
  return (
    !!value &&
    typeof value === "object" &&
    (("disabledDefault" in value &&
      typeof value.disabledDefault === "string") ||
      ("liveDefault" in value &&
        typeof value.liveDefault === "string" &&
        "live" in value &&
        typeof value.live === "boolean"))
  );
}

export function resolveRuleSettings<T extends ExcludeConfig>(
  defaultRules: DefaultRule<T>[],
  entries: RuleEntry<T>[],
) {
  const disabledDefaults = new Set<string>();
  const liveDefaults = new Map<string, boolean>();
  for (const entry of entries.filter(isRuleOverride)) {
    if ("disabledDefault" in entry) disabledDefaults.add(entry.disabledDefault);
    else liveDefaults.set(entry.liveDefault, entry.live);
  }
  return {
    defaultConfigs: defaultRules.map((rule) => {
      const disabled = disabledDefaults.has(rule.id);
      const live = liveDefaults.get(rule.id);
      if (!disabled && live === undefined) return rule;
      return {
        ...rule,
        ...(disabled && { enabled: false }),
        ...(live !== undefined && { live }),
      };
    }),
    customConfigs: entries.filter(
      (entry): entry is T => !isRuleOverride(entry),
    ),
  };
}

export function isDiagramTheme(value: unknown): value is DiagramTheme {
  return value === "auto" || value === "light" || value === "dark";
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

  if (key === storageKey.theme) {
    return (isDiagramTheme(value) ? value : "auto") as Settings[K];
  }

  if (!Array.isArray(value)) return defaults[key];
  return value.filter((rule) => {
    if (isRuleOverride(rule)) {
      return "disabledDefault" in rule || key === storageKey.matchSelectors;
    }
    return (
      rule &&
      (typeof rule.match === "string" || typeof rule.regex === "string") &&
      (key === storageKey.excludeURLs || typeof rule.selector === "string")
    );
  }) as Settings[K];
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
