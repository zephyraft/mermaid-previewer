type IconCatalog = {
  icons: Record<string, string>;
  aliases: Record<string, string>;
};

const packs: Record<string, string[]> = {
  fa: ["solid", "brands"],
  fas: ["solid"],
  far: ["regular"],
  fab: ["brands"],
  "fa-solid": ["solid"],
  "fa-regular": ["regular"],
  "fa-brands": ["brands"],
};

let catalogRequest: Promise<IconCatalog> | undefined;

export async function resolveFontAwesome(names: string[]) {
  catalogRequest ??= fetch(chrome.runtime.getURL("fontawesome-icons.json"))
    .then(async (response) => {
      if (!response.ok)
        throw new Error("Could not load bundled Font Awesome icons");
      return (await response.json()) as IconCatalog;
    })
    .catch((error) => {
      catalogRequest = undefined;
      throw error;
    });
  const { icons, aliases } = await catalogRequest;
  const resolved: Record<string, string> = {};
  for (const reference of names) {
    const [pack, name] = reference.toLowerCase().split(":");
    if (!Object.hasOwn(packs, pack) || !/^[a-z0-9-]+$/.test(name ?? ""))
      continue;
    const icon = name.replace(/^fa-/, "");
    for (const style of packs[pack]) {
      const key = `${style}:${icon}`;
      const svg = icons[key] ?? icons[`${style}:${aliases[key]}`];
      if (svg) {
        resolved[reference] = svg.replace(
          /^<svg\b/,
          '<svg data-font-awesome="true"',
        );
        break;
      }
    }
  }
  return resolved;
}
