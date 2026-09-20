import assert from "node:assert/strict";
import test from "node:test";
import { getBrandLogo, localSourceLogo } from "./brand-logos.ts";
import { aaLogoAssets } from "./aa-logo-assets.ts";
import { getProviderKey } from "./provider-map.ts";
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
