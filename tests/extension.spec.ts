import { expect, test } from "./fixtures"

test("example test", async ({ page }) => {
  await page.goto("https://example.com")
  await expect(page.locator("body")).toHaveText("Changed by my-extension")
})

test("option page", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`)
  await expect(page.locator("body")).toContainText("Mermaid Previewer")
})
