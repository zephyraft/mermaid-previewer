import {
  BITBUCKET_EDIT_MERMAID_COUNT,
  BITBUCKET_EDIT_URL,
  BITBUCKET_MERMAID_COUNT,
  BITBUCKET_URL,
  EXTENSION_MERMAID_SELECTOR,
  MMD_URL,
  getMermaidSVGLocator
} from "./content.utils"
import { expect, test } from "./fixtures"

test("bitbucket渲染", async ({ page }) => {
  await page.goto(BITBUCKET_URL)
  await page.waitForLoadState()
  const mermaidSVGLocator = getMermaidSVGLocator(page)
  await expect(mermaidSVGLocator).toHaveCount(BITBUCKET_MERMAID_COUNT)
})

test("bitbucket编辑预览渲染", async ({ page }) => {
  await page.goto(BITBUCKET_EDIT_URL)
  const editorLocator = page.locator(".CodeMirror-code")
  const linesLocator = editorLocator.locator(".CodeMirror-line")
  // 输入内容
  await editorLocator.waitFor()
  await linesLocator.first().click()
  await page.keyboard.type("  ", { delay: 100 })
  // 编辑预览
  await page.locator(".bb-content-container-footer .render-button").click()
  const previewMermaidLocator = page.locator(
    `.bb-content-container ${EXTENSION_MERMAID_SELECTOR}`
  )
  await previewMermaidLocator.waitFor()
  await expect(previewMermaidLocator).toHaveCount(BITBUCKET_EDIT_MERMAID_COUNT)
  // 取消
  await page.locator(".bb-content-container-footer .cancel-link").click()
  const confirmButtonLocator = page.locator(".dialog-submit")
  await confirmButtonLocator.waitFor()
  await confirmButtonLocator.click()
  // 取消后预览
  const mermaidLocator = page.locator(EXTENSION_MERMAID_SELECTOR)
  await mermaidLocator.waitFor()
  await expect(mermaidLocator).toHaveCount(BITBUCKET_EDIT_MERMAID_COUNT)
})

test("mmd渲染", async ({ page }) => {
  await page.goto(MMD_URL)
  await page.waitForLoadState()
  const mermaidSVGLocator = getMermaidSVGLocator(page)
  await expect(mermaidSVGLocator).toHaveCount(1)
})

test("font-awesome", async ({ page }) => {
  await page.goto(MMD_URL)
  await page.waitForLoadState()
  const mermaidSVGLocator = getMermaidSVGLocator(page)
  await expect(mermaidSVGLocator.locator("i.fab").first()).toBeVisible()
})
