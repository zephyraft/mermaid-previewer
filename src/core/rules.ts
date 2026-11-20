import type { ExcludeConfig } from "~types";
import { readRules } from "./options";

type Rules = Awaited<ReturnType<typeof readRules>>;

const supportedSchemes = ["http:", "https:", "file:"];

function splitPattern(pattern: string) {
  const parts = /^(\*|https?|file):\/\/([^/]*)(\/.*)$/.exec(pattern);
  if (!parts) return;
  const [, scheme, authority, path] = parts;
  if (scheme === "file") return { scheme, host: "", port: "*", path };

  const hostAndPort =
    /^(\*\.)?(\*|[^:[\]/@?#*\\\s]+|\[[\da-f:.]+\])(?::(\*|\d+))?$/i.exec(
      authority,
    );
  if (!hostAndPort) return;
  const [, subdomains = "", hostname, port = "*"] = hostAndPort;
  if (port !== "*" && (scheme === "*" || Number(port) > 65535)) return;
  if (hostname === "*") {
    if (!subdomains) return { scheme, host: hostname, port, path };
    return;
  }

  // Chrome canonicalizes hosts, including IDNs and IPv6 addresses.
  try {
    const host = new URL("http://" + hostname).hostname.replace(/\.+$/, "");
    if (host) return { scheme, host: subdomains + host, port, path };
  } catch {
    return;
  }
}

function matches(rule: ExcludeConfig, url: URL) {
  if (rule.match === "<all_urls>")
    return supportedSchemes.includes(url.protocol);
  if (rule.match !== undefined) {
    const pattern = splitPattern(rule.match);
    if (!pattern) return false;
    const { scheme, host, port, path } = pattern;
    if (
      scheme === "*"
        ? !["http:", "https:"].includes(url.protocol)
        : url.protocol !== `${scheme}:`
    ) {
      return false;
    }
    const hostname = url.hostname.replace(/\.+$/, "");
    if (
      scheme !== "file" &&
      host !== "*" &&
      host !== hostname &&
      !(
        host.startsWith("*.") &&
        (hostname === host.slice(2) || hostname.endsWith(host.slice(1)))
      )
    ) {
      return false;
    }
    const effectivePort =
      url.port || (url.protocol === "https:" ? "443" : "80");
    if (port !== "*" && port !== effectivePort) return false;
    const wildcard = path
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    return new RegExp(`^${wildcard}$`).test(url.pathname + url.search);
  }

  // Versions before 1.5.2 stored arbitrary URL regular expressions.
  try {
    return new RegExp(rule.regex).test(url.href);
  } catch {
    return false;
  }
}

export function getRegistrationMatches(rules: Rules) {
  const includes = [...rules.preview, ...rules.download];
  const matches = includes.some((rule) => rule.regex !== undefined)
    ? ["http://*/*", "https://*/*", "file:///*"]
    : includes.flatMap(({ match }) =>
        match === "<all_urls>" || (match && splitPattern(match)) ? [match] : [],
      );
  const excludeMatches = rules.excludes.flatMap(({ match }) =>
    match === "<all_urls>" || (match && splitPattern(match)) ? [match] : [],
  );
  return {
    matches: [...new Set(matches)],
    excludeMatches: [...new Set(excludeMatches)],
  };
}

export function selectRules(rules: Rules, href: string) {
  const url = new URL(href);
  if (
    !supportedSchemes.includes(url.protocol) ||
    rules.excludes.some((rule) => matches(rule, url))
  ) {
    return { preview: [], download: [] };
  }
  return {
    preview: rules.preview.filter((rule) => matches(rule, url)),
    download: rules.download.filter((rule) => matches(rule, url)),
  };
}
