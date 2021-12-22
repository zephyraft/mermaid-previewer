// jest https://jestjs.io/docs/getting-started
// selenium https://www.selenium.dev/documentation
// 需要安装依赖
// https://geekflare.com/install-chromium-ubuntu-centos/
// https://www.selenium.dev/documentation/webdriver/getting_started/
import { Builder, By, Capabilities, Key, until } from "selenium-webdriver";
import { HadRenderedSelector } from "../src/content/selectors";
import { defaultMatchSelectorList } from "../src/utils/storage";

const waitTimeout = 10000;
let driver;

beforeAll(async () => {
  console.log("init driver");
  const chromeCapabilities = Capabilities.chrome();
  // 加载插件
  chromeCapabilities.set("goog:chromeOptions", {
    args: [
      "--load-extension=./dist"
    ]
  })
  driver = await new Builder()
    .withCapabilities(chromeCapabilities)
    .build();
});

afterAll(async () => {
  console.log("quit driver");
  await driver.quit();
});

test("selenium-check", async () => {
  await driver.get("https://www.baidu.com/");
  await driver.findElement(By.id("kw")).sendKeys("cheese", Key.ENTER);
  // 等待结果
  await driver.wait(until.elementLocated(By.className("result-molecule")), waitTimeout);
  // 检查当前页面标题
  const title = await driver.getTitle();
  expect(title).toBe("cheese_百度搜索");
});

const renderTest = async (url) => {
  await driver.get(url);
  // 等待结果
  const selector = defaultMatchSelectorList.map((selector) => {
    selector += HadRenderedSelector;
    return selector;
  }).join(", ");
  const code = await driver.wait(until.elementLocated(By.css(selector)), waitTimeout);
  const svg = await code.findElement(By.tagName("svg"));
  expect(svg).toBeDefined();
  expect(await svg.getAttribute('outerHTML')).toMatch(/<svg.*<\/svg>/)
}

describe("mermaid-render", () => {
  test("bitbucket-render", async () => {
    await renderTest("https://bitbucket.org/zephyraft/test/src/master/");
  });

  test("github-render", async () => {
    await renderTest("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
  });
})