export type ExcludeConfig =
  | { match: string; regex?: never }
  | { regex: string; match?: never };

export type SelectorConfig = ExcludeConfig & { selector: string };

export interface Experimental {
  sandbox: boolean;
}

export type ExtensionMessage =
  | { type: "activate-preview" }
  | { type: "download-svg"; svg: string; fontAwesome: boolean };
