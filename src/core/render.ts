import type { Mermaid } from "mermaid";
import { detectType } from "pele/core";
import type { ExtensionMessage, Renderer } from "~types";
import { diagramSurface } from "./diagram-surface";
import { needsOfficialRenderer, renderWithPele } from "./pele";

export const diagramSource = "data-mermaid-previewer-raw";

export function findMermaid(container: HTMLElement) {
  return (
    !container.hasAttribute("data-processed") &&
    isMermaidSource(container.innerText)
  );
}

export function isMermaidSource(source: string | undefined) {
  if (!source) return false;
  try {
    return detectType(source.replace(/^\uFEFF/, "")) !== null;
  } catch {
    // Invalid frontmatter must not interrupt scanning other code blocks.
    return false;
  }
}

export type SourceDiagram = {
  container: HTMLElement;
  source: string;
  surface: ReturnType<typeof diagramSurface>;
};

export function readSourceDiagram(container: HTMLElement): SourceDiagram {
  return {
    container,
    source: container.innerText,
    surface: diagramSurface(container),
  };
}

type EngineWindow = Window & {
  mermaid?: Mermaid;
  pele?: Pick<typeof import("pele"), "render">;
};

async function loadRenderer(renderer: Renderer) {
  const message: ExtensionMessage = { type: "load-renderer", renderer };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(`Could not load ${renderer}`);
}

export function createDiagramRenderer(renderer: Renderer) {
  const engines = window as EngineWindow;
  let peleReady: Promise<EngineWindow["pele"]> | undefined;
  let mermaidReady: Promise<Mermaid> | undefined;

  return async (diagrams: SourceDiagram[], signal: AbortSignal) => {
    for (const { container, source } of diagrams) {
      container.setAttribute(diagramSource, source);
    }

    let official = diagrams;
    if (renderer === "pele") {
      official = [];
      const candidates: SourceDiagram[] = [];
      for (const diagram of diagrams) {
        if (needsOfficialRenderer(diagram.source)) official.push(diagram);
        else candidates.push(diagram);
      }
      if (candidates.length) {
        peleReady ??= loadRenderer("pele")
          .then(() => {
            if (typeof engines.pele?.render !== "function") {
              throw new Error("Pele did not start");
            }
            return engines.pele;
          })
          .catch((error) => {
            console.warn("Could not start Pele", error);
            return undefined;
          });
        const pele = await peleReady;
        if (signal.aborted) return;
        official.push(
          ...(pele
            ? await renderWithPele(pele, candidates, signal)
            : candidates),
        );
      }
    }

    if (!official.length || signal.aborted) return;
    mermaidReady ??= loadRenderer("mermaid").then(() => {
      const mermaid = engines.mermaid;
      if (typeof mermaid?.run !== "function")
        throw new Error("Mermaid.js did not start");
      return mermaid;
    });
    const mermaid = await mermaidReady;
    if (signal.aborted) return;

    for (const dark of [false, true]) {
      const group = official.filter(({ surface }) => surface.dark === dark);
      if (!group.length || signal.aborted) continue;
      mermaid.initialize({
        securityLevel: "strict",
        startOnLoad: false,
        theme: dark ? "dark" : "default",
      });
      for (const { container, source } of group) {
        container.textContent = source;
      }
      await mermaid.run({
        nodes: group.map(({ container }) => container),
        suppressErrors: true,
      });
    }
  };
}
