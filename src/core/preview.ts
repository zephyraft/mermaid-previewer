import type { Mermaid } from "mermaid";

import { createExporter } from "./exporter";
import { readRules, readSetting, storageKey } from "./options";
import { diagramSource, findMermaid, renderMermaid } from "./render";
import { selectRules } from "./rules";
import type { SelectorConfig } from "~types";

type MermaidWindow = Window & { mermaid?: Mermaid };

function findContainers(rules: SelectorConfig[]) {
  const containers = new Set<HTMLElement>();
  for (const { selector } of rules) {
    try {
      document
        .querySelectorAll<HTMLElement>(selector)
        .forEach((container) => containers.add(container));
    } catch {
      console.warn(`Invalid Mermaid Previewer selector: ${selector}`);
    }
  }
  return [...containers];
}

export async function observeDiagrams(signal: AbortSignal) {
  const candidate = (window as MermaidWindow).mermaid;
  // Elements named "mermaid" can also appear as properties on window.
  const mermaid =
    typeof candidate?.initialize === "function" &&
    typeof candidate.run === "function"
      ? candidate
      : undefined;
  mermaid?.initialize({ startOnLoad: false });
  const rules = selectRules(await readRules(), location.href);
  if (signal.aborted || (!rules.preview.length && !rules.download.length))
    return;

  const attachExporter = createExporter(signal);
  let queued = false;
  let running = false;
  let restorePreview = false;

  function attachPreviewExporter(container: HTMLElement) {
    const source = container.getAttribute(diagramSource);
    const target = container.firstElementChild;
    if (
      source !== null &&
      (target instanceof SVGSVGElement || target instanceof HTMLIFrameElement)
    ) {
      attachExporter(target, source);
    }
  }

  async function scan() {
    queued = true;
    if (running) return;
    running = true;
    try {
      while (queued && !signal.aborted) {
        queued = false;
        if (mermaid && rules.preview.length) {
          const containers = findContainers(rules.preview);
          if (restorePreview) {
            restorePreview = false;
            for (const container of containers) {
              const source = container.getAttribute(diagramSource);
              if (source !== null) {
                container.textContent = source;
                container.removeAttribute("data-processed");
              }
            }
          }
          const diagrams = containers.filter(findMermaid);
          if (diagrams.length) {
            const { sandbox } = await readSetting(storageKey.experimental);
            if (signal.aborted) return;
            await renderMermaid(mermaid, diagrams, sandbox);
            if (signal.aborted) return;
          }
          containers.forEach(attachPreviewExporter);
        }

        for (const container of findContainers(rules.download)) {
          const target = container.querySelector("svg, iframe");
          if (target) attachExporter(target);
        }
      }
    } finally {
      running = false;
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const { target, removedNodes } of mutations) {
      if (!(target instanceof HTMLElement)) continue;

      // Mermaid renders batches sequentially. Enable export as each diagram appears.
      if (mermaid) attachPreviewExporter(target);

      // Exiting Bitbucket's Markdown editor restores the source view.
      if (
        removedNodes.length > 0 &&
        target.matches("#editor-container.maskable")
      ) {
        restorePreview = true;
      }
    }
    void scan().catch(console.error);
  });
  observer.observe(document, { childList: true, subtree: true });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  await scan();
}
