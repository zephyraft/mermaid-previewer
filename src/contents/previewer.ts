import mermaid from "mermaid/dist/mermaid.min.js"
import type { PlasmoCSConfig } from "plasmo"

import { isExclude } from "~core/filter"
import { mermaidHover } from "~core/hover"
import { watchDomMutation } from "~core/mutation"
import { getDownloadSelectorList } from "~core/options"
import { queryAndSaveRaw, render } from "~core/render"
import { inMatchURLs, matchURL } from "~core/selectors"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  css: ["fontawesome.css"],
  all_frames: true
}

// 禁止自动render .mermaid类的dom，避免类似github下的报错问题
mermaid.initialize({ startOnLoad: false })
isExclude().then((isExclude) => {
  if (isExclude) {
    return
  }

  queryAndSaveRaw(document)
    .then(async (domList) => {
      if (await inMatchURLs()) {
        /**
         * 首次进入页面时，执行render
         */
        await render(domList)
        /**
         * 监听动态插入的dom
         */
        await watchDomMutation()
      } else {
        // 不在匹配的规则内，只需要监听downloadSelector对应的dom，并处理下载
        // 为了支持类似github下大量mermaid图的md，本脚本执行时，可能还未加载完成，所以需要setInterval重复执行
        setInterval(async () => {
          const downloadSelector = (await getDownloadSelectorList())
            .filter((it) => matchURL(it.regex))
            .map((it) => it.selector)
            .join(", ")
          if (downloadSelector !== "") {
            const downloadDomList =
              document.querySelectorAll<HTMLElement>(downloadSelector)
            await mermaidHover(Array.from(downloadDomList), true)
          }
        }, 1000)
      }
    })
    .catch((e) => {
      console.error(e)
    })
})
