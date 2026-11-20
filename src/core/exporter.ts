import { computePosition, flip, offset, shift } from "@floating-ui/dom";

import type { ExtensionMessage } from "~types";

function getSVG(target: Element): SVGSVGElement | null {
  if (target instanceof SVGSVGElement) return target;
  if (!(target instanceof HTMLIFrameElement)) return null;

  // Mermaid sandbox mode renders a self-contained SVG in a data URL.
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

async function download(target: Element) {
  const svg = getSVG(target);
  if (!svg) return;
  const message: ExtensionMessage = {
    type: "download-svg",
    svg: new XMLSerializer().serializeToString(svg),
    fontAwesome: !!svg.querySelector('i[class*="fa"]'),
  };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error("Could not download the Mermaid diagram");
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

function createControls(placement: "overlay" | "inline") {
  const host = document.createElement("div");
  host.dataset.mermaidPreviewerExporter = placement;
  if (placement === "overlay") host.id = "mermaid-previewer-exporter";
  host.style.setProperty("all", "initial", "important");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    #mermaid-previewer-controls { display: flex; gap: 4px; }
    #mermaid-previewer-controls.overlay { position: fixed; z-index: 2147483647; flex-direction: column; }
    #mermaid-previewer-controls.inline { margin-block-start: 4px; }
    #mermaid-previewer-controls[hidden], button[hidden] { display: none; }
    button { display: grid; place-items: center; width: 24px; height: 24px; padding: 1px;
      color: #605e5c; background: #faf9f8; border: 1px solid #b3b0ad; border-radius: 4px; cursor: pointer; }
    button:hover { background: #edebe9; }
    button svg { width: 20px; height: 20px; fill: currentColor; }
  `;
  const controls = document.createElement("div");
  controls.id = "mermaid-previewer-controls";
  controls.className = placement;

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
  controls.append(downloadButton, copyButton);
  root.append(style, controls);

  return { host, controls, downloadButton, copyButton };
}

export function createExporter(signal: AbortSignal) {
  const tracked = new WeakSet<Element>();
  const { host, controls, downloadButton, copyButton } =
    createControls("overlay");
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

  return (target: Element, source?: string) => {
    if (tracked.has(target)) return;
    tracked.add(target);
    if (target instanceof HTMLIFrameElement && source !== undefined) {
      // The sandbox document owns its pointer events. Put its controls beside the frame.
      const toolbar = createControls("inline");
      toolbar.downloadButton.addEventListener(
        "click",
        () => {
          void download(target).catch(console.error);
        },
        listenerOptions,
      );
      toolbar.copyButton.addEventListener(
        "click",
        () => {
          void navigator.clipboard.writeText(source).catch(console.error);
        },
        listenerOptions,
      );
      const container = target.parentElement;
      if (!container) return;
      container.append(toolbar.host);
      signal.addEventListener("abort", () => toolbar.host.remove(), {
        once: true,
      });
      return;
    }
    if (!host.isConnected) document.body.append(host);
    const hoverTarget =
      source === undefined ? (target.parentElement ?? target) : target;
    const showControls = () => {
      void show(target, source).catch(console.error);
    };
    hoverTarget.addEventListener("mouseenter", showControls, listenerOptions);
    hoverTarget.addEventListener("mouseleave", hideLater, listenerOptions);
    if (hoverTarget.matches(":hover")) showControls();
  };
}
