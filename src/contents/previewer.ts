import { sendToBackground } from "@plasmohq/messaging";

import type { PlasmoCSConfig } from "plasmo";
import { preview } from "~core/preview";
import { isExclude } from "~core/filter";
import { getDownloadSelectorList } from "~core/options";
import { inDownloadURLs, inMatchURLs, matchURL } from "~core/selectors";
import { mermaidHover } from "~core/hover";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  css: ["fontawesome.css"],
  all_frames: true,
};

isExclude().then(async (isExclude) => {
  if (isExclude) {
    return;
  }

  const isHandled = await handleNativeDownload();
  if (isHandled) {
    return;
  }

  // 只有在匹配的规则内才注入mermaid
  if (await inMatchURLs()) {
    // 发送消息到background service
    await sendToBackground({
      name: "preview",
      body: {},
    });

    // 等待background service的注入mermaid到扩展的上下文之后，再进行后续处理
    await preview();
  }
});

const handleNativeDownload = async () => {
  if (await inDownloadURLs()) {
    // 不在匹配的规则内，只需要监听downloadSelector对应的dom，并处理下载
    // 为了支持类似github下大量mermaid图的md，本脚本执行时，可能还未加载完成，所以需要setInterval重复执行
    setInterval(async () => {
      const downloadSelector = (await getDownloadSelectorList())
        .filter((it) => matchURL(it.regex))
        .map((it) => it.selector)
        .join(", ");
      if (downloadSelector !== "") {
        const downloadDomList =
          document.querySelectorAll<HTMLElement>(downloadSelector);
        await mermaidHover(Array.from(downloadDomList), true);
      }
    }, 1000);
    return true;
  }
  return false;
};
