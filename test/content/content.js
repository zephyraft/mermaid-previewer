import { defaultMatchSelectorList } from "../../src/utils/storage.js";
import { HadRenderedSelector } from "../../src/content/selectors.js";
import { By, WebDriver } from "selenium-webdriver";
import { sleep } from "../util/selenium-utils.js";
import robot from "robotjs";
import { addBitbucketCookie } from "../cookie/bitbucket.js";
import fs from "fs";
import os from "os";

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
const waitMermaidRender = async (driver) => {
  const mermaid = await driver.waitElementLocated(By.css(renderedMermaidSelector));
  console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
};

const waitBitbucketPreviewRender = async (driver) => {
  await driver.waitElementLocated(By.css(bitbucketPreviewRenderedSelector));
  const mermaids = await driver.findElements(By.css(bitbucketPreviewRenderedSelector));
  for (const mermaid of mermaids) {
    console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
  }
  return mermaids;
};

const checkMermaid = async (driver, count, elements) => {
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

const clickDownloadMenu = async (driver, element, upCount) => {
  await driver.actions()
    .move({origin:element})
    .contextClick()
    .perform();
  await sleep(100);

  // robotjs库 模拟系统点击，此处不能使用selenium，因为webdriver无法sendKeys到native上下文菜单
  for (let i = 0; i < upCount; i++) {
    robot.keyTap("up");
  }
  robot.keyTap("enter");

  await sleep(100);
}

const downloadKeyboardPressUpCount = 3;
const downloadKeyboardPressUpCountOfIframe = 5;

const checkDownload = async (driver) => {
  const toast = await driver.waitElementLocated(By.className("toastify"));
  expect(await toast.getInnerHTML()).toBe("Export Success<span class=\"toast-close\">✖</span>");
  fs.readdirSync(`${os.homedir}/Downloads`).filter(filename => filename.startsWith("mermaid-") && filename.endsWith(".png")).forEach(filename => {
    const file = `${os.homedir}/Downloads/${filename}`;
    const image = fs.readFileSync(file, { encoding: "base64" });
    console.log("data:image/png;base64," + image);
    console.log(`删除测试文件: ${file}`);
    fs.unlinkSync(file);
  });
};

export const testBitBucketRender = async (driver) => {
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
  await waitMermaidRender(driver);
  await checkMermaid(driver, 1);
}

export const testBitBucketEditPreview = async (driver) => {
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md");
  await addBitbucketCookie(driver);
  await driver.navigate().refresh();
  // 编辑
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md?mode=edit&at=master");
  // 输入内容
  const codeEditorContainer = await driver.waitElementLocated(By.className("CodeMirror-code"));
  const lines = await codeEditorContainer.findElements(By.className("CodeMirror-line"));

  const firstLine = lines[0];
  await driver.actions().move({origin:firstLine}).click().sendKeys(" ").perform();
  console.log("input finish");
  // 点击preview按钮
  const previewButton = await driver.waitElementEnableAndVisible(By.className("render-button"));
  await previewButton.click();
  console.log("previewButton Click");
  const mermaids = await waitBitbucketPreviewRender(driver);
  await checkMermaid(driver, 1, mermaids);
  // 取消
  const cancelButton = await driver.waitElementLocated(By.className("cancel-link"));
  await cancelButton.click();
  console.log("cancelButton Click");
  const confirmButton = await driver.waitElementEnableAndVisible(By.className("dialog-submit"));
  await confirmButton.click();
  console.log("confirmButton Click");
  await waitMermaidRender(driver);
  await checkMermaid(driver, 1);
}

export const testBitBucketDownloadFailed = async (driver) => {
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
  await waitMermaidRender(driver);
  await checkMermaid(driver, 1);
  const textElement = await driver.findElement(By.id("markdown-header-readme"));
  await clickDownloadMenu(driver, textElement, downloadKeyboardPressUpCount);

  const toast = await driver.waitElementLocated(By.className("toastify"));
  expect(await toast.getInnerHTML()).toBe('Please use it above the specific mermaid diagram<span class="toast-close">✖</span>');
}

export const testBitBucketDownloadSuccess = async (driver) => {
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
  await waitMermaidRender(driver);
  await checkMermaid(driver, 1);
  const mermaidElement = await driver.findElement(By.css(renderedMermaidSelector));
  await clickDownloadMenu(driver, mermaidElement, downloadKeyboardPressUpCount);
  await checkDownload(driver);
}

export const testGitHubNativeDownloadSuccess = async (driver) => {
  await driver.get("https://github.com/zephyraft/mermaid-previewer");
  // Store the web element
  const iframe = await driver.waitElementVisible(By.css("iframe.render-viewer"));
  // Switch to the frame
  await driver.switchTo().frame(iframe);

  const mermaidElement = await driver.findElement(By.css("div.mermaid-view div.mermaid"));
  await clickDownloadMenu(driver, mermaidElement, downloadKeyboardPressUpCountOfIframe);
  await checkDownload(driver);
}
