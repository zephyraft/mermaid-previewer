import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const projectFile = (path) => new URL(path, new URL("../", import.meta.url));
const fontAwesomeRoot = projectFile(
  "node_modules/@fortawesome/fontawesome-free/",
);
const fontPath = /\.\.\/webfonts\/([\w.-]+\.woff2)/g;

await mkdir(projectFile("public"), { recursive: true });

const fontAwesome = await readFile(
  new URL("css/all.min.css", fontAwesomeRoot),
  "utf8",
);
const fontFiles = new Set(
  [...fontAwesome.matchAll(fontPath)].map(([, file]) => file),
);
const fontUrls = new Map(
  await Promise.all(
    [...fontFiles].map(async (file) => {
      const font = await readFile(new URL(`webfonts/${file}`, fontAwesomeRoot));
      return [file, `data:font/woff2;base64,${font.toString("base64")}`];
    }),
  ),
);

const fontAwesomeMetadata = JSON.parse(
  await readFile(
    new URL("metadata/icon-families.json", fontAwesomeRoot),
    "utf8",
  ),
);
const icons = {};
const aliases = {};
for (const [name, icon] of Object.entries(fontAwesomeMetadata)) {
  for (const { family, style } of icon.familyStylesByLicense.free) {
    if (family !== "classic") continue;
    const svg = icon.svgs.classic?.[style]?.raw;
    if (svg) {
      icons[`${style}:${name}`] = svg;
      for (const alias of icon.aliases?.names ?? []) {
        aliases[`${style}:${alias}`] = name;
      }
    }
  }
}

const mermaid = await readFile(
  projectFile("node_modules/mermaid/dist/mermaid.min.js"),
  "utf8",
);

await Promise.all([
  // Disable Mermaid's window load handler before the injected script yields.
  writeFile(
    projectFile("public/mermaid.min.js"),
    mermaid + "\n;globalThis.mermaid.startOnLoad = false;\n",
  ),
  copyFile(
    projectFile("node_modules/pele/dist/pele.global.js"),
    projectFile("public/pele.global.js"),
  ),
  copyFile(
    new URL("LICENSE.txt", fontAwesomeRoot),
    projectFile("public/fontawesome-license.txt"),
  ),
  writeFile(
    projectFile("public/fontawesome-icons.json"),
    JSON.stringify({ icons, aliases }),
  ),
  writeFile(
    projectFile("public/fontawesome.css"),
    fontAwesome.replace(fontPath, (_, file) => fontUrls.get(file)),
  ),
]);
