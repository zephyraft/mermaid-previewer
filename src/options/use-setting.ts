import { type SetStateAction, useEffect, useState } from "react";

import {
  decodeSetting,
  readSetting,
  settingKeys,
  writeSetting,
} from "~core/options";

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
