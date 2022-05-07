import { By } from "selenium-webdriver";

// chrome-extension://<扩展id>/public/html/options.html
// chrome-extension://oidjnlhbegipkcklbdfnbkikplpghfdl/public/html/options.html
const getExtensionId = async (driver) => {
  await driver.get("chrome://extensions/");

  const extensionsManager = await driver.waitElementLocated(By.tagName("extensions-manager"));
  const extensionsList = await extensionsManager.findShadowElement(By.tagName("extensions-item-list"));
  const extensionsItem = await extensionsList.findShadowElement(By.tagName("extensions-item"));
  // 只有一个扩展
  const extensionId = await extensionsItem.getAttribute("id");

  // console.log(await (await findShadowElement(extensionsItem, By.id("name"))).getAttribute("innerHTML"));
  console.log("extensionId", extensionId);
  return extensionId;
};

export const testOptionPopup = async (driver) => {
  const extensionId = await getExtensionId(driver);
  // 跳转
  await driver.get(`chrome-extension://${extensionId}/public/html/options.html`);

  const excludeDomainsLocator = By.id("ExcludeDomains");
  const matchSelectorsLocator = By.id("MatchSelectors");
  const excludeDomainInput = "github.com";
  const matchSelectorInput = "a > b";
  // 输入
  let excludeDomains = await driver.waitElementLocated(excludeDomainsLocator);
  let matchSelectors = await driver.waitElementLocated(matchSelectorsLocator);

  expect(await excludeDomains.getValue()).toBe("");
  expect(await matchSelectors.getValue()).toBe("");
  await excludeDomains.sendKeys(excludeDomainInput);
  await matchSelectors.sendKeys(matchSelectorInput);
  expect(await excludeDomains.getValue()).toBe(excludeDomainInput);
  expect(await matchSelectors.getValue()).toBe(matchSelectorInput);

  // 保存
  const saveButton = await driver.waitElementLocated(By.id("SaveButton"));
  await saveButton.click();

  const status = await driver.waitElementVisible(By.id("Status"));
  const info = await status.getInnerHTML();
  expect(info).toBe("Options Saved.");

  // 刷新页面
  await driver.navigate().refresh();
  excludeDomains = await driver.waitElementLocated(excludeDomainsLocator);
  matchSelectors = await driver.waitElementLocated(matchSelectorsLocator);
  expect(await excludeDomains.getValue()).toBe(excludeDomainInput);
  expect(await matchSelectors.getValue()).toBe(matchSelectorInput);

}