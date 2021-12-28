import { initDriver } from "./selenium-utils";
import { defaultMatchSelectorList } from "../src/utils/storage";
import { HadRenderedSelector } from "../src/content/selectors";
import { By } from "selenium-webdriver";
import { addGithubCookie } from "./cookie/github";
import { addBitbucketCookie } from "./cookie/bitbucket";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  driver.destroy();
});

/**
 * 已被渲染的mermaid selectors
 */
const renderedMermaidSelector = defaultMatchSelectorList.map((selector) => {
  selector += HadRenderedSelector;
  return selector;
}).join(", ");

const bitbucketPreviewRenderedSelector = defaultMatchSelectorList.map((selector) => {
  selector = ".bb-content-container " + selector + HadRenderedSelector;
  return selector;
}).join(", ");

/**
 * 等待mermaid渲染
 */
const waitMermaidRender = async () => {
  const mermaid = await driver.waitElementLocated(By.css(renderedMermaidSelector));
  console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
};

const waitBitbucketPreviewRender = async () => {
  await driver.waitElementLocated(By.css(bitbucketPreviewRenderedSelector));
  const mermaids = await driver.findElements(By.css(bitbucketPreviewRenderedSelector));
  for (const mermaid of mermaids) {
    console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
  }
  return mermaids;
};

const checkMermaid = async (count, elements) => {
  let mermaids;
  if (elements) {
    mermaids = elements;
  } else {
    mermaids = await driver.findElements(By.css(renderedMermaidSelector));
  }
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
    await addGithubCookie(driver);
    await driver.navigate().refresh();
    // 编辑
    const editButton = await driver.waitElementLocated(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md'] > button"));
    // const form = await driver.findElement(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md']"));
    // console.log(await form.getAttribute("innerHTML"));
    // 点击preview按钮
    await editButton.click();
    console.log("editButton Click");
    // 等待edit加载完成
    const previewButton = await driver.waitElementLocated(By.className("preview"));
    await previewButton.click();
    console.log("previewButton Click");
    await waitMermaidRender();
    await checkMermaid(14);
  });
  test("bitbucket-edit-preview", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md");
    await addBitbucketCookie(driver);
    await driver.navigate().refresh();
    // 编辑
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md?mode=edit&at=master");
    // 输入内容
    const codeEditorContainer = await driver.waitElementLocated(By.className("CodeMirror-code"));
    const lines = await codeEditorContainer.findElements(By.className("CodeMirror-line"));
    // for (const line of lines) {
    //   console.log(await line.getAttribute("innerHTML"));
    // }
    const firstLine = lines[0];
    await driver.actions({async: true}).move({origin:firstLine}).click().perform();
    await driver.actions().sendKeys(" ").perform();
    console.log("input finish");
    // 点击preview按钮
    const previewButton = await driver.waitElementEnableAndVisible(By.className("render-button"));
    await previewButton.click();
    console.log("previewButton Click");
    const mermaids = await waitBitbucketPreviewRender();
    await checkMermaid(1, mermaids);
    // 取消
    const cancelButton = await driver.waitElementLocated(By.className("cancel-link"));
    await cancelButton.click();
    console.log("cancelButton Click");
    const confirmButton = await driver.waitElementEnableAndVisible(By.className("dialog-submit"));
    await confirmButton.click();
    console.log("confirmButton Click");
    await waitMermaidRender();
    await checkMermaid(1);
  });
});