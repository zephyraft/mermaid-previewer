import { getRegistrationMatches, selectRules } from "~core/rules";
import { readRules, ruleStorageKeys } from "~core/options";
import type { ExtensionMessage } from "~types";

const { action, downloads, runtime, scripting, storage } = chrome;
const bootstrapId = "mermaid-previewer";
const legacyScriptIds = ["mermaid", "previewer", "downloader"];

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

      if (
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

async function activatePreview(sender: chrome.runtime.MessageSender) {
  if (
    sender.tab?.id === undefined ||
    sender.frameId === undefined ||
    !sender.url
  )
    return;

  const { preview, download } = selectRules(await readRules(), sender.url);
  if (!preview.length && !download.length) return;

  const target = {
    tabId: sender.tab.id,
    ...(sender.documentId
      ? { documentIds: [sender.documentId] }
      : { frameIds: [sender.frameId] }),
  };
  if (preview.length) {
    await scripting.insertCSS({ target, files: ["fontawesome.css"] });
    await scripting.executeScript({
      target,
      files: ["mermaid.min.js", "scripts/site.js"],
    });
  } else {
    await scripting.executeScript({ target, files: ["scripts/site.js"] });
  }
}

let fontAwesomeCSS: Promise<string> | undefined;

async function downloadSVG(svg: string, fontAwesome: boolean) {
  if (fontAwesome) {
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
    svg = svg.replace(
      /^(<svg\b[^>]*>)/,
      (openingTag) => `${openingTag}<style><![CDATA[${css}]]></style>`,
    );
  }
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
    request?.type === "download-svg" &&
    typeof request.svg === "string" &&
    request.svg.startsWith("<svg")
  ) {
    operation = downloadSVG(request.svg, request.fontAwesome);
  } else {
    return;
  }
  void operation
    .then(() => respond({ ok: true }))
    .catch((error) => {
      console.error(error);
      respond({ ok: false });
    });
  return true;
});
