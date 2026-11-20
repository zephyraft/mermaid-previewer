import { observeDiagrams } from "~core/preview";

export default function start() {
  const lifecycle = new AbortController();
  void observeDiagrams(lifecycle.signal).catch(console.error);
  return () => lifecycle.abort();
}
