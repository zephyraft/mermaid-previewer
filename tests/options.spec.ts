import type { Locator, Page } from "@playwright/test"

import { buyMeACoffeeQRCode } from "~options/pages/Coffee"

import * as packageJson from "../package.json"
import { expect, test } from "./fixtures"

const version = packageJson.version
test("配置页正常加载", async ({ page, extensionId }) => {
  await gotoOptionPage(page, extensionId)
  await expect(page.locator("body")).toContainText("Mermaid Previewer")
  await expect(page.locator("body")).toContainText("Exclude URL")
  await expect(page.locator("body")).toContainText("Matching Selectors")
  await expect(page.locator("body")).toContainText("Download Selectors")
})

test("外链正常跳转", async ({ context, page, extensionId }) => {
  await gotoOptionPage(page, extensionId)

  // 点击链接前等待新页面
  const storePagePromise = context.waitForEvent("page")
  await page.getByText("Mermaid Previewer", { exact: true }).click()
  const storePage = await storePagePromise
  await expect(storePage).toHaveURL(
    "https://chromewebstore.google.com/detail/mermaid-previewer/oidjnlhbegipkcklbdfnbkikplpghfdl"
  )

  const releasePagePromise = context.waitForEvent("page")
  await page.getByText(`v${version}`, { exact: true }).click()
  const releasePage = await releasePagePromise
  await expect(releasePage).toHaveURL(
    "https://github.com/zephyraft/mermaid-previewer/releases"
  )

  const githubPagePromise = context.waitForEvent("page")
  await page
    .locator("a[role='button']", { has: page.locator("span > svg") })
    .click()
  const githubPage = await githubPagePromise
  await expect(githubPage).toHaveURL(
    "https://github.com/zephyraft/mermaid-previewer"
  )
})

test("打赏页显示和跳转外链正常", async ({ context, page, extensionId }) => {
  await gotoOptionPage(page, extensionId)
  await page.locator("button[value='Coffee']").click()
  await expect(page.locator(`img[src='${buyMeACoffeeQRCode}']`)).toBeVisible()

  const coffeePagePromise = context.waitForEvent("page")
  await page.locator("a[role='button']", { hasText: "buy me a coffee" }).click()
  const coffeePage = await coffeePagePromise
  await expect(coffeePage).toHaveURL("https://buymeacoffee.com/zephyraft")
})

test("配置ExcludeURL", async ({ page, extensionId }) => {
  await gotoOptionPage(page, extensionId)

  const regex = ".*example1\\.com.*"
  const newRegex = ".*example\\.com.*"

  await testConfig({
    page,
    index: 0,
    addFormTitle: "Add Exclude URL Regex",
    editFormTitle: "Edit Exclude URL Regex",
    onAddFormOpen: async () => {
      await getRegexInputLocator(page).fill(regex)
    },
    onAddFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last()).toHaveText(regex)
    },
    onEditFormOpen: async () => {
      await expect(getRegexInputLocator(page)).toHaveValue(regex)
      await getRegexInputLocator(page).fill(newRegex)
    },
    onEditFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last()).toHaveText(newRegex)
    }
  })
})

test("配置Matching Selectors", async ({ page, extensionId }) => {
  await gotoOptionPage(page, extensionId)

  const regex = ".*example1\\.com.*"
  const selector = "pre > code.test"
  const newRegex = ".*example\\.com.*"
  const newSelector = "pre > code"

  await testConfig({
    page,
    index: 1,
    addFormTitle: "Add Matching Selector",
    editFormTitle: "Edit Selector",
    onAddFormOpen: async () => {
      await getRegexInputLocator(page).fill(regex)
      await getSelectorInputLocator(page).fill(selector)
    },
    onAddFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last().locator("td").first()).toHaveText(regex)
      await expect(rowLocator.last().locator("td").last()).toHaveText(selector)
    },
    onEditFormOpen: async () => {
      await expect(getRegexInputLocator(page)).toHaveValue(regex)
      await expect(getSelectorInputLocator(page)).toHaveValue(selector)
      await getRegexInputLocator(page).fill(newRegex)
      await getSelectorInputLocator(page).fill(newSelector)
    },
    onEditFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last().locator("td").first()).toHaveText(newRegex)
      await expect(rowLocator.last().locator("td").last()).toHaveText(
        newSelector
      )
    }
  })
})

test("配置Download Selectors", async ({ page, extensionId }) => {
  await gotoOptionPage(page, extensionId)

  const regex = ".*example1\\.com.*"
  const selector = "pre > code.test"
  const newRegex = ".*example\\.com.*"
  const newSelector = "pre > code"

  await testConfig({
    page,
    index: 2,
    addFormTitle: "Add Download Selector",
    editFormTitle: "Edit Selector",
    onAddFormOpen: async () => {
      await getRegexInputLocator(page).fill(regex)
      await getSelectorInputLocator(page).fill(selector)
    },
    onAddFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last().locator("td").first()).toHaveText(regex)
      await expect(rowLocator.last().locator("td").last()).toHaveText(selector)
    },
    onEditFormOpen: async () => {
      await expect(getRegexInputLocator(page)).toHaveValue(regex)
      await expect(getSelectorInputLocator(page)).toHaveValue(selector)
      await getRegexInputLocator(page).fill(newRegex)
      await getSelectorInputLocator(page).fill(newSelector)
    },
    onEditFormSubmit: async (rowLocator) => {
      await expect(rowLocator.last().locator("td").first()).toHaveText(newRegex)
      await expect(rowLocator.last().locator("td").last()).toHaveText(
        newSelector
      )
    }
  })
})

async function gotoOptionPage(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html`)
}

function getTableLocator(page: Page, index: number) {
  return page.locator("table.fui-Table").nth(index)
}

function getRowLocator(tableLocator: Locator) {
  return tableLocator.locator("tbody tr.fui-TableRow")
}

function getRegexInputLocator(page: Page) {
  return page.locator("#regex-input")
}

function getSelectorInputLocator(page: Page) {
  return page.locator("#selector-input")
}

async function countConfig(tableLocator: Locator) {
  return tableLocator.locator("tbody tr.fui-TableRow").count()
}

async function submitForm(page: Page) {
  await page.getByRole("button", { name: "Submit" }).click()
}

async function clickAddButton(page: Page, index: number) {
  await page
    .locator("div[role='toolbar']")
    .nth(index)
    .locator("button")
    .first()
    .click()
}

async function clickEditButton(rowLocator: Locator) {
  await rowLocator.last().locator("button").first().click()
}

async function clickDeleteButton(rowLocator: Locator) {
  await rowLocator.last().locator("button").last().click()
}

async function clickResetButton(page: Page, index: number) {
  await page
    .locator("div[role='toolbar']")
    .nth(index)
    .locator("button")
    .last()
    .click()
}

async function deleteDialogVisible(page: Page) {
  await expect(page.getByText("Confirm Delete?")).toBeVisible()
}

async function resetDialogVisible(page: Page) {
  await expect(page.getByText("Confirm Reset To Preset?")).toBeVisible()
}

async function confirmDelete(page: Page) {
  await page.getByRole("button", { name: "Delete" }).click()
}

async function confirmReset(page: Page) {
  await page.getByRole("button", { name: "Reset" }).click()
}

async function testConfig({
  page,
  index,
  addFormTitle,
  editFormTitle,
  onAddFormOpen,
  onAddFormSubmit,
  onEditFormOpen,
  onEditFormSubmit
}: {
  page: Page
  index: number
  addFormTitle: string
  editFormTitle: string
  onAddFormOpen: () => Promise<void>
  onAddFormSubmit: (rowLocator: Locator) => Promise<void>
  onEditFormOpen: () => Promise<void>
  onEditFormSubmit: (rowLocator: Locator) => Promise<void>
}) {
  const tableLocator = getTableLocator(page, index)
  const rowLocator = getRowLocator(tableLocator)

  const beforeAddCount = await countConfig(tableLocator)

  // 新增
  await clickAddButton(page, index)
  await expect(page.getByText(addFormTitle)).toBeVisible()
  await onAddFormOpen()
  await submitForm(page)
  await expect(rowLocator).toHaveCount(beforeAddCount + 1)
  await onAddFormSubmit(rowLocator)
  // 新增第二个
  await clickAddButton(page, index)
  await expect(page.getByText(addFormTitle)).toBeVisible()
  await onAddFormOpen()
  await submitForm(page)
  await expect(rowLocator).toHaveCount(beforeAddCount + 2)
  await onAddFormSubmit(rowLocator)

  // 编辑最后一个
  await clickEditButton(rowLocator)
  await expect(page.getByText(editFormTitle)).toBeVisible()
  await onEditFormOpen()
  await submitForm(page)
  await expect(rowLocator).toHaveCount(beforeAddCount + 2)
  await onEditFormSubmit(rowLocator)

  // 删除最后一个
  await clickDeleteButton(rowLocator)
  await deleteDialogVisible(page)
  await confirmDelete(page)
  await expect(rowLocator).toHaveCount(beforeAddCount + 1)

  // 重置
  await clickResetButton(page, index)
  await resetDialogVisible(page)
  await confirmReset(page)
  await expect(rowLocator).toHaveCount(beforeAddCount)
}
