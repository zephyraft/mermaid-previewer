import { action, runtime, type Tabs } from "webextension-polyfill";

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
