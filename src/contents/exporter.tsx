import cssText from "data-text:./style.css"
import { nanoid } from "nanoid"
import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"

import { mermaidPreviewerExporterDom } from "~core/downloads"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const containsFontAwesome = (svgData: string): boolean => {
  return svgData.includes('<i class="fa')
}

const getSvgDataUrl = () => {
  const svgDom = mermaidPreviewerExporterDom
  if (svgDom == null) {
    console.warn("Cannot found svg dom.")
    return
  }

  let svgData = new XMLSerializer().serializeToString(svgDom)
  if (containsFontAwesome(svgData)) {
    const styleIndex = svgData.indexOf("<style>")
    // noinspection JSUnresolvedLibraryURL
    const fontAwesomeCSS =
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" type="text/css"/>'
    svgData = `${svgData.substring(
      0,
      styleIndex
    )}${fontAwesomeCSS}${svgData.substring(styleIndex)}`
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData)
}

const ExportButton = () => {
  return (
    <button
      id={"exporter"}
      onClick={() => {
        // 发送消息到background service
        sendToBackground({
          name: "download",
          body: {
            url: getSvgDataUrl(),
            filename: `${nanoid(10)}.svg`
          }
        }).then((_) => {})
      }}
      type="button"
      className="text-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24">
        <g fill="none">
          <path
            d="M11 6.5a5.5 5.5 0 0 1 5-5.478v5.77l-1.646-1.646a.5.5 0 0 0-.708.708l2.5 2.5a.5.5 0 0 0 .708 0l2.5-2.5a.5.5 0 0 0-.708-.708L17 6.793v-5.77A5.5 5.5 0 1 1 11 6.5zm8.5 3A.5.5 0 0 0 19 9h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zM6.25 4h4.248a6.451 6.451 0 0 0-.422 1.5H6.25A1.75 1.75 0 0 0 4.5 7.25V8h5.674c.125.528.314 1.03.558 1.5H4.5V14h4.558c.382 0 .692.31.692.692v.058a2.25 2.25 0 0 0 4.5 0v-.058c0-.382.31-.692.692-.692H19.5v-1.732A6.518 6.518 0 0 0 21 11.19v7.56A3.25 3.25 0 0 1 17.75 22H6.25A3.25 3.25 0 0 1 3 18.75V7.25A3.25 3.25 0 0 1 6.25 4z"
            fill="currentColor"></path>
        </g>
      </svg>
    </button>
  )
}

export default ExportButton
