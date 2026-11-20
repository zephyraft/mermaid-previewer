import { observeDiagrams } from "~core/preview";
import type { PreviewWindow } from "~types";

export default function start() {
  const page = window as PreviewWindow;
  if (page.mermaidPreviewerLifecycle) return;
  const lifecycle = new AbortController();
  page.mermaidPreviewerLifecycle = lifecycle;
  lifecycle.signal.addEventListener(
    "abort",
    () => {
      delete page.mermaidPreviewerLifecycle;
    },
    { once: true },
  );
  void observeDiagrams(lifecycle.signal).catch((error) => {
    lifecycle.abort();
    console.error(error);
  });
  return () => lifecycle.abort();
}
