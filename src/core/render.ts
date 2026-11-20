import type { Mermaid } from "mermaid";

export const diagramSource = "data-mermaid-previewer-raw";

const diagramHeader =
  /^[ \t]*(graph(?:\s+\w+)?|flowchart(?:\s+\w+)?|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie(?:\s+showData|\s+title\s.+)?|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|kanban|architecture-beta)\s*\r?$/m;

export function findMermaid(container: HTMLElement) {
  return (
    !container.hasAttribute("data-processed") &&
    diagramHeader.test(container.innerText)
  );
}

export async function renderMermaid(
  mermaid: Mermaid,
  containers: HTMLElement[],
  sandbox: boolean,
) {
  for (const container of containers) {
    const source = container.innerText;
    container.setAttribute(diagramSource, source);
    container.textContent = source;
  }
  mermaid.initialize({
    securityLevel: sandbox ? "sandbox" : "strict",
    startOnLoad: false,
  });
  try {
    await mermaid.run({ nodes: containers });
  } catch (error) {
    console.error(error);
  }
}
