import type { Mermaid } from "mermaid";
import type { ExtensionMessage, Renderer } from "~types";
import { needsOfficialRenderer, renderWithPele } from "./pele";

export const diagramSource = "data-mermaid-previewer-raw";

const diagramHeader =
  /^[ \t]*(graph(?:\s+\w+)?|flowchart(?:\s+\w+)?|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie(?:\s+showData|\s+title\s.+)?|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|kanban|architecture-beta)\s*\r?$/m;

export function findMermaid(container: HTMLElement) {
  return (
    !container.hasAttribute("data-processed") &&
    diagramHeader.test(container.innerText)
  );
}

export type SourceDiagram = { container: HTMLElement; source: string };

type EngineWindow = Window & {
  mermaid?: Mermaid;
  pele?: Pick<typeof import("pele"), "render">;
};

async function loadRenderer(renderer: Renderer) {
  const message: ExtensionMessage = { type: "load-renderer", renderer };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(`Could not load ${renderer}`);
}

export function createDiagramRenderer(renderer: Renderer, sandbox: boolean) {
  const engines = window as EngineWindow;
  let peleReady: Promise<EngineWindow["pele"]> | undefined;
  let mermaidReady: Promise<Mermaid> | undefined;

  return async (containers: HTMLElement[], signal: AbortSignal) => {
    const diagrams = containers.map((container) => {
      const source = container.innerText;
      container.setAttribute(diagramSource, source);
      return { container, source };
    });

    let official = diagrams;
    if (!sandbox && renderer === "pele") {
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
      mermaid.initialize({
        securityLevel: sandbox ? "sandbox" : "strict",
        startOnLoad: false,
      });
      return mermaid;
    });
    const mermaid = await mermaidReady;
    if (signal.aborted) return;

    for (const { container, source } of official) {
      container.textContent = source;
    }
    await mermaid.run({ nodes: official.map(({ container }) => container) });
  };
}
