import { action, runtime, scripting, tabs, type Tabs } from "webextension-polyfill";
import { urlExclude } from "~core/filter";
import { urlInMatchURLs, urlInDownloadURLs } from "~core/selectors";
import previewerJsUrl from "url:~/previewer.ts";
import fontawesomeCssUrl from "url:~/resources/fontawesome.css";

const actionOnClicked = (_: Tabs.Tab) => {
  (async () => {
    // 打开配置页
    await runtime.openOptionsPage();
  })();
};

const inject = async (tabId: number, _: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) => {
  console.log("trigger inject", tabId, tab.url);
  if (await urlExclude(tab.url)) {
    return;
  }

  if (await urlInMatchURLs(tab.url)) {
    // 只有在匹配的规则内才注入mermaid
    await scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      // 注入的mermaid.js通过package.json中的web_accessible_resources配置，plasmo会自动从node_modules中查找并打包到扩展中
      files: ["mermaid.min.js"]
    });
    console.log("injected mermaid.min.js", tabId, tab.url);
  }

  // 只有在匹配的规则内才执行
  if (await urlInMatchURLs(tab.url) || await urlInDownloadURLs(tab.url)) {
    // 注入内容脚本实现mermaid渲染
    await scripting.executeScript(
      {
        target: {
          tabId,
          allFrames: true
        },
        files: [previewerJsUrl.substring(previewerJsUrl.lastIndexOf("/") + 1, previewerJsUrl.lastIndexOf(".")) + ".js"]
      }
    );
    console.log("injected previewer.js", tabId, tab.url);

    // 注入fontawesome css
    await scripting.insertCSS({
      target: {
        tabId,
        allFrames: true
      },
      files: [fontawesomeCssUrl.substring(fontawesomeCssUrl.lastIndexOf("/") + 1, fontawesomeCssUrl.lastIndexOf(".")) + ".css"]
    });
    console.log("injected fontawesome.css", tabId, tab.url);
  }
};

if (!action.onClicked.hasListener(actionOnClicked)) {
  // 扩展图标点击事件
  action.onClicked.addListener(actionOnClicked);
}

if (!tabs.onUpdated.hasListener(inject)) {
  // 注入内容脚本
  tabs.onUpdated.addListener(inject);
}
