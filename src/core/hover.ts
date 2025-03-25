import {
  computePosition,
  type MiddlewareState,
  offset,
} from "@floating-ui/dom";

const getExporterContainer = (): HTMLElement => {
  // noinspection CssInvalidHtmlTagReference
  const shadowRoot = document.querySelector("plasmo-csui").shadowRoot;
  return shadowRoot.querySelector("#plasmo-shadow-container")
    .firstElementChild as HTMLElement;
};

const getCopyButton = (): HTMLElement => {
  // noinspection CssInvalidHtmlTagReference
  const shadowRoot = document.querySelector("plasmo-csui").shadowRoot;
  return shadowRoot.getElementById("copy");
};

const exporterWidth: number = 20;
const scrollWidth: number = 20;
// 记录当前已添加监听事件的dom元素，避免重复监听
const watchDomList: HTMLElement[] = [];
let hideTimeout: number | undefined = undefined;

export const mermaidHover = async (
  domList: HTMLElement[],
  forDownloadSelector: boolean,
) => {
  domList
    .map((dom) => dom.firstElementChild)
    .filter((dom: HTMLElement) => !watchDomList.includes(dom))
    .forEach((svg: HTMLElement) => {
      watchDomList.push(svg);
      const exporterContainer = getExporterContainer();

      const showExporter = () => {
        clearTimeout(hideTimeout);
        exporterContainer.parentElement.style.display = "block";
        getCopyButton().style.display = forDownloadSelector ? "none" : "block";
      };
      const hideExporter = () => {
        exporterContainer.parentElement.style.display = "none";
      };

      svg.onmouseenter = (_) => {
        // @ts-ignore
        window.mermaidPreviewerExporterDom = svg;
        computePosition(svg, exporterContainer, {
          placement: "right",
          middleware: [
            offset((_state: MiddlewareState) => {
              // 超过window宽度时，进行偏移（如github的iframe）
              if (
                window.innerWidth <
                svg.getBoundingClientRect().width +
                  (exporterWidth + scrollWidth)
              ) {
                return -(exporterWidth + scrollWidth);
              }
              return 0;
            }),
          ],
        }).then(({ x, y }) => {
          Object.assign(exporterContainer.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        });
        showExporter();
      };
      svg.onmouseleave = (_) => {
        // @ts-ignore
        hideTimeout = setTimeout(() => {
          hideExporter();
        }, 500);
      };
      exporterContainer.onmouseenter = (_) => {
        showExporter();
      };
      exporterContainer.onmouseleave = (_) => {
        hideExporter();
      };
    });
};
