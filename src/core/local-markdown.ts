import MarkdownIt from "markdown-it";

import { localMarkdownPreviewRule, markdownFenceAttribute } from "./options";

export function prepareLocalMarkdown() {
  const source = document.querySelector<HTMLPreElement>("body > pre");
  if (!source) return;
  if (source.querySelector(localMarkdownPreviewRule.selector)) return source;
  if (source.childElementCount) return;

  const text = source.textContent ?? "";
  const lines = text.split(/(?<=\n)|(?<=\r)(?!\n)/);
  const content = document.createDocumentFragment();
  const tokens = new MarkdownIt("commonmark").parse(text, {});
  let nextLine = 0;

  for (const token of tokens) {
    if (token.type !== "fence" || !token.map || !token.content.trim()) continue;
    const [language] = token.info.trim().split(/\s+/, 1);
    if (language.toLowerCase() !== "mermaid") continue;

    const [start, end] = token.map;
    const diagram = document.createElement("span");
    diagram.setAttribute(markdownFenceAttribute, "");
    diagram.style.display = "block";
    diagram.textContent = token.content;
    content.append(lines.slice(nextLine, start).join(""), diagram);
    nextLine = end;
  }

  if (nextLine === 0) return;
  content.append(lines.slice(nextLine).join(""));
  source.replaceChildren(content);
  return source;
}
