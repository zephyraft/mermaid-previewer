import type { BrowserContext, Frame, Locator, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { expect } from "./fixtures";

export const BITBUCKET_URL =
  "https://bitbucket.org/zephyraft/example/src/master/";
export const MMD_URL = pathToFileURL(
  resolve(process.env.PLAYWRIGHT_MMD_FILE || "doc/t1.mmd"),
).href;
export const GITLAB_URL = `https://gitlab.com/zzzzzzzephyr/test`;
export const GITHUB_URL = `https://github.com/zephyraft/mermaid-previewer/blob/master/doc/example.md`;
export const GIST_URL = `https://gist.github.com/zephyraft/b404f51ef44afeff2fc10c37018417c1`;

export const EXAMPLE_MARKDOWN_PATH = resolve("doc/example.md");
export const EXAMPLE_DIAGRAM_COUNT = 14;

export const EXTENSION_MERMAID_SELECTOR = "svg[id^='mermaid']";
export const GITLAB_MERMAID_SELECTOR = "svg#mermaid";
export const GITHUB_MERMAID_SELECTOR = "svg#diagram";

const floatButtonContainerSelector = "#mermaid-previewer-controls";

export function getFloatButtonContainerLocator(page: Page) {
  return page.locator(floatButtonContainerSelector);
}

export function getDownloadButtonLocator(containerLocator: Locator) {
  return containerLocator.locator("#download");
}

export async function mockBitbucketMarkdown(context: BrowserContext) {
  const markdown = await readFile(EXAMPLE_MARKDOWN_PATH, "utf8");
  const examples = [...markdown.matchAll(/^```mermaid\r?\n([\s\S]*?)^```/gm)];
  const html = examples
    .map(([, code]) => {
      const escaped = code
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      return `<div class="codehilite"><pre>${escaped}</pre></div>`;
    })
    .join("");
  await context.route(BITBUCKET_URL, (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
}

export async function waitForMermaidFrame(
  page: Page,
  urlPrefix: string,
  selector: string,
) {
  let result: Frame | undefined;
  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          if (
            frame.url().startsWith(urlPrefix) &&
            (await frame.locator(selector).first().isVisible())
          ) {
            result = frame;
            return true;
          }
        }
        return false;
      },
      { timeout: 15000 },
    )
    .toBe(true);
  return result!;
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
