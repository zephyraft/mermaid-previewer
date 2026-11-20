export type ExcludeConfig =
  { match: string; regex?: never } | { regex: string; match?: never };

export type SelectorConfig = ExcludeConfig & { selector: string };

export type Renderer = "pele" | "mermaid";

export interface Experimental {
  sandbox: boolean;
}

export type ExtensionMessage =
  | { type: "activate-preview" }
  | { type: "load-renderer"; renderer: Renderer }
  | { type: "resolve-font-awesome"; names: string[] }
  | { type: "download-svg"; svg: string; fontAwesome: boolean };
