import { destroyDriver, initDriver, waitElementLocated } from "./selenium-utils";
import { defaultMatchSelectorList } from "../src/utils/storage";
import { HadRenderedSelector } from "../src/content/selectors";
import { By } from "selenium-webdriver";
import { addLoginCookie } from "./github";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  await destroyDriver(driver);
});

/**
 * 已被渲染的mermaid selectors
 */
const renderedMermaidSelector = defaultMatchSelectorList.map((selector) => {
  selector += HadRenderedSelector;
  return selector;
}).join(", ");

/**
 * 等待mermaid渲染
 */
const waitMermaidRender = async () => {
  await waitElementLocated(driver, By.css(renderedMermaidSelector));
};

const checkMermaid = async (count) => {
  const mermaids = await driver.findElements(By.css(renderedMermaidSelector));
  expect(mermaids.length).toBe(count);
  for (const mermaid of mermaids) {
    // console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
    const svg = await mermaid.findElement(By.tagName("svg"));
    expect(svg).toBeDefined();
  }
};

describe("mermaid-render", () => {
  test("bitbucket-render", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
  });

  test("github-render", async () => {
    await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
    await waitMermaidRender();
    await checkMermaid(14);
  });
});

describe("mermaid-edit-preview", () => {
  test("github-edit-preview", async () => {
    await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
    await addLoginCookie(driver, process.env);
    await driver.navigate().refresh();
    // 编辑
    const editButton = await waitElementLocated(driver, By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md'] > button"))
    const form = await driver.findElement(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md']"));
    // console.log(await form.getAttribute("innerHTML"));
    // 点击preview按钮
    await editButton.click();
    console.log("editButton Click");
    // 等待edit加载完成
    const previewButton = await waitElementLocated(driver, By.className("preview"));
    await previewButton.click();
    console.log("previewButton Click");
    await waitMermaidRender();
    await checkMermaid(14);
  });
  // TODO bitbucket
});