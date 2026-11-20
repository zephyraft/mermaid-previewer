import {
  BITBUCKET_MERMAID_COUNT,
  BITBUCKET_URL,
  MMD_URL,
  getMermaidSVGLocator,
  mockBitbucketMarkdown,
} from "./content.utils";
import { expect, test } from "./fixtures";

test("bitbucket渲染", async ({ page, context }) => {
  await mockBitbucketMarkdown(context);
  await page.goto(BITBUCKET_URL);
  await page.waitForLoadState();
  const mermaidSVGLocator = getMermaidSVGLocator(page);
  await expect(mermaidSVGLocator).toHaveCount(BITBUCKET_MERMAID_COUNT, {
    timeout: 15000,
  });
});

test("mmd渲染", async ({ page }) => {
  await page.goto(MMD_URL);
  await page.waitForLoadState();
  const mermaidSVGLocator = getMermaidSVGLocator(page);
  await expect(mermaidSVGLocator).toHaveCount(1);
});

test("font-awesome", async ({ page }) => {
  await page.goto(MMD_URL);
  await page.waitForLoadState();
  const mermaidSVGLocator = getMermaidSVGLocator(page);
  await expect(mermaidSVGLocator.locator("i.fab").first()).toBeVisible();
});
