// chrome-extension://<扩展id>/public/html/options.html
// chrome-extension://oidjnlhbegipkcklbdfnbkikplpghfdl/public/html/options.html
import {
  destroyDriver,
  findShadowElement, getInnerHTML, getValue,
  initDriver,
  sleep,
  waitElementLocated,
  waitElementVisible
} from "./selenium-utils";
import { By } from "selenium-webdriver";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  await destroyDriver(driver);
});

const getExtensionId = async () => {
  await driver.get("chrome://extensions/");

  const extensionsManager = await waitElementLocated(driver, By.tagName("extensions-manager"));
  const extensionsList = await findShadowElement(extensionsManager, By.tagName("extensions-item-list"));
  const extensionsItem = await findShadowElement(extensionsList, By.tagName("extensions-item"));
  // 只有一个扩展
  const extensionId = await extensionsItem.getAttribute("id");

  // console.log(await (await findShadowElement(extensionsItem, By.id("name"))).getAttribute("innerHTML"));
  console.log("extensionId", extensionId);
  return extensionId;
};

test("popup", async () => {
  const extensionId = await getExtensionId();
  // 跳转
  await driver.get(`chrome-extension://${extensionId}/public/html/options.html`);
  // console.log(await (await driver.findElement(By.tagName("body"))).getAttribute("innerHTML"));

  const excludeDomainsLocator = By.id("ExcludeDomains");
  const matchSelectorsLocator = By.id("MatchSelectors");
  const excludeDomainInput = "github.com";
  const matchSelectorInput = "a > b";
  // 输入
  let excludeDomains = await waitElementLocated(driver, excludeDomainsLocator);
  let matchSelectors = await waitElementLocated(driver, matchSelectorsLocator);
  expect(await getValue(excludeDomains)).toBe("");
  expect(await getValue(matchSelectors)).toBe("");
  await excludeDomains.sendKeys(excludeDomainInput);
  await matchSelectors.sendKeys(matchSelectorInput);
  expect(await getValue(excludeDomains)).toBe(excludeDomainInput);
  expect(await getValue(matchSelectors)).toBe(matchSelectorInput);

  // 保存
  const saveButton = await waitElementLocated(driver, By.id("SaveButton"));
  await saveButton.click();

  const status = await waitElementVisible(driver, By.id("Status"));
  const info = await getInnerHTML(status);
  expect(info).toBe("Options Saved.");

  await sleep(1000);
  // 刷新页面
  await driver.navigate().refresh();
  excludeDomains = await waitElementLocated(driver, excludeDomainsLocator);
  matchSelectors = await waitElementLocated(driver, matchSelectorsLocator);
  expect(await getValue(excludeDomains)).toBe(excludeDomainInput);
  expect(await getValue(matchSelectors)).toBe(matchSelectorInput);

});