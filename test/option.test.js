// chrome-extension://<扩展id>/public/html/options.html
// chrome-extension://oidjnlhbegipkcklbdfnbkikplpghfdl/public/html/options.html

import { destroyDriver, initDriver } from "./selenium-utils";

let driver;

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  await destroyDriver(driver);
});


test("popup", async () => {
  console.log("start");
  await driver.get("chrome://extensions/");

  await driver.wait(until.elementLocated(By.className("items-container")), waitTimeout);
  const items = await driver.findElements(By.tagName("extensions-item"));
  for (const item of items) {
    const names = await item.findElement(By.id("name"));
    const html = await names.getAttribute("innerHTML");
    console.log(html);
  }
});