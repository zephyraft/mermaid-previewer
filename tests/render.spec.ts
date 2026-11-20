import { copyFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  BITBUCKET_URL,
  EXAMPLE_DIAGRAM_COUNT,
  EXAMPLE_MARKDOWN_PATH,
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
  await expect(mermaidSVGLocator).toHaveCount(EXAMPLE_DIAGRAM_COUNT, {
    timeout: 15000,
  });
});

test("渲染本地 doc/example.md 中的 Mermaid 代码块", async ({ page }) => {
  await page.goto(pathToFileURL(EXAMPLE_MARKDOWN_PATH).href);
  await expect(getMermaidSVGLocator(page)).toHaveCount(EXAMPLE_DIAGRAM_COUNT, {
    timeout: 15000,
  });
  await expect(page.locator("body > pre")).toContainText("## flowchart");
  await expect(page.locator("body > pre")).toContainText("## gitGraph");
});

test("本地 Markdown 只渲染 Mermaid 围栏并支持复制源码", async ({
  page,
}, testInfo) => {
  const diagramSource = "flowchart LR\n  Start --> Finish\n";
  const otherCode = [
    "````text",
    "```mermaid",
    "flowchart LR",
    "Ignored --> Hidden",
    "```",
    "````",
  ];
  const markdown = [
    "# Notes",
    "",
    ...otherCode,
    "",
    "> ~~~MERMAID example",
    ...diagramSource.trimEnd().split("\n").map((line) => `> ${line}`),
    "> ~~~",
    "",
    "Text after the diagram.",
  ].join("\r\n");
  const file = testInfo.outputPath("local notes.md");
  await writeFile(file, markdown);
  await page.goto(pathToFileURL(file).href);

  const diagram = getMermaidSVGLocator(page);
  await expect(diagram).toHaveCount(1);
  const originalText = page.locator("body > pre");
  expect(await originalText.textContent()).toContain(otherCode.join("\n"));
  await expect(originalText).toContainText("Text after the diagram.");
  await diagram.hover();
  await page.getByRole("button", { name: "Copy Mermaid source" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(diagramSource);
});

test("mmd渲染", async ({ page }) => {
  await page.goto(MMD_URL);
  await page.waitForLoadState();
  const mermaidSVGLocator = getMermaidSVGLocator(page);
  await expect(mermaidSVGLocator).toHaveCount(1);
});

test("渲染本地 .mermaid 文件", async ({ page }, testInfo) => {
  const file = testInfo.outputPath("diagram.mermaid");
  await copyFile(new URL(MMD_URL), file);
  await page.goto(pathToFileURL(file).href);
  await expect(getMermaidSVGLocator(page)).toHaveCount(1);
});

test("font-awesome", async ({ page }) => {
  await page.goto(MMD_URL);
  await page.waitForLoadState();
  const mermaidSVGLocator = getMermaidSVGLocator(page);
  await expect(mermaidSVGLocator).toHaveClass(/\bpele\b/);
  await expect(mermaidSVGLocator.locator("svg[data-font-awesome]")).toHaveCount(
    4,
  );
});
