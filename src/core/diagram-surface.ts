import type { DiagramAppearance } from "~types";

export function themedSurface(dark: boolean) {
  return { color: dark ? "#232832" : "#fff", dark };
}

export function diagramSurface(
  target: Element,
  appearance: DiagramAppearance = "background",
) {
  if (appearance !== "background") return themedSurface(appearance === "dark");

  const channels = [0, 0, 0];
  let remaining = 1;
  for (
    let element: Element | null = target;
    element && remaining > 0;
    element = element.parentElement
  ) {
    const background = getComputedStyle(element).backgroundColor;
    if (!background.startsWith("rgb")) continue;
    const values = background.match(/[\d.]+/g)?.map(Number);
    if (!values || values.length < 3) continue;
    const opacity = values[3] ?? 1;
    for (const index of [0, 1, 2]) {
      channels[index] += values[index] * opacity * remaining;
    }
    remaining *= 1 - opacity;
  }
  const [red, green, blue] = channels.map((channel) =>
    Math.round(channel + 255 * remaining),
  );
  return {
    color: `rgb(${red}, ${green}, ${blue})`,
    dark: red * 0.2126 + green * 0.7152 + blue * 0.0722 < 128,
  };
}
