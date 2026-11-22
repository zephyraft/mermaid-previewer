import { computePosition, flip, offset, shift } from "@floating-ui/dom";

import type { DiagramTheme, ExtensionMessage } from "~types";
import { diagramSurface } from "./diagram-surface";
import { isDiagramTheme, storageKey, writeSetting } from "./options";

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

function previewMessage(target: Element, previewId: string, update: boolean) {
  const svg = getSVG(target);
  if (!svg) return;
  const message: ExtensionMessage = {
    type: "open-diagram-preview",
    previewId,
    update,
    svg: serializeSVG(svg),
    fontAwesome: !!svg.querySelector('i[class*="fa"]'),
    surface: svg.isConnected
      ? diagramSurface(svg)
      : { color: "#fff", dark: false },
  };
  return message;
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
    #mermaid-previewer-controls[hidden], [hidden] { display: none; }
    button { box-sizing: border-box; display: grid; place-items: center; width: 24px; height: 24px; padding: 1px;
      color: #605e5c; background: #faf9f8; border: 1px solid #b3b0ad; border-radius: 4px; cursor: pointer; }
    button:hover { background: #edebe9; }
    button svg { width: 20px; height: 20px; fill: currentColor; }
    #diagram-theme { font: 14px system-ui, sans-serif; }
    .theme-menu { position: fixed; inset: auto; margin: 0; padding: 4px; color: #323130; background: #faf9f8;
      border: 1px solid #b3b0ad; border-radius: 6px; box-shadow: 0 3px 12px #0003; }
    .theme-menu:popover-open { display: grid; }
    .theme-menu button { display: block; width: 100%; height: auto; padding: 6px 10px; text-align: left;
      color: inherit; font: 13px system-ui, sans-serif; border: 0; white-space: nowrap; }
    .theme-menu button[aria-pressed="true"] { background: #e9e6f2; font-weight: 600; }
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
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.id = "diagram-theme";
  themeButton.setAttribute("aria-label", "Diagram theme");
  const themeIcon = document.createElement("span");
  themeIcon.setAttribute("aria-hidden", "true");
  themeButton.append(themeIcon);

  const themeMenu = document.createElement("div");
  themeMenu.className = "theme-menu";
  themeMenu.popover = "auto";
  themeMenu.setAttribute("role", "group");
  themeMenu.setAttribute("aria-label", "Diagram theme options");
  for (const [value, { label }] of Object.entries(themeControls)) {
    const option = document.createElement("button");
    option.type = "button";
    option.value = value;
    option.textContent = label;
    themeMenu.append(option);
  }
  themeButton.popoverTargetElement = themeMenu;
  controls.append(
    previewButton,
    downloadButton,
    copyButton,
    themeButton,
    themeMenu,
  );
  root.append(style, controls);

  return {
    host,
    controls,
    previewButton,
    downloadButton,
    copyButton,
    themeButton,
    themeMenu,
    themeIcon,
  };
}

type PreviewDiagram = {
  source: string;
  container: Element;
  signal?: AbortSignal;
};

const themeControls = {
  background: { label: "Match page", icon: "◐" },
  system: { label: "System", icon: "▣" },
  light: { label: "Light", icon: "☀" },
  dark: { label: "Dark", icon: "☾" },
} as const;

export function createExporter(signal: AbortSignal) {
  const tracked = new WeakSet<Element>();
  const registrations = new WeakMap<Element, AbortController>();
  const {
    host,
    controls,
    previewButton,
    downloadButton,
    copyButton,
    themeButton,
    themeMenu,
    themeIcon,
  } = createControls();
  controls.hidden = true;
  let active: { target: Element; diagram?: PreviewDiagram } | undefined;
  let viewer:
    { id: string; container?: Element; queue: Promise<void> } | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const listenerOptions = { signal };

  function setTheme(theme: DiagramTheme) {
    const mode = themeControls[theme];
    themeButton.title = `Diagram theme: ${mode.label}`;
    themeIcon.textContent = mode.icon;
    for (const option of themeMenu.querySelectorAll("button")) {
      option.setAttribute("aria-pressed", String(option.value === theme));
    }
  }

  function hideLater() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!themeMenu.matches(":popover-open")) controls.hidden = true;
    }, 500);
  }

  async function show(target: Element, diagram?: PreviewDiagram) {
    clearTimeout(hideTimer);
    active = { target, diagram };
    previewButton.hidden =
      target instanceof HTMLIFrameElement && !getSVG(target);
    copyButton.hidden = themeButton.hidden = diagram === undefined;
    if (!diagram) themeMenu.hidePopover();
    controls.hidden = false;
    const { x, y } = await computePosition(target, controls, {
      placement: "right",
      strategy: "fixed",
      middleware: [offset(4), flip(), shift({ padding: 4, crossAxis: true })],
    });
    if (active?.target === target) {
      controls.style.left = `${x}px`;
      controls.style.top = `${y}px`;
      if (themeMenu.matches(":popover-open")) await positionThemeMenu();
    }
  }

  function submitPreview(
    target: Element,
    current: NonNullable<typeof viewer>,
    update: boolean,
  ) {
    const message = previewMessage(target, current.id, update);
    if (!message) return;
    current.queue = current.queue
      .then(async () => {
        if (signal.aborted || viewer !== current) return;
        const response = await chrome.runtime.sendMessage(message);
        if (!response?.ok)
          throw new Error("Could not display the diagram preview");
        if (response.data === false && viewer === current) viewer = undefined;
      })
      .catch(console.error);
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
      if (!active?.target.isConnected) return;
      viewer = {
        id: Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-"),
        container: active.diagram?.container,
        queue: Promise.resolve(),
      };
      submitPreview(active.target, viewer, false);
    },
    listenerOptions,
  );
  downloadButton.addEventListener(
    "click",
    () => {
      if (active?.target.isConnected)
        void download(active.target).catch(console.error);
    },
    listenerOptions,
  );
  copyButton.addEventListener(
    "click",
    () => {
      if (active?.diagram)
        void navigator.clipboard
          .writeText(active.diagram.source)
          .catch(console.error);
    },
    listenerOptions,
  );
  async function positionThemeMenu() {
    const { x, y } = await computePosition(themeButton, themeMenu, {
      placement: "right-start",
      strategy: "fixed",
      middleware: [offset(4), flip(), shift({ padding: 4 })],
    });
    themeMenu.style.left = `${x}px`;
    themeMenu.style.top = `${y}px`;
    themeMenu.style.visibility = "visible";
  }

  themeMenu.addEventListener(
    "beforetoggle",
    () => {
      themeMenu.style.visibility = "hidden";
    },
    listenerOptions,
  );
  themeMenu.addEventListener(
    "toggle",
    () => {
      if (themeMenu.matches(":popover-open")) {
        clearTimeout(hideTimer);
        void positionThemeMenu().catch(console.error);
      } else if (!controls.matches(":hover, :focus-within")) {
        hideLater();
      }
    },
    listenerOptions,
  );
  themeMenu.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      const theme = event.target.value;
      if (!isDiagramTheme(theme)) return;
      themeMenu.hidePopover();
      themeButton.focus();
      void writeSetting(storageKey.theme, theme).catch(console.error);
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

  function attach(target: Element, diagram?: PreviewDiagram) {
    if (tracked.has(target) || signal.aborted || diagram?.signal?.aborted)
      return;
    tracked.add(target);
    const replacingActive =
      diagram && active?.diagram?.container === diagram.container;
    if (replacingActive) active = { target, diagram };
    let targetSignal = signal;
    if (diagram) {
      registrations.get(diagram.container)?.abort();
      const controller = new AbortController();
      registrations.set(diagram.container, controller);
      targetSignal = AbortSignal.any([
        signal,
        controller.signal,
        ...(diagram.signal ? [diagram.signal] : []),
      ]);
      targetSignal.addEventListener(
        "abort",
        () => {
          if (active?.target !== target) return;
          clearTimeout(hideTimer);
          active = undefined;
          themeMenu.hidePopover();
          controls.hidden = true;
        },
        { once: true },
      );
      if (viewer?.container === diagram.container) {
        submitPreview(target, viewer, true);
      }
    }

    const targetListeners = { signal: targetSignal };
    if (!host.isConnected) document.body.append(host);
    const hoverTarget = diagram ? target : (target.parentElement ?? target);
    const showControls = () => {
      void show(target, diagram).catch(console.error);
    };
    if (!hoverTarget.hasAttribute("tabindex")) {
      hoverTarget.setAttribute("tabindex", "0");
    }
    hoverTarget.addEventListener("mouseenter", showControls, targetListeners);
    hoverTarget.addEventListener("mouseleave", hideLater, targetListeners);
    hoverTarget.addEventListener("focusin", showControls, targetListeners);
    hoverTarget.addEventListener("focusout", hideLater, targetListeners);
    if (
      (replacingActive && !controls.hidden) ||
      hoverTarget.matches(":hover, :focus-within")
    ) {
      showControls();
    }
  }

  return Object.assign(attach, { setTheme });
}
