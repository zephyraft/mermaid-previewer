import { initDriver, sleep } from "./selenium-utils";
import { defaultMatchSelectorList } from "../src/utils/storage";
import { HadRenderedSelector } from "../src/content/selectors";
import { By } from "selenium-webdriver";
import { addGithubCookie } from "./cookie/github";
import { addBitbucketCookie } from "./cookie/bitbucket";

import robot from "robotjs";

import fs from "fs";
import os from "os";

let driver;

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

const clickDownloadMenu = async (element, upCount) => {
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

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  driver.destroy();
});

describe("mermaid-render", () => {
  test("bitbucket-render", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
  });

  // test("github-render", async () => {
  //   await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
  //   await waitMermaidRender();
  //   await checkMermaid(14);
  // });
});

describe("mermaid-edit-preview", () => {
  // test("github-edit-preview", async () => {
  //   await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
  //   await addGithubCookie(driver);
  //   await driver.navigate().refresh();
  //   // 编辑
  //   const editButton = await driver.waitElementLocated(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md'] > button"));
  //   // const form = await driver.findElement(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md']"));
  //   // console.log(await form.getAttribute("innerHTML"));
  //   // 点击preview按钮
  //   await editButton.click();
  //   console.log("editButton Click");
  //   // 等待edit加载完成
  //   const previewButton = await driver.waitElementLocated(By.className("preview"));
  //   await previewButton.click();
  //   console.log("previewButton Click");
  //   await waitMermaidRender();
  //   await checkMermaid(14);
  // });
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
    await driver.actions().move({origin:firstLine}).click().sendKeys(" ").perform();
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

describe("download", () => {
  const upCount = 3;
  const iframeUpCount = 5;

  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAHwAAAA6CAYAAAByHz3PAAAAAXNSR0IArs4c6QAABGRJREFUeF7tnEtIVFEYx787TioZaG5kZDAiDYMULNuEFS1KUGjhIkVzpbkJcyQFhdIUIUSb8bFJUbIW0UaDyIXthnIjNZCGUEbCFFIIlWSOz7lxrCujzsz97p25r7nfXep5/n7nf86d4TAc0GMqApypZkuTBRJuskVAwkm4yQiYbLqUcBJuMgImm27YhPc75lq14lHbk9WmVd/R6NflmE+xwmZdNNqS2kY4dqLCT55Lvav2u/zs5E/fjfuZB6VOVE/lmfAE69a3E2cPJ6g5rvevfvhrXVlxofpECc+5kKramNdX/fDMNR8zwq82HVNNOO8HeHrvEwlXbbUGdCQknISL0KeEy1+elHD57CKuSQlHIqSEI0EFKUYJl88u4pqUcCRCSjgSFCVcPiglalLCkVQp4UhQlHD5oJSoSQlHUqWEI0FRwuWDUqImJRxJlRKOBKW3hE9MPIf0dDvk5JySNAOzCp+Z8UBDQ80uVmlpNujo6IOMjKMohpp98bK09AtaWhxgs9mhvv42JCQkogbMCuldeF5eXiXHce88Hs90uElJ3dIF4d3dgzshGR7uh+npt9De3gPJySmiDDUTzgY/Pj4Gy8u/oabGgV6hRhFusVgeA8AjnuedocRHQzjj2NXVik65JsLX1lbB5eqA4uISmJqaBLv9CBQWXhFdnUIBIyT8v3BhyEHFRypc4Mg6we6Smgj3eudhcLAHGhvbwOv9DENDfegtyWAJ37uId4mXKzyw0cDtHZMYTYSzc4c9VVW1IJzl1dU30S9vBkx4UPGV50e97IoT9gJEqDPc7X6p3y09mGC2ABYXv6O3JSZ81Dm3OeKusALAv9Wjo8fv92dbLJZLYkOKtybBtYKhrdLm0PfLAtsIJjxwW2c7ZlxcyKtq202pnnD2UczpbN/HQsrHiz3Cxbiq/n+e54HjxK/zM+EVBQNQ1pyNGmMw4ayi8Kbe1TUA8fHhr8epKlxId27u6e3tXHiEvxcVlaBe3pjwMeenjYfu8lsoUioX4nn+DMdxlSLd+hIPJL8uL3hwsbQpi+1Uoo/hEh5qhQau0t7eEdGJG/wMXwIAp8/nc16/PG6N9AwXdkzsy5uqCe/svAMLC1+CvpELi2Fi4k2sCt8RPTs7u8wmGY23dClHoSZnuKhNRAGDJXyfaGGKUoUj0IgWUTXhoqNBFjCIcPbpYXvrFhK9d3okPEaE5+fnl62srLwIJZoSjhQtFNN7wrHToYQjSZFwJKggxegMl88u4pqUcCRCSjgSFCVcPiglalLCkVQp4UhQlHD5oJSoSQlHUqWEI0FRwuWDUqImJRxJlRKOBEUJlw9KiZqUcCRVSjgSFCVcPiglalLCkVQp4UhQSiXcnn1I9btlC3N/rLHyS4y2zKR1+Qql1/z6YTlJ/i8x1n0sl95ldGrU9h5/Ep2WtGll+7dW+Y0iLXoPx078vq0WI6Y+FSNAwhVDq8+GSbg+vSg2KhKuGFp9NkzC9elFsVGRcMXQ6rPhvx2h63eDzuvvAAAAAElFTkSuQmCC";

  const checkDownload = async () => {
    const toast = await driver.waitElementLocated(By.className("toastify"));
    expect(await toast.getInnerHTML()).toBe("Export Success<span class=\"toast-close\">✖</span>");
    fs.readdirSync(`${os.homedir}/Downloads`).filter(filename => filename.startsWith("mermaid-") && filename.endsWith(".png")).forEach(filename => {
      const file = `${os.homedir}/Downloads/${filename}`;
      const image = fs.readFileSync(file, { encoding: "base64" });
      console.log("data:image/png;base64," + image);
      expect(image).toBe(base64);
      console.log(`删除测试文件: ${file}`);
      fs.unlinkSync(file);
    });
  };

  test("download-failed", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
    const textElement = await driver.findElement(By.id("markdown-header-readme"));
    await clickDownloadMenu(textElement, upCount);

    const toast = await driver.waitElementLocated(By.className("toastify"));
    expect(await toast.getInnerHTML()).toBe('Please use it above the specific mermaid diagram<span class="toast-close">✖</span>');
  });

  test("download-success", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
    const mermaidElement = await driver.findElement(By.css(renderedMermaidSelector));
    await clickDownloadMenu(mermaidElement, upCount);
    await checkDownload();
  });

  test("download-github-native", async () => {
    await driver.get("https://github.com/zephyraft/mermaid-previewer");
    // Store the web element
    const iframe = await driver.waitElementVisible(By.css("iframe.render-viewer"));
    // Switch to the frame
    await driver.switchTo().frame(iframe);

    const mermaidElement = await driver.findElement(By.css("div.mermaid-view div.mermaid"));
    await clickDownloadMenu(mermaidElement, iframeUpCount);
    await checkDownload();
  });
});