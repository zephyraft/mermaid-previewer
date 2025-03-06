export interface ExcludeConfig {
  regex: string;
}

export interface SelectorConfig {
  regex: string;
  selector: string;
}

export interface Experimental {
  sandbox: boolean;
}
