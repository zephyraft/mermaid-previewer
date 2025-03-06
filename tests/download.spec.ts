import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";

import {
  BITBUCKET_URL,
  GIST_MERMAID_COUNT,
  GIST_URL,
  GITHUB_MERMAID_COUNT,
  GITHUB_MERMAID_SELECTOR,
  GITHUB_URL,
  GITLAB_MERMAID_COUNT,
  GITLAB_MERMAID_SELECTOR,
  GITLAB_URL,
  MMD_URL,
  getDownloadButtonLocator,
  getFirstFrame,
  getFloatButtonContainerLocator,
  getFloatButtonContainerLocatorOfFrame,
  getMermaidSVGLocator,
  waitFrames,
} from "./content.utils";
import { expect, test } from "./fixtures";

const downloadPath = process.env.PLAYWRIGHT_DOWNLOAD_DIR;

test.beforeEach(() => {
  // 清理下载文件夹
  test.fail(
    !downloadPath.endsWith("/playwright/.download"),
    "下载文件夹配置有误",
  );
  deleteDownloadFile(downloadPath);
});

test.describe.configure({ mode: "serial" });

test("bitbucket下载", async ({ page }) => {
  await page.goto(BITBUCKET_URL);
  await page.waitForLoadState();
  const floatButtonContainerLocator = getFloatButtonContainerLocator(page);
  const downloadButtonLocator = getDownloadButtonLocator(
    floatButtonContainerLocator,
  );
  const mermaidSVGLocator = getMermaidSVGLocator(page);

  await mermaidSVGLocator.last().hover();
  await expect(floatButtonContainerLocator).toBeInViewport();

  await downloadButtonLocator.click();
  await checkDownloadFile(page, downloadPath, 1);
});

test("mmd下载", async ({ page }) => {
  await page.goto(MMD_URL);
  await page.waitForLoadState();
  const floatButtonContainerLocator = getFloatButtonContainerLocator(page);
  const downloadButtonLocator = getDownloadButtonLocator(
    floatButtonContainerLocator,
  );
  const mermaidSVGLocator = getMermaidSVGLocator(page);

  await mermaidSVGLocator.last().hover();
  await expect(floatButtonContainerLocator).toBeInViewport();

  await downloadButtonLocator.click();
  await checkDownloadFile(page, downloadPath, 1);
});

test("gitlab下载", async ({ page }) => {
  await checkDownloadForNativeSupportWebsite({
    page,
    url: GITLAB_URL,
    mermaidCount: GITLAB_MERMAID_COUNT,
    mermaidSelector: GITLAB_MERMAID_SELECTOR,
  });
});

test("github下载", async ({ page }) => {
  await checkDownloadForNativeSupportWebsite({
    page,
    url: GITHUB_URL,
    mermaidCount: GITHUB_MERMAID_COUNT,
    mermaidSelector: GITHUB_MERMAID_SELECTOR,
  });
});

test("gist下载", async ({ page }) => {
  await checkDownloadForNativeSupportWebsite({
    page,
    url: GIST_URL,
    mermaidCount: GIST_MERMAID_COUNT,
    mermaidSelector: GITHUB_MERMAID_SELECTOR,
    waitMills: 2000,
  });
});

function deleteDownloadFile(downloadPath: string) {
  fs.readdirSync(downloadPath).forEach((file) => {
    const currentPath = path.join(downloadPath, file);
    if (fs.lstatSync(currentPath).isDirectory()) {
      deleteDownloadFile(currentPath);
    } else {
      fs.unlinkSync(currentPath);
    }
  });
}

async function checkDownloadFile(
  page: Page,
  downloadPath: string,
  fileCount: number,
) {
  // 目前chrome扩展触发的下载，playwright监听不到事件，只能手动等待后使用fs api检查文件
  await page.waitForTimeout(1000);
  const dirFiles = fs.readdirSync(downloadPath);
  dirFiles.forEach((file) => {
    const currentPath = path.join(downloadPath, file);
    test.fail(fs.lstatSync(currentPath).isDirectory(), "下载文件夹内包含目录");
    test.fail(
      fs.lstatSync(currentPath).size < 1000,
      "下载文件过小，请检查输出",
    );
  });
  await expect(dirFiles.length).toBe(fileCount);
}

async function checkDownloadForNativeSupportWebsite({
  page,
  url,
  mermaidCount,
  mermaidSelector,
  waitMills,
}: {
  page: Page;
  url: string;
  mermaidCount: number;
  mermaidSelector: string;
  waitMills?: number;
}) {
  await page.goto(url);
  // 等待所有iframe加载完成
  await waitFrames(page, mermaidCount, mermaidSelector);
  if (waitMills) {
    await page.waitForTimeout(waitMills);
  }

  const firstFrame = getFirstFrame(page);
  const floatButtonContainerLocator =
    getFloatButtonContainerLocatorOfFrame(firstFrame);
  const downloadButtonLocator = getDownloadButtonLocator(
    floatButtonContainerLocator,
  );

  const firstMermaidLocator = firstFrame.locator(mermaidSelector);
  await firstMermaidLocator.hover();
  await expect(floatButtonContainerLocator).toBeVisible();

  await downloadButtonLocator.click();
  await checkDownloadFile(page, downloadPath, 1);
}
