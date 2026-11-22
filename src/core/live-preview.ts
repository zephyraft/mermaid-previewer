import type { DiagramAppearance } from "~types";
import { diagramSurface } from "./diagram-surface";
import type { createExporter } from "./exporter";
import {
  type createDiagramRenderer,
  diagramSource,
  isMermaidSource,
} from "./render";

const sourceMarker = "data-mermaid-previewer-live-source";
const previewMarker = "data-mermaid-previewer-live-preview";
const pendingMarker = "data-mermaid-previewer-live-pending";
export const livePreviewContents = `[${previewMarker}], [${pendingMarker}]`;

interface Preview {
  attempted: string;
  appearance: DiagramAppearance;
  output?: HTMLElement;
  outputAppearance?: DiagramAppearance;
  lifecycle?: AbortController;
}

export function createLivePreviews(
  render: ReturnType<typeof createDiagramRenderer>,
  attachExporter: ReturnType<typeof createExporter>,
  signal: AbortSignal,
) {
  const previews = new Map<HTMLElement, Preview>();
  const style = new CSSStyleSheet();
  style.replaceSync(`
    [${sourceMarker}], [${pendingMarker}] {
      position: absolute !important;
      overflow: hidden !important;
      clip-path: inset(50%) !important;
      pointer-events: none !important;
    }
    [${sourceMarker}] { width: 1px !important; height: 1px !important; }
    [${pendingMarker}] { width: 100%; white-space: pre; }
    [${previewMarker}] { display: block; min-width: 0; }
  `);
  document.adoptedStyleSheets.push(style);

  function forget(source: HTMLElement, preview: Preview) {
    preview.lifecycle?.abort();
    preview.output?.remove();
    source.removeAttribute(sourceMarker);
    previews.delete(source);
  }

  signal.addEventListener(
    "abort",
    () => {
      for (const [source, preview] of previews) forget(source, preview);
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (sheet) => sheet !== style,
      );
    },
    { once: true },
  );

  return async function update(
    containers: HTMLElement[],
    appearance: DiagramAppearance,
  ) {
    const current = new Map<HTMLElement, string>();
    for (const container of containers) {
      const source = container.innerText;
      if (isMermaidSource(source)) current.set(container, source);
    }
    // Rules can select both a code element and its wrapping element.
    for (const container of current.keys()) {
      for (
        let parent = container.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        current.delete(parent);
      }
    }
    for (const [source, preview] of previews) {
      if (!current.has(source)) forget(source, preview);
    }

    const pending = [...current].flatMap(([sourceNode, source]) => {
      const previous = previews.get(sourceNode);
      if (
        previous?.attempted === source &&
        previous.appearance === appearance
      ) {
        // The page can rebuild the surrounding nodes while retaining the source node.
        if (
          previous.output &&
          sourceNode.nextElementSibling !== previous.output
        ) {
          sourceNode.after(previous.output);
        }
        return [];
      }

      const preview = previous ?? { attempted: source, appearance };
      preview.attempted = source;
      preview.appearance = appearance;
      previews.set(sourceNode, preview);
      // Render beside the source so the page can keep updating its text nodes.
      const scratch = document.createElement("span");
      scratch.setAttribute(pendingMarker, "");
      const surface = diagramSurface(sourceNode, appearance);
      sourceNode.after(scratch);
      return [
        {
          sourceNode,
          preview,
          diagram: { container: scratch, source, surface },
        },
      ];
    });
    if (!pending.length) return;

    try {
      await render(
        pending.map(({ diagram }) => diagram),
        signal,
        appearance,
      );
      if (signal.aborted) return;
      // Streaming text can be incomplete while the last successful diagram is visible.
      const retries = pending.flatMap(({ preview, diagram }) => {
        const source = preview.output?.getAttribute(diagramSource);
        if (
          source == null ||
          source === diagram.source ||
          preview.outputAppearance === appearance ||
          diagram.container.firstElementChild instanceof SVGSVGElement
        ) {
          return [];
        }
        diagram.container.replaceChildren();
        diagram.container.removeAttribute("data-processed");
        return [{ ...diagram, source }];
      });
      if (retries.length) await render(retries, signal, appearance);

      for (const { sourceNode, preview, diagram } of pending) {
        if (signal.aborted) break;
        const output = diagram.container;
        const target = output.firstElementChild;
        if (
          !sourceNode.isConnected ||
          sourceNode.innerText !== diagram.source ||
          !(target instanceof SVGSVGElement)
        )
          continue;

        const previousLifecycle = preview.lifecycle;
        preview.output?.remove();
        output.removeAttribute(pendingMarker);
        output.setAttribute(previewMarker, "");
        sourceNode.setAttribute(sourceMarker, "");
        sourceNode.after(output);
        preview.output = output;
        preview.outputAppearance = appearance;
        preview.lifecycle = new AbortController();
        attachExporter(target, {
          source: output.getAttribute(diagramSource) ?? diagram.source,
          container: sourceNode,
          signal: preview.lifecycle.signal,
        });
        previousLifecycle?.abort();
      }
    } finally {
      for (const { diagram, preview } of pending) {
        if (diagram.container !== preview.output) diagram.container.remove();
      }
    }
  };
}
