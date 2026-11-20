import { type SetStateAction, useEffect, useState } from "react";

import {
  decodeSetting,
  type DefaultRule,
  isDisabledDefaultRule,
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

type RuleFields = ExcludeConfig & { selector?: string };

export function bindRuleSettings<T extends ExcludeConfig>(
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
        (entry): entry is T => !isDisabledDefaultRule(entry),
      );
      return [
        ...current.filter(isDisabledDefaultRule),
        ...(typeof update === "function" ? update(custom) : update),
      ];
    });
  }

  function setRuleEnabled(index: number, enabled: boolean) {
    const defaultRule = defaultRules[index];
    if (defaultRule) {
      return save((current) => {
        const other = current.filter(
          (entry) =>
            !isDisabledDefaultRule(entry) ||
            entry.disabledDefault !== defaultRule.id,
        );
        return enabled
          ? other
          : [...other, { disabledDefault: defaultRule.id }];
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
        entry === target ? { ...entry, enabled } : entry,
      );
    });
  }

  return {
    defaultConfigs,
    customConfigs,
    setCustomConfigs,
    setRuleEnabled,
    resetRules: () => save([]),
  };
}
