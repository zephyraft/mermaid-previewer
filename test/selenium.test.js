// jest https://jestjs.io/docs/getting-started
// selenium https://www.selenium.dev/documentation
// 需要安装依赖
// https://geekflare.com/install-chromium-ubuntu-centos/
// https://www.selenium.dev/documentation/webdriver/getting_started/
const {Capabilities, Builder, By, Key, until } = require('selenium-webdriver');

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

test("plugin-check", async () => {
  await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
  // 等待结果 [data-processed=true]
  const code = await driver.wait(until.elementLocated(By.css("div.codehilite > pre[data-processed=true]")), waitTimeout);
  const svg = await code.findElement(By.tagName("svg"));
  console.log(await svg.getAttribute('outerHTML'));
  expect(svg).toBeDefined();
});