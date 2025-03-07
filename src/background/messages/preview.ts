import { scripting, tabs } from "webextension-polyfill";

import type { PlasmoMessaging } from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const [tab] = await tabs.query({ active: true, lastFocusedWindow: true });
  //console.debug("query tab", tab);

  // 注入mermaid.js
  await scripting.executeScript({
    target: {
      tabId: tab.id,
      allFrames: true,
    },
    // 注入的mermaid.js通过package.json中的web_accessible_resources配置，plasmo会自动从node_modules中查找并打包到扩展中
    files: ["mermaid.min.js"],
  });

  res.send({
    message: "success",
  });
};

export default handler;
