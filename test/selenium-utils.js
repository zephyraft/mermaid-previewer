import { Builder, Capabilities, until } from "selenium-webdriver";

export const waitTimeout = 10000;

export const initDriver = async () => {
  console.log("init driver");
  const chromeCapabilities = Capabilities.chrome();
  // 加载插件
  chromeCapabilities.set("goog:chromeOptions", {
    args: [
      "--load-extension=./dist",
    ]
  });
  return new Builder()
    .withCapabilities(chromeCapabilities)
    .build();
}

export const destroyDriver = async (driver) => {
  console.log("destroy driver");
  await driver.quit();
}

export const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

export const waitElementLocated = async (driver, locator) => {
  return await driver.wait(until.elementLocated(locator), waitTimeout);
}

export const waitElementEnableAndVisible = async (driver, locator) => {
  const element = await waitElementLocated(driver, locator);
  await driver.wait(until.elementIsVisible(element), waitTimeout);
  await driver.wait(until.elementIsEnabled(element), waitTimeout);
  return element;
};

export const waitElementMatchText = async (driver, element, pattern) => {
  return await driver.wait(until.elementTextMatches(element, pattern), waitTimeout);
};

export const findShadowElement = async (element, locator) => {
  const shadowRoot = await element.getShadowRoot();
  return await shadowRoot.findElement(locator);
}

export const findShadowElements = async (element, locator) => {
  const shadowRoot = await element.getShadowRoot();
  return await shadowRoot.findElements(locator);
}

