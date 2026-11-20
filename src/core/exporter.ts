import { computePosition, flip, offset, shift } from "@floating-ui/dom";

import type { ExtensionMessage } from "~types";
import { diagramSurface } from "./diagram-surface";

function getSVG(target: Element): SVGSVGElement | null {
  if (target instanceof SVGSVGElement) return target;
  if (!(target instanceof HTMLIFrameElement)) return null;

  // Some sites wrap their rendered SVG in a data URL.
  const src = target.getAttribute("src") ?? "";
  const prefix = /^data:text\/html(?:;charset=[^;,]+)?;base64,/i.exec(
    src ?? "",
  );
  if (!prefix) return null;
  const bytes = Uint8Array.from(atob(src.slice(prefix[0].length)), (byte) =>
    byte.charCodeAt(0),
  );
  const html = new TextDecoder().decode(bytes);
  return new DOMParser()
    .parseFromString(html, "text/html")
    .querySelector("svg");
}

function serializeSVG(svg: SVGSVGElement) {
  const serializer = new XMLSerializer();
  const markup = serializer.serializeToString(svg);
  if (!svg.classList.contains("pele")) return markup;

  const copy = svg.cloneNode(true) as SVGSVGElement;
  const styles = getComputedStyle(svg);
  const variables = new Set(
    [...markup.matchAll(/var\(\s*(--pele-[a-z0-9-]+)/gi)].map(
      ([, variable]) => variable,
    ),
  );
  for (const variable of variables) {
    const value = styles.getPropertyValue(variable).trim();
    if (value) copy.style.setProperty(variable, value);
  }
  if (copy.querySelector("svg[data-font-awesome]")) {
    copy.prepend(
      document.createComment(
        "Font Awesome Free icons by Fonticons, Inc. Embedded under CC BY 4.0. https://fontawesome.com/license/free",
      ),
    );
  }
  return serializer.serializeToString(copy);
}

async function download(target: Element) {
  const svg = getSVG(target);
  if (!svg) return;
  const message: ExtensionMessage = {
    type: "download-svg",
    svg: serializeSVG(svg),
    fontAwesome: !!svg.querySelector('i[class*="fa"]'),
  };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error("Could not download the Mermaid diagram");
}

async function openPreview(target: Element) {
  const svg = getSVG(target);
  if (!svg) return;
  const message: ExtensionMessage = {
    type: "open-diagram-preview",
    svg: serializeSVG(svg),
    fontAwesome: !!svg.querySelector('i[class*="fa"]'),
    surface: svg.isConnected
      ? diagramSurface(svg)
      : { color: "#fff", dark: false },
  };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error("Could not open the diagram preview");
}

function createButton(id: string, title: string, iconPath: string) {
  const button = document.createElement("button");
  button.id = id;
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", iconPath);
  svg.append(path);
  button.append(svg);
  return button;
}

function createControls() {
  const host = document.createElement("div");
  host.dataset.mermaidPreviewerExporter = "overlay";
  host.id = "mermaid-previewer-exporter";
  host.style.setProperty("all", "initial", "important");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    #mermaid-previewer-controls { display: flex; gap: 4px; position: fixed; z-index: 2147483647; flex-direction: column; }
    #mermaid-previewer-controls[hidden], button[hidden] { display: none; }
    button { display: grid; place-items: center; width: 24px; height: 24px; padding: 1px;
      color: #605e5c; background: #faf9f8; border: 1px solid #b3b0ad; border-radius: 4px; cursor: pointer; }
    button:hover { background: #edebe9; }
    button svg { width: 20px; height: 20px; fill: currentColor; }
  `;
  const controls = document.createElement("div");
  controls.id = "mermaid-previewer-controls";

  const previewButton = createButton(
    "open-preview",
    "Open preview",
    "M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z",
  );
  const downloadButton = createButton(
    "download",
    "Download SVG",
    "M11 3h2v9l3.5-3.5 1.4 1.4-5.9 5.9-5.9-5.9 1.4-1.4L11 12V3ZM4 15h2v4h12v-4h2v6H4v-6Z",
  );
  const copyButton = createButton(
    "copy",
    "Copy Mermaid source",
    "M8 3H4v14h2V5h10V3H8Zm2 4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-8Zm0 2h8v10h-8V9Z",
  );
  controls.append(previewButton, downloadButton, copyButton);
  root.append(style, controls);

  return { host, controls, previewButton, downloadButton, copyButton };
}

export function createExporter(signal: AbortSignal) {
  const tracked = new WeakSet<Element>();
  const { host, controls, previewButton, downloadButton, copyButton } =
    createControls();
  controls.hidden = true;
  let activeTarget: Element | undefined;
  let activeSource: string | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const listenerOptions = { signal };

  function hideLater() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      controls.hidden = true;
    }, 500);
  }

  async function show(target: Element, source?: string) {
    clearTimeout(hideTimer);
    activeTarget = target;
    activeSource = source;
    previewButton.hidden =
      target instanceof HTMLIFrameElement && !getSVG(target);
    copyButton.hidden = source === undefined;
    controls.hidden = false;
    const { x, y } = await computePosition(target, controls, {
      placement: "right",
      strategy: "fixed",
      middleware: [offset(4), flip(), shift({ padding: 4, crossAxis: true })],
    });
    if (activeTarget === target) {
      controls.style.left = `${x}px`;
      controls.style.top = `${y}px`;
    }
  }

  controls.addEventListener(
    "mouseenter",
    () => clearTimeout(hideTimer),
    listenerOptions,
  );
  controls.addEventListener("mouseleave", hideLater, listenerOptions);
  controls.addEventListener(
    "focusin",
    () => clearTimeout(hideTimer),
    listenerOptions,
  );
  controls.addEventListener("focusout", hideLater, listenerOptions);
  previewButton.addEventListener(
    "click",
    () => {
      if (activeTarget) void openPreview(activeTarget).catch(console.error);
    },
    listenerOptions,
  );
  downloadButton.addEventListener(
    "click",
    () => {
      if (activeTarget) void download(activeTarget).catch(console.error);
    },
    listenerOptions,
  );
  copyButton.addEventListener(
    "click",
    () => {
      if (activeSource !== undefined)
        void navigator.clipboard.writeText(activeSource).catch(console.error);
    },
    listenerOptions,
  );
  signal.addEventListener(
    "abort",
    () => {
      clearTimeout(hideTimer);
      host.remove();
    },
    { once: true },
  );

  return (target: Element, source?: string, targetSignal = signal) => {
    if (tracked.has(target) || targetSignal.aborted) return;
    tracked.add(target);
    const targetListeners = { signal: targetSignal };
    if (!host.isConnected) document.body.append(host);
    const hoverTarget =
      source === undefined ? (target.parentElement ?? target) : target;
    const showControls = () => {
      void show(target, source).catch(console.error);
    };
    if (!hoverTarget.hasAttribute("tabindex"))
      hoverTarget.setAttribute("tabindex", "0");
    hoverTarget.addEventListener("mouseenter", showControls, targetListeners);
    hoverTarget.addEventListener("mouseleave", hideLater, targetListeners);
    hoverTarget.addEventListener("focusin", showControls, targetListeners);
    hoverTarget.addEventListener("focusout", hideLater, targetListeners);
    if (targetSignal !== signal) {
      targetSignal.addEventListener(
        "abort",
        () => {
          if (activeTarget !== target) return;
          clearTimeout(hideTimer);
          activeTarget = undefined;
          activeSource = undefined;
          controls.hidden = true;
        },
        { once: true },
      );
    }
    if (hoverTarget.matches(":hover, :focus-within")) showControls();
  };
}
