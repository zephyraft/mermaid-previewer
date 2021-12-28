import { Builder, Capabilities, until, WebElement, WebDriver } from "selenium-webdriver";

export const waitTimeout = 10000;

export const initDriver = async () => {
  console.log("init driver");
  const chromeCapabilities = Capabilities.chrome();
  const path = process.cwd();
  // 加载插件
  chromeCapabilities.set("goog:chromeOptions", {
    args: [
      `--load-extension=${path}/dist`
    ]
  });
  const driver = new Builder()
    .withCapabilities(chromeCapabilities)
    .build();
  console.log("init driver finished");
  return driver
};

WebDriver.prototype.destroy = async function() {
  console.log("destroy driver");
  await this.quit();
  console.log("destroy driver finished");
};

export const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

WebDriver.prototype.waitElementLocated = async function(locator) {
  return await this.wait(until.elementLocated(locator), waitTimeout);
};

WebDriver.prototype.waitElementVisible = async function(locator) {
  const element = await this.waitElementLocated(locator);
  await this.wait(until.elementIsVisible(element), waitTimeout);
  return element;
};

WebDriver.prototype.waitElementEnableAndVisible = async function(locator) {
  const element = await this.waitElementVisible(locator);
  await this.wait(until.elementIsEnabled(element), waitTimeout);
  return element;
};

WebDriver.prototype.waitElementMatchText = async function(element, pattern) {
  return await this.wait(until.elementTextMatches(element, pattern), waitTimeout);
};

WebElement.prototype.findShadowElement = async function(locator) {
  // noinspection JSUnresolvedFunction
  const shadowRoot = await this.getShadowRoot();
  return shadowRoot.findElement(locator);
};

WebElement.prototype.findShadowElements = async function(locator) {
  // noinspection JSUnresolvedFunction
  const shadowRoot = await this.getShadowRoot();
  return shadowRoot.findElements(locator);
};

WebElement.prototype.getValue = async function() {
  // noinspection JSUnresolvedFunction
  return this.getAttribute("value");
};

WebElement.prototype.getInnerHTML = async function() {
  // noinspection JSUnresolvedFunction
  return this.getAttribute("innerHTML");
};

WebElement.prototype.getOuterHTML = async function() {
  // noinspection JSUnresolvedFunction
  return this.getAttribute("outerHTML");
};