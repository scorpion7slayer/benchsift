import { getCanonicalCreatorSlug } from "./provider-map";

/** Providers with their own hue in multi-model charts; others share a neutral one. */
const PROVIDER_HUES: Record<string, string> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  xai: "xai",
  spacexai: "xai",
  zai: "zai",
  "z-ai": "zai",
  zhipu: "zai",
  zhipuai: "zai",
  moonshotai: "moonshotai",
  moonshot: "moonshotai",
  kimi: "moonshotai",
  deepseek: "deepseek",
  alibaba: "alibaba",
  qwen: "alibaba",
  meta: "meta",
  mistral: "mistral",
};

/** Shades that keep several models of one provider apart, in both themes. */
const SHADES = [100, 68, 84, 52];

/**
 * Colour of a model line: the provider's hue, shaded by the model's position
 * among that provider's models so sibling lines stay distinguishable.
 */
export function providerColor(creatorSlug: string | null | undefined, shade = 0): string {
  const key = creatorSlug ? getCanonicalCreatorSlug(creatorSlug.toLowerCase()) : "";
  const hue = `var(--provider-${PROVIDER_HUES[key] ?? PROVIDER_HUES[creatorSlug?.toLowerCase() ?? ""] ?? "other"})`;
  const amount = SHADES[shade % SHADES.length];
  return amount === 100 ? hue : `color-mix(in oklch, ${hue} ${amount}%, var(--foreground))`;
}

/** Assigns each series a shade by order of appearance within its provider. */
export function shadeIndex(): (creatorSlug: string | null | undefined) => number {
  const counts = new Map<string, number>();
  return (creatorSlug) => {
    const key = creatorSlug ?? "";
    const index = counts.get(key) ?? 0;
    counts.set(key, index + 1);
    return index;
  };
}
