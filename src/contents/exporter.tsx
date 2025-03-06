import { DocumentCopyFilled } from "@fluentui/react-icons";
import cssText from "data-text:./style.css";
import type { PlasmoCSConfig } from "plasmo";

import { sendToBackground } from "@plasmohq/messaging";

import { mermaidPreviewerExporterDom } from "~core/hover";
import { rawDataKey } from "~core/render";
import { enableSandbox } from "~core/options";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

const containsFontAwesome = (svgData: string): boolean => {
  return svgData.includes('<i class="fa');
};

// 将base64字符串解析为二进制数据
function base64ToBinary(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

// 将二进制数据转换为文本
function binaryToText(binaryData: Uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(binaryData);
}

function parseDOM(domString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, "text/html");
  return doc.body.firstChild;
}

const getSvgDataUrl = async () => {
  if (await enableSandbox()) {
    return getSvgDataUrlFromIframe();
  } else {
    return getSvgDataUrlFromSvgDom();
  }
};

const getSvgDataUrlFromIframe = () => {
  const iframeDom = mermaidPreviewerExporterDom;
  if (iframeDom == null) {
    console.warn("Cannot found iframe dom.");
    return;
  }

  try {
    const htmlBase64 = iframeDom.getAttribute("src");
    const base64 = htmlBase64.substring("data:text/html;base64,".length);
    const binary = base64ToBinary(base64);
    const domString = binaryToText(binary);
    const dom = parseDOM(domString) as HTMLElement;

    let svgData = new XMLSerializer().serializeToString(dom);
    console.log("svgData", svgData);

    if (containsFontAwesome(svgData)) {
      const styleIndex = svgData.indexOf("<style>");
      // noinspection JSUnresolvedLibraryURL
      const fontAwesomeCSS =
        '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" type="text/css"/>';
      svgData = `${svgData.substring(
        0,
        styleIndex,
      )}${fontAwesomeCSS}${svgData.substring(styleIndex)}`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  } catch (e) {
    let svgData = new XMLSerializer().serializeToString(iframeDom);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  }
};

const getSvgDataUrlFromSvgDom = () => {
  const svgDom = mermaidPreviewerExporterDom;
  if (svgDom == null) {
    console.warn("Cannot found svg dom.");
    return;
  }

  let svgData = new XMLSerializer().serializeToString(svgDom);
  if (containsFontAwesome(svgData)) {
    const styleIndex = svgData.indexOf("<style>");
    // noinspection JSUnresolvedLibraryURL
    const fontAwesomeCSS =
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" type="text/css"/>';
    svgData = `${svgData.substring(
      0,
      styleIndex,
    )}${fontAwesomeCSS}${svgData.substring(styleIndex)}`;
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
};

const getMermaidRawCode = () => {
  const svgDom = mermaidPreviewerExporterDom;
  if (svgDom == null) {
    console.warn("Cannot found svg dom.");
    return;
  }
  return svgDom.parentElement.getAttribute(rawDataKey);
};

const unescapeHTML = (str) => {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent;
};

const ExportButton = () => {
  return (
    <div className={"flex flex-col gap-y-1"}>
      <button
        id={"download"}
        title={"download"}
        onClick={async () => {
          // 发送消息到background service
          sendToBackground({
            name: "download",
            body: {
              url: await getSvgDataUrl(),
              filename: `${crypto.randomUUID()}.svg`,
            },
          }).then((_) => {});
        }}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
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
      <button
        id={"copy"}
        title={"copy"}
        onClick={() => {
          const rawCode = getMermaidRawCode();

          navigator.clipboard
            .writeText(unescapeHTML(rawCode))
            .catch((error) => {
              console.error("write to clipboard error", error);
            });
        }}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
        <DocumentCopyFilled width="1em" height="1em" />
      </button>
    </div>
  );
};

export default ExportButton;
