import assert from "node:assert/strict";
import test from "node:test";
import { getBrandLogo, getBrandLogoCandidates, localSourceLogo } from "./brand-logos.ts";
import { aaLogoAssets } from "./aa-logo-assets.ts";
import { getProviderKey } from "./provider-map.ts";
import { supplementalLogoAssets } from "./supplemental-logo-assets.ts";
test("source brand artwork covers Devin, Muse, OpenCode and creator aliases without external requests", () => {
  assert.equal(
    getBrandLogo("devin-fusion-cli").src,
    "/logos/artificial-analysis/devin.svg",
  );
  assert.equal(
    getBrandLogo("muse-code").src,
    "/logos/artificial-analysis/meta_small.svg",
  );
  assert.equal(getBrandLogo("meta").monochrome, false);
  assert.equal(getBrandLogo("ai21").src, "/logos/artificial-analysis/ai21_small.svg");
  for (const provider of Object.keys(aaLogoAssets))
    assert.ok(getBrandLogo(getProviderKey(provider)).src, provider);
  assert.equal(
    getBrandLogo("opencode").src,
    "/logos/artificial-analysis/opencode_small.svg",
  );
  assert.equal(
    getBrandLogo("gemini").src,
    "/logos/artificial-analysis/google_small.svg",
  );
  assert.equal(getBrandLogo("made-up-provider").src, null);
  assert.equal(localSourceLogo("https://tracking.example/logo.svg"), null);
  assert.equal(
    localSourceLogo("https://artificialanalysis.ai/img/logos/meta_small.svg"),
    "/logos/artificial-analysis/meta_small.svg",
  );
});
test("Meta creator artwork wins over an upstream placeholder and has a bundled fallback", () => {
  const candidates = getBrandLogoCandidates("meta", "https://artificialanalysis.ai/img/logos/meta_small.svg");
  assert.deepEqual(candidates.map((item) => item.src), [
    "/logos/artificial-analysis/meta_small.svg",
    "/logos/models-dev/meta.svg",
  ]);
});
test("additional creator spellings and bundled brand assets resolve locally", async () => {
  for (const alias of ["liquid-ai", "institute-of-foundation-models", "allen-institute-for-ai", "nex-agi", "recraft", "luma", "prunaai", "rekaai", "SpaceXAI"]) {
    const logo = getBrandLogo(alias);
    assert.ok(logo.src, alias);
    assert.ok(await Bun.file(new URL(`../public${logo.src}`, import.meta.url)).exists(), alias);
  }
  for (const provider of supplementalLogoAssets) {
    const asset = Bun.file(new URL(`../public/logos/lobe/${provider}.svg`, import.meta.url));
    assert.ok(await asset.exists(), provider);
    assert.doesNotMatch(await asset.text(), /<script|<foreignObject|\bon\w+=|(?:href|src)=["']https?:/i, provider);
    assert.ok(getBrandLogo(provider).src, provider);
  }
});
test("every mapped AA asset exists locally and SVGs contain no executable or remote content", async () => {
  for (const file of new Set(
    Object.values(aaLogoAssets).map((asset) => asset.file),
  )) {
    const asset = Bun.file(
      new URL(`../public/logos/artificial-analysis/${file}`, import.meta.url),
    );
    assert.ok(await asset.exists(), file);
    if (file.endsWith(".svg"))
      assert.doesNotMatch(
        await asset.text(),
        /<script|<foreignObject|\bon\w+=|(?:href|src)=["']https?:/i,
        file,
      );
  }
});
