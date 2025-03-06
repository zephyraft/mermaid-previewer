import { type BrowserContext, test as base, chromium } from "@playwright/test";
import * as process from "process";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = process.env.PLAYWRIGHT_EXTENSION_DIR;
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--headless=new`, // the new headless arg for chrome v109+. Use '--headless=chrome' as arg for browsers v94-108.
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      // 防止自动化检测
      ignoreDefaultArgs: ["--enable-automation"],
      downloadsPath: process.env.PLAYWRIGHT_DOWNLOAD_DIR,
      // 放大窗口，避免iframe不在首屏时的各类问题
      viewport: {
        width: 1920,
        height: 1080,
      },
    });
    await context.addCookies([
      {
        name: "cloud.session.token",
        value: process.env.PLAYWRIGHT_BITBUCKET_COOKIE,
        domain: "bitbucket.org",
        path: "/",
      },
    ]);
    // 防止自动化检测
    await context.addInitScript(
      "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})",
    );
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});
export const expect = test.expect;
