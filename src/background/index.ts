import { action, runtime, scripting, type Tabs } from "webextension-polyfill";
import previewerJsUrl from "url:~/previewer.ts";
import downloaderJsUrl from "url:~/downloader.ts";
import fontawesomeCssUrl from "url:~/resources/fontawesome.css";
import { getDownloadSelectorList, getExcludeURL, getMatchSelectorList, watchStorage } from "~core/options";

const actionOnClicked = (_: Tabs.Tab) => {
  (async () => {
    // 打开配置页
    await runtime.openOptionsPage();
  })();
};

if (!action.onClicked.hasListener(actionOnClicked)) {
  // 扩展图标点击事件
  action.onClicked.addListener(actionOnClicked);
}

registerContentScripts().then(_ => {});

// 编程式动态声明
watchStorage(async () => {
  await unregisterAllDynamicContentScripts();

  await registerContentScripts();
});

async function registerContentScripts() {
  const excludeConfigs = await getExcludeURL();
  const matchSelectors = await getMatchSelectorList();
  const downloadSelectors = await getDownloadSelectorList();

  const excludeMatches = excludeConfigs.flatMap(config => config.match !== undefined ? [config.match] : []);
  const matches = matchSelectors.flatMap(config => config.match !== undefined ? [config.match] : []);
  const downloadMatches = downloadSelectors.flatMap(config => config.match !== undefined ? [config.match] : []);

  console.log(excludeMatches, matches, downloadMatches);

  await scripting.registerContentScripts([
    {
      id: "mermaid",
      allFrames: true,
      excludeMatches,
      matches,
      js: ["mermaid.min.js"]
    }
  ]);

  await scripting.registerContentScripts([
    {
      id: "previewer",
      allFrames: true,
      excludeMatches,
      matches,
      js: [previewerJsUrl.substring(previewerJsUrl.lastIndexOf("/") + 1, previewerJsUrl.lastIndexOf(".")) + ".js"],
      css: [fontawesomeCssUrl.substring(fontawesomeCssUrl.lastIndexOf("/") + 1, fontawesomeCssUrl.lastIndexOf(".")) + ".css"]
    }
  ]);

  await scripting.registerContentScripts([
    {
      id: "downloader",
      allFrames: true,
      excludeMatches,
      matches: downloadMatches,
      js: [downloaderJsUrl.substring(downloaderJsUrl.lastIndexOf("/") + 1, downloaderJsUrl.lastIndexOf(".")) + ".js"],
    }
  ]);
}

async function unregisterAllDynamicContentScripts() {
  try {
    const scripts = await scripting.getRegisteredContentScripts();
    const scriptIds = scripts.map(script => script.id);
    return scripting.unregisterContentScripts({ ids: scriptIds });
  } catch (error) {
    const message = [
      "An unexpected error occurred while",
      "unregistering dynamic content scripts.",
    ].join(" ");
    throw new Error(message, {cause : error});
  }
}
