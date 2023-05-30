import { type BrowserContext, test as base, chromium } from "@playwright/test"
import path from "path"
import * as process from "process"

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    console.log(__dirname)
    // const pathToExtension =
    // "/Users/zhonghaoyuan/IdeaProjects/mermaid-previewer/build/chrome-mv3-prod"
    const pathToExtension = process.env.EXTENSION_DIR
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent("serviceworker")

    const extensionId = background.url().split("/")[2]
    await use(extensionId)
  }
})
export const expect = test.expect
