import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { expect, test } from "./fixtures";

async function completedDownloads(directory: string) {
  return (await readdir(directory)).filter(
    (file) => !file.endsWith(".crdownload"),
  );
}

const source = "flowchart LR\n  A --> B";
const nativeSVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="120"><rect width="280" height="120" fill="royalblue"/></svg>';

test("recovers the first local page when Chrome misses declarative injection", async ({
  page,
  extensionWorker,
}) => {
  const url = pathToFileURL(resolve("doc/issue-395.html")).href;
  const pattern = "file:///*/issue-395.html";
  await extensionWorker.evaluate(
    (match) =>
      chrome.storage.sync.set({
        "mermaid-previewer.matchSelectors": JSON.stringify([
          { match, selector: "code.language-mermaid" },
        ]),
      }),
    pattern,
  );
  await expect
    .poll(() =>
      extensionWorker.evaluate(async () => {
        const [script] = await chrome.scripting.getRegisteredContentScripts({
          ids: ["mermaid-previewer"],
        });
        return script?.matches ?? [];
      }),
    )
    .toContain(pattern);
  await extensionWorker.evaluate(() =>
    chrome.scripting.unregisterContentScripts({
      ids: ["mermaid-previewer"],
    }),
  );

  await page.goto(url);
  const diagrams = page.locator("code.language-mermaid > svg.pele");
  await expect(diagrams).toHaveCount(1);
  await extensionWorker.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["scripts/site.js"],
    });
  }, url);
  await page.locator("main").evaluate((main) => {
    const code = document.createElement("code");
    code.className = "language-mermaid";
    code.style.whiteSpace = "pre";
    code.textContent = "flowchart LR\n  C --> D";
    main.append(code);
  });
  await expect(diagrams).toHaveCount(2);
  await expect(page.locator("#mermaid-previewer-exporter")).toHaveCount(1);
});

test("preserves legacy URL regex rules and ignores the retired Sandbox preference", async ({
  context,
  page,
  optionsURL,
  extensionWorker,
  downloadDir,
}) => {
  await extensionWorker.evaluate(() =>
    chrome.storage.sync.set({
      "mermaid-previewer.excludeURLs": JSON.stringify([
        { regex: "^https://legacy[.]example/blocked" },
      ]),
      "mermaid-previewer.matchSelectors": JSON.stringify([
        { regex: "^https://legacy[.]example/", selector: ".legacy-diagram" },
        { match: "https://modern.example/*", selector: ".modern-diagram" },
      ]),
      "mermaid-previewer.downloadSelectors": JSON.stringify([
        { regex: "^https://legacy[.]example/native", selector: "#native" },
      ]),
      "mermaid-previewer.experimental": JSON.stringify({ sandbox: true }),
    }),
  );
  await expect
    .poll(async () =>
      extensionWorker.evaluate(
        async () =>
          (
            await chrome.scripting.getRegisteredContentScripts({
              ids: ["mermaid-previewer"],
            })
          )[0].matches,
      ),
    )
    .toContain("https://*/*");

  await context.route("https://legacy.example/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<pre class="legacy-diagram">${source}</pre>`,
    }),
  );
  await context.route("https://modern.example/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<pre class="modern-diagram">${source}</pre>`,
    }),
  );
  await page.goto("https://legacy.example/diagram");
  const legacyDiagram = page.locator(".legacy-diagram > svg.pele");
  await expect(legacyDiagram).toBeVisible();
  await legacyDiagram.hover();
  await page.getByRole("button", { name: "Open preview" }).click();
  const viewer = page.getByRole("dialog", { name: "Diagram preview" });
  await expect(
    viewer.getByRole("img", { name: "Mermaid diagram" }),
  ).toBeVisible();
  await viewer.getByRole("button", { name: "Close preview" }).click();
  await legacyDiagram.hover();
  await page.getByRole("button", { name: "Download SVG" }).click();
  await expect
    .poll(async () => (await completedDownloads(downloadDir)).length)
    .toBe(1);
  const [download] = await completedDownloads(downloadDir);
  await expect
    .poll(() => readFile(join(downloadDir, download), "utf8"))
    .toContain("<svg");

  await page.goto("https://modern.example/diagram");
  await expect(page.locator(".modern-diagram > svg.pele")).toBeVisible();
  await page.goto("https://legacy.example/blocked");
  await expect(page.locator(".legacy-diagram")).toHaveText(source);
  await expect(legacyDiagram).toHaveCount(0);

  await page.goto(optionsURL);
  await expect(
    page.getByText("^https://legacy[.]example/", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("https://modern.example/*", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("^https://legacy[.]example/native", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Rendering engine" }),
  ).toHaveValue("pele");
});

test("honors the explicit ports in 1.5.2 URL match patterns", async ({
  context,
  page,
  extensionWorker,
}) => {
  const host = "https://upgrade-test.example";
  const origin = host + ":8443";
  const match = origin + "/*";
  await extensionWorker.evaluate(
    ({ host, origin, match }) =>
      chrome.storage.sync.set({
        "mermaid-previewer.excludeURLs": JSON.stringify([
          { match: origin + "/blocked" },
        ]),
        "mermaid-previewer.matchSelectors": JSON.stringify([
          { match, selector: ".source" },
          { match: host + ":443/blocked", selector: ".source" },
        ]),
        "mermaid-previewer.downloadSelectors": JSON.stringify([
          { match: origin + "/native", selector: "#native" },
        ]),
      }),
    { host, origin, match },
  );
  await expect
    .poll(() =>
      extensionWorker.evaluate(async () => {
        const [script] = await chrome.scripting.getRegisteredContentScripts({
          ids: ["mermaid-previewer"],
        });
        return script?.matches ?? [];
      }),
    )
    .toContain(match);

  await context.route(
    (url) => url.origin === origin || url.origin === host,
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<pre class="source">${source}</pre><div id="native">${nativeSVG}</div>`,
      }),
  );
  const preview = page.locator(".source > svg.pele");
  await page.goto(origin + "/native");
  await expect(preview).toBeVisible();
  await page.locator("#native svg").hover();
  await expect(
    page.getByRole("button", { name: "Download SVG" }),
  ).toBeVisible();

  await page.goto(origin + "/blocked");
  await expect(page.locator(".source")).toHaveText(source);
  await expect(preview).toHaveCount(0);

  await page.goto(host + "/blocked");
  await expect(preview).toBeVisible();
  await page.goto(host + "/native");
  await expect(page.locator(".source")).toHaveText(source);
  await expect(page.locator("#mermaid-previewer-exporter")).toHaveCount(0);
});

test("exports a native diagram added to a GitHub Mermaid iframe", async ({
  context,
  page,
  downloadDir,
}) => {
  const frameURL =
    "https://viewscreen.githubusercontent.com/markdown/mermaid?test=1";
  await context.route("https://github.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<iframe src="${frameURL}" width="700" height="400"></iframe>`,
    }),
  );
  await context.route(frameURL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div class="mermaid-view"><div class="mermaid"></div></div>',
    }),
  );

  await page.goto("https://github.com/local-test");
  const frame = page.frameLocator("iframe");
  const target = frame.locator(".mermaid");
  await target.evaluate((element, markup) => {
    element.innerHTML = markup;
  }, nativeSVG);
  await expect(frame.locator("#mermaid-previewer-exporter")).toBeAttached();
  await target.locator("svg").hover();
  await frame.getByRole("button", { name: "Open preview" }).click();
  const viewer = page.getByRole("dialog", { name: "Diagram preview" });
  await expect(
    viewer.getByRole("img", { name: "Mermaid diagram" }),
  ).toBeVisible();
  await viewer.getByRole("button", { name: "Close preview" }).click();
  await target.locator("svg").hover();
  const controls = frame.locator("#mermaid-previewer-controls");
  await expect(controls.locator("#copy")).toBeHidden();
  await controls.locator("#download").click();

  await expect
    .poll(async () => (await completedDownloads(downloadDir)).length)
    .toBe(1);
  const [download] = await completedDownloads(downloadDir);
  await expect
    .poll(() => readFile(join(downloadDir, download), "utf8"))
    .toBe(nativeSVG);
  await expect(page.locator("#mermaid-previewer-exporter")).toHaveCount(0);
});

test("preserves pre-Plasmo selectors and literal URL exclusions", async ({
  context,
  page,
  extensionWorker,
}) => {
  await extensionWorker.evaluate(() =>
    chrome.storage.sync.set({
      excludeDomainList: ["rules.example/private?stage=2"],
      matchSelectorList: [".old-diagram"],
    }),
  );
  await expect
    .poll(async () =>
      extensionWorker.evaluate(
        async () =>
          (
            await chrome.scripting.getRegisteredContentScripts({
              ids: ["mermaid-previewer"],
            })
          )[0].matches,
      ),
    )
    .toContain("<all_urls>");

  await context.route("https://rules.example/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<pre class="old-diagram">${source}</pre>`,
    }),
  );
  await page.goto("https://rules.example/private?stage=2");
  await expect(page.locator(".old-diagram")).toHaveText(source);
  await page.goto("https://rules.example/private?stage=1");
  await expect(page.locator(".old-diagram svg")).toBeVisible();
});

test("applies individual rule switches on reload and unregisters when no include rules remain", async ({
  context,
  page,
  optionsURL,
  extensionWorker,
}) => {
  const origin = "https://rule-toggles.example";
  const pattern = `${origin}/*`;
  const blocked = `${origin}/blocked`;
  const getMatches = () =>
    extensionWorker.evaluate(async () => {
      const [script] = await chrome.scripting.getRegisteredContentScripts({
        ids: ["mermaid-previewer"],
      });
      return script?.matches ?? [];
    });

  await context.route(`${origin}/**`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<pre id="preview">${source}</pre><div id="native">${nativeSVG}</div>`,
    }),
  );
  await extensionWorker.evaluate(
    ({ pattern, blocked }) =>
      chrome.storage.sync.set({
        "mermaid-previewer.excludeURLs": JSON.stringify([{ match: blocked }]),
        "mermaid-previewer.matchSelectors": JSON.stringify([
          { regex: "^https://rule-toggles[.]example/", selector: "#preview" },
        ]),
        "mermaid-previewer.downloadSelectors": JSON.stringify([
          { match: pattern, selector: "#native" },
        ]),
      }),
    { pattern, blocked },
  );
  await expect.poll(getMatches).toContain("https://*/*");

  const settings = await context.newPage();
  await settings.goto(optionsURL);
  const exclusion = settings
    .getByRole("row")
    .filter({ hasText: blocked })
    .getByRole("switch", { name: /^Enable / });
  const preview = settings
    .getByRole("row")
    .filter({ hasText: "#preview" })
    .getByRole("switch", { name: /^Enable / });
  const download = settings
    .getByRole("row")
    .filter({ hasText: "#native" })
    .getByRole("switch", { name: /^Enable / });
  for (const toggle of [exclusion, preview, download]) {
    await expect(toggle).toBeChecked();
  }

  const rendered = page.locator("pre#preview > svg.pele");
  const downloadButton = page.getByRole("button", { name: "Download SVG" });
  await page.goto(`${origin}/public`);
  await expect(rendered).toBeVisible();
  await page.goto(blocked);
  await expect(page.locator("#preview")).toHaveText(source);

  await exclusion.click();
  await expect(exclusion).not.toBeChecked();
  await expect
    .poll(async () =>
      extensionWorker.evaluate(async () => {
        const [script] = await chrome.scripting.getRegisteredContentScripts({
          ids: ["mermaid-previewer"],
        });
        return script?.excludeMatches;
      }),
    )
    .not.toContain(blocked);
  await page.reload();
  await expect(rendered).toBeVisible();

  await preview.click();
  await expect(preview).not.toBeChecked();
  await expect.poll(getMatches).toContain(pattern);
  await expect.poll(getMatches).not.toContain("https://*/*");
  await page.reload();
  await expect(page.locator("#preview")).toHaveText(source);
  await page.locator("#native svg").hover();
  await expect(downloadButton).toBeVisible();

  await download.click();
  await expect(download).not.toBeChecked();
  await expect.poll(getMatches).not.toContain(pattern);
  await page.reload();
  await page.locator("#native svg").hover();
  await expect(page.locator("#mermaid-previewer-exporter")).toHaveCount(0);

  const tables = settings.getByRole("table");
  const includeSwitches = tables
    .nth(1)
    .or(tables.nth(2))
    .getByRole("switch", { name: /^Enable / });
  for (const toggle of await includeSwitches.all()) {
    if (await toggle.isChecked()) {
      await toggle.click();
      await expect(toggle).not.toBeChecked();
    }
  }
  await expect.poll(getMatches).toEqual([]);

  await preview.click();
  await expect(preview).toBeChecked();
  await expect.poll(getMatches).toContain("https://*/*");
  await page.reload();
  await expect(rendered).toBeVisible();
});

test("renders diagrams inserted by a Bitbucket editor preview", async ({
  context,
  page,
}) => {
  await context.route("https://bitbucket.org/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `
      <div class="codehilite"><pre>${source}</pre></div>
      <div id="editor-container" class="maskable"></div>
    `,
    }),
  );
  await page.goto("https://bitbucket.org/local-test");
  await expect(page.locator(".codehilite > pre > svg")).toHaveCount(1);
  const editor = page.locator("#editor-container");
  await editor.evaluate((element, code) => {
    const preview = document.createElement("div");
    preview.className = "codehilite";
    const diagram = document.createElement("pre");
    diagram.textContent = code;
    preview.append(diagram);
    element.append(preview);
  }, source);
  await expect(editor.locator("pre > svg")).toBeVisible();
  await editor.evaluate((element) => element.replaceChildren());
  await expect(page.locator(".codehilite > pre > svg")).toHaveCount(1);
});

test("uses Pele by default and switches renderers for already open pages on reload", async ({
  context,
  page,
  optionsURL,
  extensionWorker,
}) => {
  const url = "https://bitbucket.org/renderer-test";
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div class="codehilite"><pre>${source}</pre></div>`,
    }),
  );

  await page.goto(url);
  await expect(page.locator(".codehilite pre > svg.pele")).toBeVisible();

  const settings = await context.newPage();
  await settings.goto(optionsURL);
  const renderer = settings.getByRole("combobox", { name: "Rendering engine" });
  await expect(renderer).toHaveValue("pele");
  for (const engine of ["mermaid", "pele"] as const) {
    await renderer.selectOption(engine);
    await expect
      .poll(() =>
        extensionWorker.evaluate(async () => {
          const key = "mermaid-previewer.renderer";
          return (await chrome.storage.sync.get(key))[key];
        }),
      )
      .toBe(JSON.stringify(engine));
    await settings.reload();
    await expect(renderer).toHaveValue(engine);
    await page.reload();
    await expect(
      page.locator(
        `.codehilite pre > svg${engine === "pele" ? ".pele" : ":not(.pele)"}`,
      ),
    ).toBeVisible();
  }
});

test("keeps Mermaid-specific settings when a Pele page has mixed diagrams", async ({
  context,
  page,
}) => {
  const url = "https://bitbucket.org/renderer-fallback";
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div class="codehilite">
        <pre id="default-diagram">${source}</pre>
        <pre id="custom-theme">---
config:
  theme: dark
---
${source}</pre>
      </div>`,
    }),
  );
  await page.goto(url);
  await expect(page.locator("#default-diagram > svg.pele")).toBeVisible();
  await expect(page.locator("#custom-theme > svg:not(.pele)")).toBeVisible();
});
