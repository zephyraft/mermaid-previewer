import { windowUrlExclude } from "~core/filter";
import { windowUrlInDownloadURLs, windowUrlInMatchURLs, matchWindowURL } from "~core/selectors";
import { preview } from "~core/preview";
import { getDownloadSelectorList } from "~core/options";
import { mermaidHover } from "~core/hover";

const handleNativeDownload = async () => {
  if (await windowUrlInDownloadURLs()) {
    // 不在匹配的规则内，只需要监听downloadSelector对应的dom，并处理下载
    // 为了支持类似github下大量mermaid图的md，本脚本执行时，可能还未加载完成，所以需要setInterval重复执行
    setInterval(async () => {
      const downloadSelector = (await getDownloadSelectorList())
        .filter((it) => matchWindowURL(it.regex))
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

windowUrlExclude().then(async (isExclude) => {
  if (isExclude) {
    return;
  }

  if (await handleNativeDownload()) {
    return;
  }

  if (await windowUrlInMatchURLs()) {
    await preview();
  }
});
