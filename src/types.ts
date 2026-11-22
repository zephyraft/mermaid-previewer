export type ExcludeConfig = (
  { match: string; regex?: never } | { regex: string; match?: never }
) & { enabled?: boolean };

export type SelectorConfig = ExcludeConfig & { selector: string };

export type PreviewConfig = SelectorConfig & { live?: boolean };

export type Renderer = "pele" | "mermaid";
export type DiagramTheme = "auto" | "light" | "dark";

export type PreviewWindow = Window & {
  mermaidPreviewerLifecycle?: AbortController;
};

export type ExtensionMessage =
  | { type: "activate-preview" }
  | { type: "load-renderer"; renderer: Renderer }
  | { type: "resolve-font-awesome"; names: string[] }
  | {
      type: "open-diagram-preview";
      svg: string;
      fontAwesome: boolean;
      surface: { color: string; dark: boolean };
      previewId: string;
      update: boolean;
    }
  | { type: "download-svg"; svg: string; fontAwesome: boolean };
