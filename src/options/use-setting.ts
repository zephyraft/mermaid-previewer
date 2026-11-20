import { type SetStateAction, useEffect, useState } from "react";

import {
  decodeSetting,
  type DefaultRule,
  isRuleOverride,
  readSetting,
  resolveRuleSettings,
  type RuleEntry,
  settingKeys,
  writeSetting,
} from "~core/options";
import type { ExcludeConfig } from "~types";

type SettingKey = Parameters<typeof readSetting>[0];
type Setting<K extends SettingKey> = ReturnType<typeof decodeSetting<K>>;

export function useSetting<K extends SettingKey>(key: K) {
  const [value, setValue] = useState<Setting<K>>(() =>
    decodeSetting(key, undefined),
  );

  useEffect(() => {
    let active = true;
    let revision = 0;
    const syncFromStorage = () => {
      const readRevision = ++revision;
      void readSetting(key)
        .then((stored) => {
          if (active && readRevision === revision) setValue(stored);
        })
        .catch(console.error);
    };
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "sync" && settingKeys(key).some((name) => name in changes))
        syncFromStorage();
    };
    chrome.storage.onChanged.addListener(onChange);
    syncFromStorage();
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChange);
    };
  }, [key]);

  const save = (next: SetStateAction<Setting<K>>) => {
    // Multiple settings tabs can edit the same sync key.
    return navigator.locks
      .request(key, async () => {
        const value =
          typeof next === "function" ? next(await readSetting(key)) : next;
        await writeSetting(key, value);
      })
      .catch(console.error);
  };

  return [value, save] as const;
}

type RuleFields = ExcludeConfig & { selector?: string; live?: boolean };

export function bindRuleSettings<T extends RuleFields>(
  defaultRules: DefaultRule<T>[],
  [entries, save]: readonly [
    RuleEntry<T>[],
    (next: SetStateAction<RuleEntry<T>[]>) => Promise<void>,
  ],
) {
  const { defaultConfigs, customConfigs } = resolveRuleSettings(
    defaultRules,
    entries,
  );

  function setCustomConfigs(update: SetStateAction<T[]>) {
    return save((current) => {
      const custom = current.filter(
        (entry): entry is T => !isRuleOverride(entry),
      );
      return [
        ...current.filter(isRuleOverride),
        ...(typeof update === "function" ? update(custom) : update),
      ];
    });
  }

  function setRuleOption(
    index: number,
    option: "enabled" | "live",
    value: boolean,
  ) {
    const defaultRule = defaultRules[index];
    if (defaultRule) {
      return save((current) => {
        if (option === "enabled") {
          const other = current.filter(
            (entry) =>
              !(
                "disabledDefault" in entry &&
                entry.disabledDefault === defaultRule.id
              ),
          );
          return value
            ? other
            : [...other, { disabledDefault: defaultRule.id }];
        }
        const other = current.filter(
          (entry) =>
            !("liveDefault" in entry && entry.liveDefault === defaultRule.id),
        );
        return value === (defaultRule.live === true)
          ? other
          : [...other, { liveDefault: defaultRule.id, live: value }];
      });
    }

    const customIndex = index - defaultRules.length;
    const rule: RuleFields = customConfigs[customIndex];
    const matches = (other: RuleFields) =>
      other.match === rule.match &&
      other.regex === rule.regex &&
      other.selector === rule.selector;
    // Other tabs can add or remove rules before this row while the write waits.
    const occurrence = customConfigs
      .slice(0, customIndex)
      .filter(matches).length;
    const count = customConfigs.filter(matches).length;
    return setCustomConfigs((current) => {
      const matchingRules = current.filter(matches);
      if (matchingRules.length !== count) return current;
      const target = matchingRules[occurrence];
      return current.map((entry) =>
        entry === target ? { ...entry, [option]: value } : entry,
      );
    });
  }

  return {
    defaultConfigs,
    customConfigs,
    setCustomConfigs,
    setRuleEnabled: (index: number, enabled: boolean) =>
      setRuleOption(index, "enabled", enabled),
    setRuleLive: (index: number, live: boolean) =>
      setRuleOption(index, "live", live),
    resetRules: () => save([]),
  };
}
