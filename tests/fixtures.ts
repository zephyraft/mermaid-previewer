import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  type BrowserContext,
  type Worker,
  test as base,
  chromium,
} from "@playwright/test";

async function getExtensionWorker(context: BrowserContext) {
  const extension = resolve(
    process.env.PLAYWRIGHT_EXTENSION_DIR || "dist/chrome",
  );
  const manifest = JSON.parse(
    await readFile(resolve(extension, "manifest.json"), "utf8"),
  );
  const isExtension = (worker: Worker) => {
    const url = new URL(worker.url());
    return (
      url.protocol === "chrome-extension:" &&
      url.pathname === `/${manifest.background.service_worker}`
    );
  };
  return (
    context.serviceWorkers().find(isExtension) ??
    (await context.waitForEvent("serviceworker", { predicate: isExtension }))
  );
}

export const test = base.extend<{
  context: BrowserContext;
  extensionWorker: Worker;
  optionsURL: string;
  downloadDir: string;
}>({
  downloadDir: async ({}, use, testInfo) => {
    const directory = testInfo.outputPath("downloads");
    await mkdir(directory, { recursive: true });
    await use(directory);
  },
  context: async ({ downloadDir }, use) => {
    const pathToExtension = resolve(
      process.env.PLAYWRIGHT_EXTENSION_DIR || "dist/chrome",
    );
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      downloadsPath: downloadDir,
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: { width: 1920, height: 1080 },
    });
    try {
      const worker = await getExtensionWorker(context);
      await expect
        .poll(() =>
          worker.evaluate(async () => {
            if (typeof chrome === "undefined" || !chrome.scripting) return 0;
            const scripts = await chrome.scripting.getRegisteredContentScripts({
              ids: ["mermaid-previewer"],
            });
            return scripts.length;
          }),
        )
        .toBe(1);
      await use(context);
    } finally {
      await context.close();
    }
  },
  extensionWorker: async ({ context }, use) => {
    await use(await getExtensionWorker(context));
  },
  optionsURL: async ({ extensionWorker }, use) => {
    await use(
      await extensionWorker.evaluate(() => {
        const optionsPage = chrome.runtime.getManifest().options_ui?.page;
        if (!optionsPage)
          throw new Error("The extension manifest is missing its options page");
        return chrome.runtime.getURL(optionsPage);
      }),
    );
  },
});

export const expect = test.expect;
