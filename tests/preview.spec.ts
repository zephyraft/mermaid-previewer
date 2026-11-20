import { pathToFileURL } from "node:url";

import { EXAMPLE_DIAGRAM_COUNT, EXAMPLE_MARKDOWN_PATH } from "./content.utils";
import { expect, test } from "./fixtures";

const geminiURL = "https://gemini.google.com/app/example";
const livePreview = "[data-mermaid-previewer-live-preview]";

test("applies live updates per rule on the same page", async ({
  context,
  page,
  extensionWorker,
  optionsURL,
}) => {
  const url = "https://live-rules.example/diagrams";
  const match = "https://live-rules.example/*";
  await extensionWorker.evaluate(
    (match) =>
      chrome.storage.sync.set({
        "mermaid-previewer.matchSelectors": JSON.stringify([
          { match, selector: "#stream, #wrapper" },
          { match, selector: "#wrapper, #static" },
        ]),
      }),
    match,
  );
  const settings = await context.newPage();
  await settings.goto(optionsURL);
  const toggle = settings.getByRole("switch", {
    name: "Live updates for https://live-rules.example/*, #stream, #wrapper",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();

  const source = "flowchart LR\n  Draft --> Review";
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<pre id="wrapper"><code id="stream">${source}</code></pre><pre id="static">${source}</pre>`,
    }),
  );
  await page.goto(url);
  const liveDiagram = page.locator(`${livePreview} > svg.pele`);
  const staticDiagram = page.locator("#static > svg.pele");
  await expect(liveDiagram).toBeVisible();
  await expect(staticDiagram).toBeVisible();
  await expect(page.locator("#wrapper > svg")).toHaveCount(0);
  await page.locator("#stream").evaluate((element) => {
    (element.firstChild as Text).data += "\n  Review --> Published";
  });
  await expect(
    liveDiagram.getByText("Published", { exact: true }),
  ).toBeVisible();
  await expect(
    staticDiagram.getByText("Review", { exact: true }),
  ).toBeVisible();
  await expect(liveDiagram).toHaveCount(1);

  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.reload();
  await expect(page.locator("#wrapper > svg.pele")).toBeVisible();
  await expect(liveDiagram).toHaveCount(0);
});

test("keeps local Markdown extraction when its built-in rule enables live updates", async ({
  page,
  extensionWorker,
}) => {
  await extensionWorker.evaluate(() =>
    chrome.storage.sync.set({
      "mermaid-previewer.matchSelectors": JSON.stringify([
        { liveDefault: "local-markdown", live: true },
      ]),
    }),
  );
  await page.goto(pathToFileURL(EXAMPLE_MARKDOWN_PATH).href);
  await expect(
    page.locator(`${livePreview} > svg, ${livePreview} > iframe`),
  ).toHaveCount(EXAMPLE_DIAGRAM_COUNT, { timeout: 15000 });
  await expect(page.locator("body > pre")).toContainText("## flowchart");
});

test("previews Gemini diagrams on a dark code surface in a light page", async ({
  context,
  page,
}) => {
  await context.route(geminiURL, (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: {
        "Content-Security-Policy": "require-trusted-types-for 'script'",
      },
      body: `<body style="background:#faf9f9;color:#1f1f1f;color-scheme:light">
        <div class="code-block"><div style="background:#141414">
          <pre><code class="formatted">flowchart LR
  Start --> Finish</code></pre>
        </div></div>
        <div class="code-block"><pre><code class="formatted">console.log('hello')</code></pre></div>
      </body>`,
    }),
  );
  await page.goto(geminiURL);
  const diagram = page.locator(`.code-block ${livePreview} > svg.pele`);
  await expect(diagram).toBeVisible();
  await expect(diagram).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await expect(diagram.locator(".pele-edges path").first()).toHaveCSS(
    "stroke",
    "rgb(211, 220, 232)",
  );
  await expect(page.locator("code.formatted").last()).toHaveText(
    "console.log('hello')",
  );

  await diagram.hover();
  await page.getByRole("button", { name: "Open preview" }).click();
  const viewer = page.getByRole("dialog", { name: "Diagram preview" });
  const image = viewer.getByRole("img", { name: "Mermaid diagram" });
  const canvas = viewer.getByRole("region", { name: "Diagram canvas" });
  await expect(image).toBeVisible();
  await expect(canvas).toHaveCSS("background-color", "rgb(20, 20, 20)");
  const fitted = (await image.boundingBox())!;
  await viewer.getByRole("button", { name: "Zoom in" }).click();
  await expect(viewer.getByText("125%", { exact: true })).toBeVisible();
  expect((await image.boundingBox())!.width).toBeGreaterThan(fitted.width);

  const zoomed = (await image.boundingBox())!;
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y, { steps: 5 });
  await page.mouse.up();
  expect((await image.boundingBox())!.x).toBeGreaterThan(zoomed.x);

  await viewer.getByRole("button", { name: "Fit diagram" }).click();
  await expect(viewer.getByText("100%", { exact: true })).toBeVisible();
  expect((await image.boundingBox())!.width).toBeCloseTo(fitted.width);
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  await expect(diagram).toBeVisible();
});

test("updates newly generated Gemini diagrams as the original text node changes", async ({
  context,
  page,
}) => {
  await context.route(geminiURL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<main style="background:#141414"></main>',
    }),
  );
  await page.goto(geminiURL);
  await page.locator("main").evaluate((main) => {
    const block = document.createElement("div");
    block.className = "code-block";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    const token = document.createElement("span");
    token.id = "streamed-token";
    token.textContent = "flowchar";
    code.append(token);
    pre.append(code);
    block.append(pre);
    main.append(block);
  });

  const block = page.locator(".code-block").first();
  const code = block.locator("code");
  const token = page.locator("#streamed-token");
  const diagram = block.locator(`${livePreview} > svg.pele`);
  const start = "flowchart LR\n  Draft --> Review";
  await token.evaluate(
    (element, source) => ((element.firstChild as Text).data = source),
    start,
  );
  await expect(diagram).toBeVisible();
  await expect(diagram.getByText("Review")).toBeVisible();
  await expect(token).toHaveText(start);

  const initialDiagram = await diagram.getAttribute("id");
  await token.evaluate((element, source) => {
    (element.firstChild as Text).data = `${source}\n  Review --> Incomplete["`;
    element.closest("code")!.classList.add("formatted");
    element
      .closest("main")!
      .insertAdjacentHTML(
        "beforeend",
        '<div class="code-block"><pre><code>flowchart LR\n  A --> Other</code></pre></div>',
      );
  }, start);
  await expect(
    page.locator(livePreview).getByText("Other", { exact: true }),
  ).toBeVisible();
  await expect(diagram).toHaveAttribute("id", initialDiagram!);

  const finish = `${start}\n  Review --> Published`;
  await token.evaluate(
    (element, source) => ((element.firstChild as Text).data = source),
    finish,
  );
  await expect(diagram.getByText("Published")).toBeVisible();
  await expect(diagram).toHaveCount(1);
  await expect(token).toHaveText(finish);
  await diagram.hover();
  await page.getByRole("button", { name: "Copy Mermaid source" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(finish);

  await token.evaluate(
    (element) => ((element.firstChild as Text).data = "console.log('done')"),
  );
  await expect(diagram).toHaveCount(0);
  await expect(code).not.toHaveAttribute(
    "data-mermaid-previewer-live-source",
    "",
  );
  await expect(token).toHaveText("console.log('done')");
});

test("Mermaid.js applies the theme of each code block independently", async ({
  context,
  page,
  extensionWorker,
}) => {
  await extensionWorker.evaluate(() =>
    chrome.storage.sync.set({
      "mermaid-previewer.renderer": JSON.stringify("mermaid"),
    }),
  );
  const block = (id: string, color: string) =>
    `<div class="code-block" style="background:${color}">
      <pre><code id="${id}" class="formatted">flowchart LR
  A --> B</code></pre>
    </div>`;
  await context.route(geminiURL, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: block("light", "#fff") + block("dark", "#141414"),
    }),
  );
  await page.goto(geminiURL);
  const light = page.locator(`#light + ${livePreview} > svg`);
  const dark = page.locator(`#dark + ${livePreview} > svg`);
  await expect(light).toBeVisible();
  await expect(dark).toBeVisible();
  const lightLink = light.locator(".flowchart-link").first();
  const darkLink = dark.locator(".flowchart-link").first();
  const stroke = (element: Element) => getComputedStyle(element).stroke;
  expect(await darkLink.evaluate(stroke)).not.toEqual(
    await lightLink.evaluate(stroke),
  );
});
