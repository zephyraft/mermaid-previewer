// jest https://jestjs.io/docs/getting-started
// selenium https://www.selenium.dev/documentation
// 需要安装依赖
// https://geekflare.com/install-chromium-ubuntu-centos/
// https://www.selenium.dev/documentation/webdriver/getting_started/
import { By, Key} from "selenium-webdriver";
import { destroyDriver, initDriver, waitElementLocated } from "./selenium-utils";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  await destroyDriver(driver);
});

test("selenium-check", async () => {
  await driver.get("https://www.baidu.com/");
  await driver.findElement(By.id("kw")).sendKeys("cheese", Key.ENTER);
  // 等待结果
  await waitElementLocated(driver, By.className("result-molecule"));
  // 检查当前页面标题
  const title = await driver.getTitle();
  expect(title).toBe("cheese_百度搜索");
});
