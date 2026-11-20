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

await Promise.all([
  copyFile(
    projectFile("node_modules/mermaid/dist/mermaid.min.js"),
    projectFile("public/mermaid.min.js"),
  ),
  writeFile(
    projectFile("public/fontawesome.css"),
    fontAwesome.replace(fontPath, (_, file) => fontUrls.get(file)),
  ),
]);
