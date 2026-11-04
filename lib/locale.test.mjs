import assert from "node:assert/strict";
import test from "node:test";

import { createLocaleRewrite, localizedPath, preferredLocale, splitLocale, switchLocaleHref } from "./locale.ts";

test("the /fr prefix selects French and is removed before matching", () => {
  assert.deepEqual(splitLocale("/"), { locale: "en", path: "/" });
  assert.deepEqual(splitLocale("/fr"), { locale: "fr", path: "/" });
  assert.deepEqual(splitLocale("/fr/benchmarks/deepswe"), { locale: "fr", path: "/benchmarks/deepswe" });
  assert.deepEqual(splitLocale("/france"), { locale: "en", path: "/france" });
  // Files and APIs have no French copy.
  assert.deepEqual(splitLocale("/fr/api/cron/refresh"), { locale: "en", path: "/fr/api/cron/refresh" });
  assert.deepEqual(splitLocale("/fr/sitemap.xml"), { locale: "en", path: "/fr/sitemap.xml" });
});

test("localized paths prefix pages only", () => {
  assert.equal(localizedPath("/", "fr"), "/fr");
  assert.equal(localizedPath("/models/gpt-5", "fr"), "/fr/models/gpt-5");
  assert.equal(localizedPath("/models", "en"), "/models");
  assert.equal(localizedPath("/sitemap.xml", "fr"), "/sitemap.xml");
  assert.equal(localizedPath("/fr/about", "fr"), "/fr/about");
  assert.equal(localizedPath("/?provider=openai", "fr"), "/fr?provider=openai");
  assert.equal(localizedPath("/models?q=x", "fr"), "/fr/models?q=x");
});

test("switching language keeps the query and the hash", () => {
  assert.equal(switchLocaleHref("/compare?models=a,b#prices", "fr"), "/fr/compare?models=a,b#prices");
  assert.equal(switchLocaleHref("/fr/compare?models=a,b", "en"), "/compare?models=a,b");
  assert.equal(switchLocaleHref("/fr", "en"), "/");
});

test("the rewrite strips on input and prefixes on output for French pages", () => {
  const { rewrite, locale } = createLocaleRewrite();
  const input = new URL("https://x.test/fr/models?page=2");
  const parsed = rewrite.input({ url: input });
  assert.equal(parsed.pathname, "/models");
  assert.equal(locale(), "fr");
  assert.equal(rewrite.output({ url: new URL("https://x.test/about") }).pathname, "/fr/about");
  assert.equal(rewrite.output({ url: new URL("https://x.test/") }).pathname, "/fr");
  assert.equal(rewrite.input({ url: new URL("https://x.test/about") }), undefined);
  assert.equal(locale(), "en");
  assert.equal(rewrite.output({ url: new URL("https://x.test/about") }), undefined);
});

test("the suggested language follows the saved choice, then the browser", () => {
  assert.equal(preferredLocale("fr", ["en-US"]), "fr");
  assert.equal(preferredLocale(undefined, ["fr-CA", "en"]), "fr");
  assert.equal(preferredLocale(undefined, ["de-DE", "en-GB"]), "en");
  assert.equal(preferredLocale(undefined, ["de"]), "en");
});
