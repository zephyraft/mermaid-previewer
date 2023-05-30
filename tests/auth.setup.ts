import { test as setup } from "@playwright/test"
import * as process from "process"

const authFile = "playwright/.auth/user.json"

setup("authenticate", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("https://bitbucket.org/account/signin/")
  await page
    .locator("#username")
    .fill(process.env.PLAYWRIGHT_BITBUCKET_USERNAME)
  await page.locator("#login-submit").click()
  await page
    .locator("#password")
    .fill(process.env.PLAYWRIGHT_BITBUCKET_PASSWORD)
  await page.locator("#login-submit").click()
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("https://bitbucket.org/zephyraft/workspace/overview")

  // End of authentication steps.
  await page.context().storageState({ path: authFile })
})
