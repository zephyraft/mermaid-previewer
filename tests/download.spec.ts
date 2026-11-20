import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

import {
  BITBUCKET_URL,
  GIST_URL,
  GITHUB_MERMAID_SELECTOR,
  GITHUB_URL,
  GITLAB_MERMAID_SELECTOR,
  GITLAB_URL,
  MMD_URL,
  getDownloadButtonLocator,
  getFloatButtonContainerLocator,
  getFloatButtonContainerLocatorOfFrame,
  getMermaidSVGLocator,
  mockBitbucketMarkdown,
  waitForMermaidFrame,
} from "./content.utils";
import { expect, test } from "./fixtures";

test("bitbucket下载", async ({ page, context, downloadDir }) => {
  await mockBitbucketMarkdown(context);
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
  await checkDownloadFile(downloadDir);
});

test("mmd下载", async ({ page, downloadDir }) => {
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
  await checkDownloadFile(downloadDir);
  const [download] = completedDownloads(downloadDir);
  expect(fs.readFileSync(path.join(downloadDir, download), "utf8")).toContain(
    "data:font/woff2;base64,",
  );
});

test("gitlab下载", async ({ context, page, downloadDir }) => {
  const frameURL = "https://gitlab.com/-/sandbox/mermaid_v12";
  await context.route(GITLAB_URL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<iframe src="${frameURL}" width="600" height="300"></iframe>`,
    }),
  );
  await context.route(frameURL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div id="app"><div id="dmermaid">
        <svg id="mermaid" xmlns="http://www.w3.org/2000/svg" width="300" height="160">
          ${'<rect width="100" height="120" fill="royalblue"/>'.repeat(24)}
        </svg>
      </div></div>`,
    }),
  );
  await checkDownloadForNativeSupportWebsite({
    page,
    downloadDir,
    url: GITLAB_URL,
    frameURL,
    mermaidSelector: GITLAB_MERMAID_SELECTOR,
  });
});

test("github下载", async ({ page, downloadDir }) => {
  await checkDownloadForNativeSupportWebsite({
    page,
    downloadDir,
    url: GITHUB_URL,
    frameURL: "https://viewscreen.githubusercontent.com/markdown/mermaid",
    mermaidSelector: GITHUB_MERMAID_SELECTOR,
  });
});

test("gist下载", async ({ page, downloadDir }) => {
  await checkDownloadForNativeSupportWebsite({
    page,
    downloadDir,
    url: GIST_URL,
    frameURL: "https://viewscreen.githubusercontent.com/markdown/mermaid",
    mermaidSelector: GITHUB_MERMAID_SELECTOR,
  });
});

function completedDownloads(downloadDir: string) {
  return fs
    .readdirSync(downloadDir)
    .filter((file) => !file.endsWith(".crdownload"));
}

async function checkDownloadFile(downloadDir: string) {
  await expect.poll(() => completedDownloads(downloadDir).length).toBe(1);
  const [file] = completedDownloads(downloadDir);
  await expect
    .poll(() => fs.statSync(path.join(downloadDir, file)).size)
    .toBeGreaterThan(1000);
}

async function checkDownloadForNativeSupportWebsite({
  page,
  downloadDir,
  url,
  frameURL,
  mermaidSelector,
}: {
  page: Page;
  downloadDir: string;
  url: string;
  frameURL: string;
  mermaidSelector: string;
}) {
  await page.goto(url);
  const firstFrame = await waitForMermaidFrame(page, frameURL, mermaidSelector);
  const floatButtonContainerLocator =
    getFloatButtonContainerLocatorOfFrame(firstFrame);
  const downloadButtonLocator = getDownloadButtonLocator(
    floatButtonContainerLocator,
  );

  await expect(floatButtonContainerLocator).toBeAttached();
  const firstMermaidLocator = firstFrame.locator(mermaidSelector).first();
  await firstMermaidLocator.hover();
  await expect(floatButtonContainerLocator).toBeVisible();

  await downloadButtonLocator.click();
  await checkDownloadFile(downloadDir);
}
