import { autoUpdate, computePosition, offset } from "@floating-ui/dom"
import type { MiddlewareState } from "@floating-ui/dom/src/types"

const getExporterContainer = (): HTMLElement => {
  // noinspection CssInvalidHtmlTagReference
  const shadowRoot = document.querySelector("plasmo-csui").shadowRoot
  return shadowRoot.querySelector("#plasmo-shadow-container")
    .firstElementChild as HTMLElement
}

const exporterWidth: number = 20
// 记录当前已添加监听事件的dom元素，避免重复监听
const watchDomList: HTMLElement[] = []
export let mermaidPreviewerExporterDom: HTMLElement | undefined = undefined

export const mermaidHover = async (domList: HTMLElement[]) => {
  domList
    .map((dom) => dom.firstElementChild)
    .filter((dom: HTMLElement) => !watchDomList.includes(dom))
    .forEach((svg: HTMLElement) => {
      watchDomList.push(svg)
      let hideTimeout
      const exporterContainer = getExporterContainer()

      autoUpdate(svg, exporterContainer, () => {
        computePosition(svg, exporterContainer, {
          placement: "right",
          middleware: [
            offset((_state: MiddlewareState) => {
              // 超过window宽度时，进行偏移（如github的iframe）
              if (
                window.innerWidth <
                svg.getBoundingClientRect().width + exporterWidth
              ) {
                return -exporterWidth
              }
              return 0
            })
          ]
        }).then(({ x, y }) => {
          Object.assign(exporterContainer.style, {
            left: `${x}px`,
            top: `${y}px`
          })
        })
      })

      const showExporter = () => {
        clearTimeout(hideTimeout)
        exporterContainer.parentElement.style.display = "block"
        mermaidPreviewerExporterDom = svg
      }
      const hideExporter = () => {
        exporterContainer.parentElement.style.display = "none"
      }

      svg.onmouseenter = (_) => {
        showExporter()
      }
      svg.onmouseleave = (_) => {
        hideTimeout = setTimeout(() => {
          hideExporter()
        }, 500)
      }
      exporterContainer.onmouseenter = (_) => {
        showExporter()
      }
      exporterContainer.onmouseleave = (_) => {
        hideExporter()
      }
    })
}
