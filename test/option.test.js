// chrome-extension://<扩展id>/public/html/options.html
// chrome-extension://oidjnlhbegipkcklbdfnbkikplpghfdl/public/html/options.html
import { destroyDriver, findShadowElement, initDriver, sleep, waitElementLocated } from "./selenium-utils";
import { By } from "selenium-webdriver";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  await destroyDriver(driver);
});

const getExtensionId = async () => {
  console.log("start");
  await driver.get("chrome://extensions/");

  const extensionsManager = await waitElementLocated(driver, By.tagName("extensions-manager"));
  const extensionsList = await findShadowElement(extensionsManager, By.tagName("extensions-item-list"));
  const extensionsItem = await findShadowElement(extensionsList, By.tagName("extensions-item"));
  // 只有一个扩展
  const extensionId = await extensionsItem.getAttribute("id");
  console.log("extensionId", extensionId);
};

test("popup", async () => {
  const extensionId = await getExtensionId();
  await sleep(3000);
  // 跳转
  // await driver.get(`chrome-extension://${extensionId}/public/html/options.html`);
  await driver.get(`chrome-extension://${extensionId}`);
  console.log(await (await driver.findElement(By.tagName("body"))).getAttribute("innerHTML"));

  const excludeDomains = await waitElementLocated(driver, By.id("ExcludeDomains"));
  const matchSelectors = await waitElementLocated(driver, By.id("MatchSelectors"));

  console.log(await excludeDomains.getText());
  console.log(await matchSelectors.getText());

});