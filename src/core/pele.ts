import type { DiagramTheme, ExtensionMessage } from "~types";
import type { SourceDiagram } from "./render";

type Pele = Pick<typeof import("pele"), "render">;

const darkVariables = {
  "--pele-fg": "#f1f3f7",
  "--pele-muted": "#b8c3d2",
  "--pele-line": "#d3dce8",
  "--pele-surface": "#2b303a",
  "--pele-surface-alt": "#232832",
  "--pele-border": "#8795a9",
  "--pele-accent": "#a9bfff",
};

const fontAwesomeReference =
  /\b(?:fa|fas|far|fab|fa-solid|fa-regular|fa-brands):[a-z\d-]+/gi;
const mermaidConfigKey =
  /(?:^|[\s,{])["']?(?:theme|themeVariables|themeCSS|layout|defaultRenderer|htmlLabels)["']?\s*:/m;

export function needsOfficialRenderer(source: string) {
  const frontmatter = /^\s*---[ \t]*\r?\n([\s\S]*?)\r?\n---(?=\s|$)/.exec(
    source,
  );
  const directives = [
    ...source.matchAll(/%%\{\s*(?:init|initialize)\s*:\s*([\s\S]*?)\}%%/gi),
  ];
  const configs = [
    frontmatter?.[1] ?? "",
    ...directives.map((match) => match[1]),
  ];
  return (
    configs.some((config) => mermaidConfigKey.test(config)) ||
    /\$\$[\s\S]+?\$\$/.test(source) ||
    /<\/?(?:div|span|img|table|a|p|code|pre|sub|sup|font)\b[^>]*>/i.test(source)
  );
}

export async function renderWithPele(
  pele: Pele,
  candidates: SourceDiagram[],
  signal: AbortSignal,
  theme: DiagramTheme,
) {
  const diagrams = candidates.map((diagram) => ({
    ...diagram,
    icons: diagram.source.match(fontAwesomeReference) ?? [],
  }));
  const names = [...new Set(diagrams.flatMap((diagram) => diagram.icons))];
  let icons: Record<string, string> = {};
  if (names.length) {
    const message: ExtensionMessage = { type: "resolve-font-awesome", names };
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (response?.ok) icons = response.data;
    } catch (error) {
      console.warn("Could not resolve bundled Font Awesome icons", error);
    }
  }

  const fallback: SourceDiagram[] = [];
  for (const diagram of diagrams) {
    if (signal.aborted) break;
    const { container, source, surface } = diagram;
    if (diagram.icons.some((name) => !Object.hasOwn(icons, name))) {
      fallback.push(diagram);
      continue;
    }
    try {
      const id = `mermaid-${crypto.randomUUID()}`;
      const { svg } = pele.render(source.replace(/^\uFEFF/, ""), {
        idPrefix: id,
        autoDirection: false,
        icons: (name) => (Object.hasOwn(icons, name) ? icons[name] : undefined),
      });
      const output = document.createElement("template");
      output.innerHTML = svg;
      const diagramSVG = output.content.firstElementChild;
      if (!(diagramSVG instanceof SVGSVGElement))
        throw new Error("Pele did not return an SVG");
      diagramSVG.id = id;
      if (surface.dark || theme !== "auto") {
        const styles = getComputedStyle(container);
        if (theme !== "auto" || !styles.getPropertyValue("--pele-bg").trim()) {
          diagramSVG.style.setProperty("--pele-bg", surface.color);
        }
        for (const [variable, value] of Object.entries(darkVariables)) {
          if (theme !== "auto" || !styles.getPropertyValue(variable).trim()) {
            diagramSVG.style.setProperty(
              variable,
              surface.dark ? value : "initial",
            );
          }
        }
        diagramSVG.style.backgroundColor = "var(--pele-bg)";
      }
      container.setAttribute("data-processed", "true");
      container.replaceChildren(diagramSVG);
    } catch {
      fallback.push(diagram);
    }
  }
  return fallback;
}
