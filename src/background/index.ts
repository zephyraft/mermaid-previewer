import { getRegistrationMatches, selectRules } from "~core/rules";
import { readRules, ruleStorageKeys } from "~core/options";
import type { ExtensionMessage, PreviewWindow, Renderer } from "~types";
import { showDiagramPreview } from "./diagram-preview";
import { resolveFontAwesome } from "./font-awesome";

const { action, downloads, runtime, scripting, storage, tabs } = chrome;
const bootstrapId = "mermaid-previewer";
const legacyScriptIds = ["mermaid", "previewer", "downloader"];
const siteScript = "scripts/site.js";

action.onClicked.addListener(() => {
  void runtime.openOptionsPage().catch(console.error);
});

let registration = Promise.resolve();

function refreshRegistration() {
  registration = registration
    .then(async () => {
      const registered = await scripting.getRegisteredContentScripts({
        ids: [bootstrapId, ...legacyScriptIds],
      });
      const { matches, excludeMatches } = getRegistrationMatches(
        await readRules(),
      );
      const current = registered.find((script) => script.id === bootstrapId);

      if (matches.length === 0) {
        if (current) {
          await scripting.unregisterContentScripts({ ids: [bootstrapId] });
        }
      } else if (
        !current ||
        JSON.stringify([current.matches, current.excludeMatches ?? []]) !==
          JSON.stringify([matches, excludeMatches])
      ) {
        const script: chrome.scripting.RegisteredContentScript = {
          id: bootstrapId,
          js: ["scripts/bootstrap.js"],
          allFrames: true,
          matches,
          excludeMatches,
        };
        if (current) {
          await scripting.updateContentScripts([script]);
        } else {
          await scripting.registerContentScripts([script]);
        }
      }

      const legacy = registered.filter((script) =>
        legacyScriptIds.includes(script.id),
      );
      if (legacy.length) {
        await scripting.unregisterContentScripts({
          ids: legacy.map((script) => script.id),
        });
      }
    })
    .catch(console.error);
}

runtime.onInstalled.addListener(refreshRegistration);
runtime.onStartup.addListener(refreshRegistration);
storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && ruleStorageKeys.some((key) => key in changes)) {
    refreshRegistration();
  }
});
refreshRegistration();

async function needsPreview(url: string) {
  const { preview, download } = selectRules(await readRules(), url);
  return preview.length > 0 || download.length > 0;
}

async function recoverPreview(tabId: number, url: string) {
  if (!(await needsPreview(url))) return;

  // Chrome can miss a persisted content script on the first navigation after startup.
  const [page] = await scripting.executeScript({
    target: { tabId },
    func: (expectedUrl) =>
      location.href === expectedUrl &&
      !(window as PreviewWindow).mermaidPreviewerLifecycle,
    args: [url],
  });
  if (!page?.result) return;
  const target = page.documentId
    ? { tabId, documentIds: [page.documentId] }
    : { tabId, frameIds: [page.frameId] };
  await scripting.executeScript({ target, files: [siteScript] });
}

tabs.onUpdated.addListener((tabId, { status }, { url }) => {
  if (status === "complete" && url && /^(?:https?|file):/.test(url)) {
    void recoverPreview(tabId, url).catch(console.error);
  }
});

function injectionTarget(sender: chrome.runtime.MessageSender) {
  if (sender.tab?.id === undefined || sender.frameId === undefined) return;
  return {
    tabId: sender.tab.id,
    ...(sender.documentId
      ? { documentIds: [sender.documentId] }
      : { frameIds: [sender.frameId] }),
  };
}

async function activatePreview(sender: chrome.runtime.MessageSender) {
  const target = injectionTarget(sender);
  if (!target || !sender.url) return;

  if (await needsPreview(sender.url)) {
    await scripting.executeScript({ target, files: [siteScript] });
  }
}

async function loadRenderer(
  sender: chrome.runtime.MessageSender,
  renderer: Renderer,
) {
  const target = injectionTarget(sender);
  if (!target) throw new Error("Missing diagram frame");

  if (renderer === "mermaid") {
    await scripting.insertCSS({ target, files: ["fontawesome.css"] });
  }
  await scripting.executeScript({
    target,
    files: [renderer === "pele" ? "pele.global.js" : "mermaid.min.js"],
  });
}

let fontAwesomeCSS: Promise<string> | undefined;

async function embedFontAwesome(svg: string, fontAwesome: boolean) {
  if (!fontAwesome) return svg;
  fontAwesomeCSS ??= fetch(runtime.getURL("fontawesome.css"))
    .then((response) => {
      if (!response.ok)
        throw new Error("Could not load the bundled Font Awesome stylesheet");
      return response.text();
    })
    .catch((error) => {
      fontAwesomeCSS = undefined;
      throw error;
    });
  const css = await fontAwesomeCSS;
  return svg.replace(
    /^(<svg\b[^>]*>)/,
    (openingTag) => `${openingTag}<style><![CDATA[${css}]]></style>`,
  );
}

async function openDiagramPreview(
  sender: chrome.runtime.MessageSender,
  request: Extract<ExtensionMessage, { type: "open-diagram-preview" }>,
) {
  if (sender.tab?.id === undefined) throw new Error("Missing diagram tab");
  const svg = await embedFontAwesome(request.svg, request.fontAwesome);
  const [preview] = await scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: showDiagramPreview,
    args: [svg, request.surface, request.previewId, request.update],
  });
  return preview?.result ?? false;
}

async function downloadSVG(svg: string, fontAwesome: boolean) {
  svg = await embedFontAwesome(svg, fontAwesome);
  await downloads.download({
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    filename: `${crypto.randomUUID()}.svg`,
  });
}

runtime.onMessage.addListener((request: ExtensionMessage, sender, respond) => {
  if (sender.id !== runtime.id) return;
  let operation: Promise<unknown>;
  if (request?.type === "activate-preview") {
    operation = activatePreview(sender);
  } else if (
    request?.type === "load-renderer" &&
    (request.renderer === "pele" || request.renderer === "mermaid")
  ) {
    operation = loadRenderer(sender, request.renderer);
  } else if (
    request?.type === "resolve-font-awesome" &&
    Array.isArray(request.names) &&
    request.names.every((name) => typeof name === "string")
  ) {
    operation = resolveFontAwesome(request.names);
  } else if (
    request?.type === "open-diagram-preview" &&
    typeof request.svg === "string" &&
    request.svg.startsWith("<svg") &&
    typeof request.surface?.color === "string" &&
    typeof request.surface?.dark === "boolean" &&
    typeof request.previewId === "string" &&
    typeof request.update === "boolean"
  ) {
    operation = openDiagramPreview(sender, request);
  } else if (
    request?.type === "download-svg" &&
    typeof request.svg === "string" &&
    request.svg.startsWith("<svg")
  ) {
    operation = downloadSVG(request.svg, request.fontAwesome);
  } else {
    return;
  }
  void operation
    .then((data) => respond({ ok: true, data }))
    .catch((error) => {
      console.error(error);
      respond({ ok: false });
    });
  return true;
});
