import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "./fixtures";

const light = "rgb(255, 255, 255)";
const dark = "rgb(35, 40, 50)";

test("toolbar and settings share the theme across open pages and the zoomed preview", async ({
  context,
  page,
  optionsURL,
  downloadDir,
}) => {
  const url = "https://bitbucket.org/theme-example";
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html style="color-scheme: light"><body>
        <div class="codehilite" style="background:#141414">
          <pre>flowchart LR
  Draft --> Review</pre>
        </div>
      </body></html>`,
    }),
  );
  const settings = await context.newPage();
  await settings.goto(optionsURL);
  const theme = settings.getByRole("combobox", { name: "Diagram theme" });
  await expect(theme).toHaveValue("background");
  await expect(theme.locator("option")).toHaveText([
    "Match page",
    "System",
    "Light",
    "Dark",
  ]);

  const otherPage = await context.newPage();
  await otherPage.emulateMedia({ colorScheme: "light" });
  await otherPage.goto(url);
  const otherDiagram = otherPage.locator("pre > svg.pele");
  await expect(otherDiagram).toHaveCSS("background-color", "rgb(20, 20, 20)");

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(url);
  await page.bringToFront();
  const diagram = page.locator("pre > svg.pele");
  await expect(diagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await diagram.hover();

  const toolbarTheme = page.locator("#diagram-theme");
  const themeMenu = page.getByRole("group", { name: "Diagram theme options" });
  await expect(toolbarTheme).toHaveAccessibleName("Diagram theme");
  await expect(themeMenu).toBeHidden();
  await toolbarTheme.hover();
  await expect(themeMenu).toBeHidden();
  await toolbarTheme.click();
  await expect(themeMenu).toBeVisible();
  await expect(themeMenu.getByRole("button")).toHaveText([
    "Match page",
    "System",
    "Light",
    "Dark",
  ]);
  await expect(
    themeMenu.getByRole("button", { name: "Match page", pressed: true }),
  ).toBeVisible();
  await themeMenu.getByRole("button", { name: "System" }).click();
  await expect(themeMenu).toBeHidden();
  await expect(diagram).toHaveCSS("background-color", light);
  await expect(otherDiagram).toHaveCSS("background-color", light);
  await expect(theme).toHaveValue("system");

  await expect(toolbarTheme).toHaveAttribute("title", "Diagram theme: System");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(diagram).toHaveCSS("background-color", dark);
  await expect(otherDiagram).toHaveCSS("background-color", light);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");

  await page.mouse.move(0, 0);
  await diagram.hover();
  await page.getByRole("button", { name: "Download SVG" }).click();
  await expect
    .poll(
      async () =>
        (await readdir(downloadDir)).filter(
          (file) => !file.endsWith(".crdownload"),
        ).length,
    )
    .toBe(1);
  const [download] = (await readdir(downloadDir)).filter(
    (file) => !file.endsWith(".crdownload"),
  );
  const exported = await readFile(join(downloadDir, download), "utf8");
  expect(exported).toContain("--pele-fg: #f1f3f7");
  expect(exported).toContain("background-color: var(--pele-bg)");

  await diagram.hover();
  await page.getByRole("button", { name: "Open preview" }).click();
  const viewer = page.getByRole("dialog", { name: "Diagram preview" });
  const canvas = viewer.getByRole("region", { name: "Diagram canvas" });
  const image = viewer.getByRole("img", { name: "Mermaid diagram" });
  await expect(image).toBeVisible();
  await viewer.getByRole("button", { name: "Zoom in" }).click();
  await expect(viewer.getByText("125%", { exact: true })).toBeVisible();
  const previousImage = await image.getAttribute("src");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(diagram).toHaveCSS("background-color", light);
  await expect(canvas).toHaveCSS("background-color", light);
  await expect(image).not.toHaveAttribute("src", previousImage!);

  await theme.selectOption("background");
  await expect(diagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await expect(otherDiagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await expect(canvas).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await expect(viewer.getByText("125%", { exact: true })).toBeVisible();
  await viewer.getByRole("button", { name: "Close preview" }).click();

  const backgroundDiagram = await diagram.getAttribute("id");
  await otherPage.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(diagram).toHaveAttribute("id", backgroundDiagram!);
  await expect(diagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await expect(otherDiagram).toHaveCSS("background-color", "rgb(20, 20, 20)");

  await diagram.hover();
  await toolbarTheme.click();
  await themeMenu.getByRole("button", { name: "Light", exact: true }).click();
  await expect(theme).toHaveValue("light");
  await expect(diagram).toHaveCSS("background-color", light);
  await diagram.hover();
  await toolbarTheme.click();
  await themeMenu.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(theme).toHaveValue("dark");
  await expect(diagram).toHaveCSS("background-color", dark);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(diagram).toHaveCSS("background-color", dark);
  await diagram.hover();
  await toolbarTheme.click();
  await themeMenu
    .getByRole("button", { name: "Match page", exact: true })
    .click();
  await expect(theme).toHaveValue("background");
  await expect(diagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
});

test("live previews redraw both engines and preserve a theme declared by the diagram", async ({
  context,
  page,
  optionsURL,
}) => {
  const url = "https://gemini.google.com/app/theme-example";
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div class="code-block"><pre><code id="stream">flowchart LR
  Draft --> Review</code></pre></div>
  <div class="code-block"><pre><code id="fallback">%%{init: {"htmlLabels": false}}%%
flowchart LR
  Draft --> Review</code></pre></div>
  <div class="code-block"><pre><code id="authored">---
config:
  theme: dark
---
flowchart LR
  Draft --> Review</code></pre></div>`,
    }),
  );
  const settings = await context.newPage();
  await settings.goto(optionsURL);
  const theme = settings.getByRole("combobox", { name: "Diagram theme" });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(url);
  const diagram = page.locator("#stream + span > svg.pele");
  const fallback = page.locator("#fallback + span > svg");
  const authored = page.locator("#authored + span > svg");
  const fallbackEdge = fallback.locator(".flowchart-link").first();
  await expect(diagram).toBeVisible();
  await expect(fallbackEdge).toBeAttached();
  const lightStroke = await fallbackEdge.evaluate(
    (edge) => getComputedStyle(edge).stroke,
  );

  await page.emulateMedia({ colorScheme: "dark" });
  await theme.selectOption("system");
  await page.locator("#stream").evaluate((source) => {
    (source.firstChild as Text).data += "\n  Review --> Published";
  });
  await expect(diagram.getByText("Published", { exact: true })).toBeVisible();
  await expect(diagram).toHaveCSS("background-color", dark);
  await expect(fallback).toHaveCSS("background-color", dark);
  await expect(fallbackEdge).not.toHaveCSS("stroke", lightStroke);

  await page.emulateMedia({ colorScheme: "light" });
  await expect(diagram).toHaveCSS("background-color", light);
  await expect(diagram.getByText("Published", { exact: true })).toBeVisible();
  await expect(fallback).toHaveCSS("background-color", light);
  await expect(fallbackEdge).toHaveCSS("stroke", lightStroke);
  await expect(authored).toHaveCSS("background-color", dark);

  const incomplete = page.locator("#stream");
  await incomplete.evaluate((source) => {
    (source.firstChild as Text).data += '\n  Published --> Incomplete["';
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(diagram).toHaveCSS("background-color", dark);
  await expect(diagram.getByText("Published", { exact: true })).toBeVisible();
  await expect(incomplete).toContainText("Incomplete");
});
