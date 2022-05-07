// jest https://jestjs.io/docs/getting-started
// selenium https://www.selenium.dev/documentation
// js api文档 https://www.selenium.dev/selenium/docs/api/javascript/index.html
// 需要安装依赖
// https://geekflare.com/install-chromium-ubuntu-centos/
// https://www.selenium.dev/documentation/webdriver/getting_started/
// chrome浏览器驱动 https://chromedriver.storage.googleapis.com/index.html
// bitbucket 需要环境变量 BB_SESSION = 取自{cookie=cloud.session.token}
import { initDriver } from "./util/selenium-utils";
import { testOptionPopup } from "./option/option.js";
import {
  testBitBucketDownloadFailed,
  testBitBucketDownloadSuccess,
  testBitBucketEditPreview,
  testBitBucketRender, testGitHubNativeDownloadSuccess
} from "./content/content.js";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  driver.destroy();
});

describe("check", () => {
  test("driver-check", async () => {
    await driver.get("https://www.baidu.com/");
    // 检查当前页面标题
    const title = await driver.getTitle();
    expect(title).toBe("百度一下，你就知道");
  });
});

describe("option", () => {
  test("popup", async () => {
    await testOptionPopup(driver);
  });
});

describe("render", () => {
  test("bitbucket-render", async () => {
    await testBitBucketRender(driver);
  });
  test("bitbucket-edit-preview", async () => {
    await testBitBucketEditPreview(driver);
  });
});

describe("download", () => {
  test("download-failed", async () => {
    await testBitBucketDownloadFailed(driver);
  });

  test("download-success", async () => {
    await testBitBucketDownloadSuccess(driver);
  });

  test("download-github-native", async () => {
    await testGitHubNativeDownloadSuccess(driver);
  });
});