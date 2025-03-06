import type { Frame, Locator, Page } from "@playwright/test";
import * as process from "process";

import { expect } from "./fixtures";

export const BITBUCKET_URL =
  "https://bitbucket.org/zephyraft/example/src/master/";
export const BITBUCKET_EDIT_URL =
  "https://bitbucket.org/zephyraft/test/src/master/README.md?mode=edit&at=master";
export const MMD_URL = `file://${process.env.PLAYWRIGHT_MMD_FILE}`;
export const GITLAB_URL = `https://gitlab.com/zzzzzzzephyr/test`;
export const GITHUB_URL = `https://github.com/zephyraft/mermaid-previewer/blob/master/doc/example.md`;
export const GIST_URL = `https://gist.github.com/zephyraft/b404f51ef44afeff2fc10c37018417c1`;

export const BITBUCKET_MERMAID_COUNT = 14;
export const BITBUCKET_EDIT_MERMAID_COUNT = 1;
export const GITLAB_MERMAID_COUNT = 14;
export const GITHUB_MERMAID_COUNT = 14;
export const GIST_MERMAID_COUNT = 1;

export const EXTENSION_MERMAID_SELECTOR = "svg[id^='mermaid']";
export const GITLAB_MERMAID_SELECTOR = "svg#mermaid";
export const GITHUB_MERMAID_SELECTOR = "svg#diagram";

const floatButtonContainerSelector =
  "#plasmo-shadow-container .plasmo-csui-container";

export function getFloatButtonContainerLocator(page: Page) {
  return page.locator(floatButtonContainerSelector);
}

export function getDownloadButtonLocator(containerLocator: Locator) {
  return containerLocator.locator("#download");
}

export function getFirstFrame(page: Page) {
  // 第0个为mainFrame
  return page.frames()[1];
}

export function getLastFrame(page: Page) {
  const frames = page.frames();
  return frames[frames.length - 1];
}

export async function waitFrames(
  page: Page,
  expectCount: number,
  mermaidSVGSelector: string,
) {
  await expect(async () => {
    // 有1个为mainFrame
    expect(page.frames().length).toBe(expectCount + 1);
  }).toPass();
  // 等待最后一个iframe中的mermaid渲染完成
  await getLastFrame(page).waitForSelector(mermaidSVGSelector);
}

export function getFloatButtonContainerLocatorOfFrame(frame: Frame) {
  return frame.locator(floatButtonContainerSelector);
}

export function getCopyButtonLocator(containerLocator: Locator) {
  return containerLocator.locator("#copy");
}

export function getMermaidSVGLocator(page: Page) {
  return page.locator(EXTENSION_MERMAID_SELECTOR);
}
