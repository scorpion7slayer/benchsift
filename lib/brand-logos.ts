import { aaLogoAssets } from "./aa-logo-assets";
import { providerLogoAssets } from "./provider-logo-assets";
import { supplementalLogoAssets } from "./supplemental-logo-assets";
import { getCanonicalCreatorSlug, getProviderKey } from "./provider-map";

const aliases: Record<string, string> = {
  "liquid-ai": "liquidai",
  "institute-of-foundation-models": "ifm",
  ai9stars: "ai9star",
  "allen-institute-for-ai": "ai2",
  "multiverse-computing": "multiversecomputing",
  "nex-agi": "nex",
  "trillion-labs": "trillionlabs",
  "sapiens-ai": "agnes-ai",
  "deep-cogito": "deepcogito",
  bfl: "blackforestlabs",
  recraft: "recraftai",
  luma: "lumalabs",
  prunaai: "pruna",
  meituan: "longcat",
  breezeblue: "breeze-blue",
  "smallest-ai": "smallestai",
  "murf-ai": "murfai",
  "resemble-ai": "resembleai",
  "hume-ai": "humeai",
  "bland-ai": "bland",
  "boson-ai": "boson",
  rekaai: "reka",
  moonshot: "moonshotai",
  kimi: "moonshotai",
  qwen: "alibaba",
  deepmind: "google",
  aws: "amazon",
  "amazon-bedrock": "amazon",
  xiaomimimo: "xiaomi",
  claudecode: "anthropic",
  gemini: "google",
  llama: "meta",
  "muse-code": "meta",
  "devin-fusion-cli": "cognition",
  "muse-spark": "meta",
  opencode: "opencode",
  // Cloudflare publishes the Clef decision models; its Workers AI mark is hosted locally.
  cloudflare: "cloudflare-workers-ai",
  muse: "meta",
};
const localFiles = new Set(Object.values(aaLogoAssets).map((asset) => asset.file));
const aaByProvider = new Map<string, (typeof aaLogoAssets)[string]>();
for (const [provider, asset] of Object.entries(aaLogoAssets)) {
  for (const key of [getCanonicalCreatorSlug(provider), getProviderKey(provider)]) {
    if (!aaByProvider.has(key)) aaByProvider.set(key, asset);
  }
}

export function getBrandLogo(provider: string) {
  const key = provider.toLowerCase().trim();
  const canonical = aliases[key] ?? getCanonicalCreatorSlug(key);
  const aa = aaLogoAssets[canonical] ?? aaLogoAssets[key] ?? aaByProvider.get(canonical);
  if (aa)
    return {
      src: `/logos/artificial-analysis/${aa.file}`,
      color: aa.color,
      monochrome: false,
    };
  const fallback = [canonical, getProviderKey(canonical), key].find((name) =>
    providerLogoAssets.has(name),
  );
  const supplemental = [canonical, key].find((name) => supplementalLogoAssets.has(name));
  return {
    src: fallback ? `/logos/models-dev/${fallback}.svg` : supplemental ? `/logos/lobe/${supplemental}.svg` : null,
    color: undefined,
    monochrome: true,
  };
}

/** Only use an upstream image when it has a matching, locally hosted asset. */
export function localSourceLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://artificialanalysis.ai");
    if (parsed.origin !== "https://artificialanalysis.ai") return null;
    const file = parsed.pathname.replace(/^\/img\/logos\//, "");
    return localFiles.has(file)
      ? `/logos/artificial-analysis/${file}`
      : null;
  } catch {
    return null;
  }
}

/** Prefer the known creator artwork; retry another bundled asset before initials. */
export function getBrandLogoCandidates(provider: string, sourceUrl?: string | null) {
  const primary = getBrandLogo(provider);
  const key = provider.toLowerCase().trim();
  const canonical = aliases[key] ?? getCanonicalCreatorSlug(key);
  const fallback = [canonical, getProviderKey(canonical), key].find((name) => providerLogoAssets.has(name));
  const source = localSourceLogo(sourceUrl);
  return [
    { src: primary.src, monochrome: primary.monochrome },
    { src: source, monochrome: false },
    { src: fallback ? `/logos/models-dev/${fallback}.svg` : null, monochrome: true },
  ].filter((asset, index, assets): asset is { src: string; monochrome: boolean } => Boolean(asset.src) && assets.findIndex((other) => other.src === asset.src) === index);
}
