import { createExporter } from "./exporter";
import { createLivePreviews, livePreviewContents } from "./live-preview";
import { prepareLocalMarkdown } from "./local-markdown";
import {
  localMarkdownPreviewRule,
  readRules,
  readSetting,
  storageKey,
} from "./options";
import {
  createDiagramRenderer,
  diagramSource,
  findMermaid,
  readSourceDiagram,
} from "./render";
import { selectRules } from "./rules";
import type { SelectorConfig } from "~types";

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
  const rules = selectRules(await readRules(), location.href);
  if (signal.aborted || (!rules.preview.length && !rules.download.length))
    return;

  const render = rules.preview.length
    ? createDiagramRenderer(await readSetting(storageKey.renderer))
    : undefined;
  if (signal.aborted) return;

  const markdownSource = rules.preview.some(
    (rule) => "id" in rule && rule.id === localMarkdownPreviewRule.id,
  )
    ? prepareLocalMarkdown()
    : undefined;
  const liveRules = rules.preview.filter((rule) => rule.live === true);
  const staticRules = rules.preview.filter((rule) => rule.live !== true);
  const attachExporter = createExporter(signal);
  const livePreviews =
    render && liveRules.length
      ? createLivePreviews(render, attachExporter, signal)
      : undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;
  let queued = false;
  let running = false;
  let restorePreview = false;

  function attachPreviewExporter(container: HTMLElement) {
    const source = container.getAttribute(diagramSource);
    const target = container.firstElementChild;
    if (source !== null && target instanceof SVGSVGElement) {
      attachExporter(target, source);
    }
  }

  function isSourceContainer(container: HTMLElement) {
    return (
      container !== markdownSource &&
      !(livePreviews && container.closest(livePreviewContents))
    );
  }

  async function scan() {
    queued = true;
    if (running) return;
    running = true;
    try {
      while (queued && !signal.aborted) {
        queued = false;
        if (render) {
          const liveContainers = livePreviews
            ? findContainers(liveRules).filter(isSourceContainer)
            : [];
          const containers = findContainers(staticRules).filter(
            (container) =>
              isSourceContainer(container) &&
              !liveContainers.some(
                (source) =>
                  container.contains(source) || source.contains(container),
              ),
          );
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
          const diagrams = containers
            .filter(findMermaid)
            .map(readSourceDiagram);
          if (diagrams.length) {
            await render(diagrams, signal).catch(console.error);
            if (signal.aborted) return;
          }
          containers.forEach(attachPreviewExporter);
          await livePreviews?.(liveContainers).catch(console.error);
          if (signal.aborted) return;
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
      if (
        !(target instanceof HTMLElement) ||
        (livePreviews && target.closest(livePreviewContents))
      )
        continue;

      // Mermaid renders batches sequentially. Enable export as each diagram appears.
      if (render) attachPreviewExporter(target);

      // Exiting Bitbucket's Markdown editor restores the source view.
      if (
        removedNodes.length > 0 &&
        target.matches("#editor-container.maskable")
      ) {
        restorePreview = true;
      }
    }
    if (livePreviews) {
      // Coalesce rapid token updates while still displaying valid intermediate diagrams.
      liveTimer ??= setTimeout(() => {
        liveTimer = undefined;
        void scan().catch(console.error);
      }, 180);
      return;
    }
    void scan().catch(console.error);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    ...(livePreviews && {
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    }),
  });
  signal.addEventListener(
    "abort",
    () => {
      observer.disconnect();
      clearTimeout(liveTimer);
    },
    { once: true },
  );
  await scan();
}
