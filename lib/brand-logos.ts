import { aaLogoAssets } from "./aa-logo-assets";
import { providerLogoAssets } from "./provider-logo-assets";
import { getCanonicalCreatorSlug, getProviderKey } from "./provider-map";

const aliases: Record<string, string> = {
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
  return {
    src: fallback ? `/logos/models-dev/${fallback}.svg` : null,
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
