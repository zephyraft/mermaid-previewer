// Chrome serializes this function when injecting it into the top-level page.
export function showDiagramPreview(
  svg: string,
  surface: { color: string; dark: boolean },
  id: string,
  update: boolean,
) {
  const previewWindow = window as Window & {
    mermaidPreviewerViewer?: {
      id: string;
      display: (svg: string, surface: { color: string; dark: boolean }) => void;
      close: () => void;
    };
  };
  const current = previewWindow.mermaidPreviewerViewer;
  if (update) {
    if (current?.id !== id) return false;
    current.display(svg, surface);
    return true;
  }
  current?.close();

  const host = document.createElement("div");
  host.style.setProperty("all", "initial", "important");
  const root = host.attachShadow({ mode: "open" });
  const style = new CSSStyleSheet();
  style.replaceSync(`
      dialog {
        box-sizing: border-box;
        width: min(94vw, 1450px);
        height: 88dvh;
        max-width: none;
        padding: 0;
        border: 1px solid #d9d5e4;
        border-radius: 15px;
        overflow: hidden;
        background: #fff;
        color: #241c35;
        font: 14px system-ui, sans-serif;
        box-shadow: 0 24px 80px #14102066;
      }
      dialog[open] { display: flex; flex-direction: column; }
      dialog::backdrop { background: #171321a8; }
      dialog.dark { border-color: #475060; background: #252832; color: #f2f3f8; color-scheme: dark; }
      header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-bottom: 1px solid #85809255;
      }
      h2 { flex: 1; margin: 0 6px 0 0; font-size: 16px; font-weight: 650; }
      output { min-width: 4ch; text-align: center; font-variant-numeric: tabular-nums; }
      button {
        min-width: 34px;
        min-height: 34px;
        padding: 0 9px;
        border: 1px solid #85809270;
        border-radius: 7px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      button:hover:not(:disabled) { background: #88819a24; }
      button:disabled { opacity: .45; cursor: default; }
      button:focus-visible, .canvas:focus-visible { outline: 2px solid #8976ce; outline-offset: -2px; }
      .canvas {
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: grid;
        place-items: center;
        touch-action: none;
        user-select: none;
        cursor: grab;
      }
      .canvas[data-dragging] { cursor: grabbing; }
      img { position: absolute; inset: 0; margin: auto; pointer-events: none; }
      p { padding: 0 16px; text-align: center; }
  `);
  root.adoptedStyleSheets = [style];
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-labelledby", "title");
  const header = document.createElement("header");
  const title = document.createElement("h2");
  title.id = "title";
  title.textContent = "Diagram preview";
  const percentage = document.createElement("output");
  percentage.setAttribute("aria-label", "Zoom level");

  function button(label: string, text: string) {
    const control = document.createElement("button");
    control.type = "button";
    control.setAttribute("aria-label", label);
    control.textContent = text;
    return control;
  }

  const minus = button("Zoom out", "−");
  const plus = button("Zoom in", "+");
  const fit = button("Fit diagram", "Fit");
  const close = button("Close preview", "Close");
  close.autofocus = true;
  header.append(title, minus, percentage, plus, fit, close);

  const canvas = document.createElement("div");
  canvas.className = "canvas";
  canvas.setAttribute("role", "region");
  canvas.setAttribute("aria-label", "Diagram canvas");
  canvas.tabIndex = 0;
  const image = document.createElement("img");
  image.alt = "Mermaid diagram";
  image.draggable = false;
  image.hidden = true;
  const error = document.createElement("p");
  error.setAttribute("role", "status");
  error.textContent = "The diagram could not be displayed.";
  error.hidden = true;
  canvas.append(image, error);
  dialog.append(header, canvas);
  root.append(dialog);

  const minZoom = 0.25;
  const maxZoom = 8;
  const zoomStep = 1.25;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let width = 0;
  let height = 0;
  let drag: { id: number; startX: number; startY: number } | undefined;

  function updateView() {
    const maxX = Math.max(0, (width * zoom - canvas.clientWidth) / 2);
    const maxY = Math.max(0, (height * zoom - canvas.clientHeight) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
    image.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    percentage.value = `${Math.round(zoom * 100)}%`;
    minus.disabled = !width || zoom <= minZoom;
    plus.disabled = !width || zoom >= maxZoom;
    fit.disabled = !width;
  }

  function resizeImage() {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const fitScale =
      0.94 *
      Math.min(
        canvas.clientWidth / image.naturalWidth,
        canvas.clientHeight / image.naturalHeight,
      );
    width = image.naturalWidth * fitScale;
    height = image.naturalHeight * fitScale;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    updateView();
  }

  function setZoom(next: number, x = 0, y = 0) {
    if (!width) return;
    const clamped = Math.min(maxZoom, Math.max(minZoom, next));
    panX = x + ((panX - x) * clamped) / zoom;
    panY = y + ((panY - y) * clamped) / zoom;
    zoom = clamped;
    updateView();
  }

  function resetView() {
    zoom = 1;
    panX = panY = 0;
    updateView();
  }

  minus.addEventListener("click", () => setZoom(zoom / zoomStep));
  plus.addEventListener("click", () => setZoom(zoom * zoomStep));
  fit.addEventListener("click", resetView);
  close.addEventListener("click", () => dialog.close());
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (!event.deltaY) return;
      const bounds = canvas.getBoundingClientRect();
      setZoom(
        zoom * (event.deltaY < 0 ? zoomStep : 1 / zoomStep),
        event.clientX - bounds.left - bounds.width / 2,
        event.clientY - bounds.top - bounds.height / 2,
      );
    },
    { passive: false },
  );
  canvas.addEventListener("pointerdown", (event) => {
    if (!width || event.button !== 0 || drag) return;
    drag = {
      id: event.pointerId,
      startX: event.clientX - panX,
      startY: event.clientY - panY,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.setAttribute("data-dragging", "");
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    panX = event.clientX - drag.startX;
    panY = event.clientY - drag.startY;
    updateView();
  });
  canvas.addEventListener("lostpointercapture", () => {
    drag = undefined;
    canvas.removeAttribute("data-dragging");
  });
  const arrowOffsets: Record<string, [number, number]> = {
    ArrowLeft: [40, 0],
    ArrowRight: [-40, 0],
    ArrowUp: [0, 40],
    ArrowDown: [0, -40],
  };
  canvas.addEventListener("keydown", (event) => {
    if (
      !["+", "=", "-", "0"].includes(event.key) &&
      !Object.hasOwn(arrowOffsets, event.key)
    )
      return;
    event.preventDefault();
    if (event.key === "+" || event.key === "=") setZoom(zoom * zoomStep);
    else if (event.key === "-") setZoom(zoom / zoomStep);
    else if (event.key === "0") resetView();
    else {
      const [x, y] = arrowOffsets[event.key];
      panX += x;
      panY += y;
      updateView();
    }
  });

  const observer = new ResizeObserver(resizeImage);
  dialog.addEventListener(
    "close",
    () => {
      observer.disconnect();
      host.remove();
      if (previewWindow.mermaidPreviewerViewer?.id === id) {
        delete previewWindow.mermaidPreviewerViewer;
      }
    },
    { once: true },
  );
  image.addEventListener("error", () => {
    error.hidden = false;
  });
  image.addEventListener("load", () => {
    image.hidden = false;
    resizeImage();
  });

  document.body.append(host);
  dialog.showModal();
  updateView();
  observer.observe(canvas);
  function display(markup: string, background: typeof surface) {
    dialog.classList.toggle("dark", background.dark);
    canvas.style.backgroundColor = background.color;
    error.hidden = true;
    // Image mode keeps scripts and links in site-provided SVGs inactive.
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  previewWindow.mermaidPreviewerViewer = {
    id,
    display,
    close: () => dialog.close(),
  };
  display(svg, surface);
  return true;
}
