import type { ExtensionMessage } from "~types";

export default function activate() {
  const request: ExtensionMessage = { type: "activate-preview" };
  void chrome.runtime.sendMessage(request).catch(console.error);
}
