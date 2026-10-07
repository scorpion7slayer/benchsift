import { load } from "cheerio";
import type { StealthIdentity } from "./model-identity";
import { ANNOUNCED_STEALTH_MODELS, isOpenRouterStealthEntry } from "./openrouter-model-filter";

export function safeOpenRouterModelId(value: string): string | null {
  return /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i.test(value) && value.length <= 105
    ? value.toLowerCase() : null;
}

export function discoverStealthPageIds(html: string): string[] {
  const $ = load(html);
  return [...new Set($("a[href]").map((_, el) => $(el).attr("href")?.replace(/^\//, ""))
    .get().filter((id) => /^(stealth|openrouter)\//.test(id) && safeOpenRouterModelId(id)))];
}

/** Read the page's own structured model/FAQ, never related-model cards. */
export function parseStealthPage(html: string, id: string): StealthIdentity | null {
  if (!safeOpenRouterModelId(id)) return null;
  const $ = load(html);
  const documents: Record<string, any>[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const raw = JSON.parse($(el).text());
      documents.push(...(Array.isArray(raw) ? raw : [raw]));
    } catch { /* An invalid block is not evidence. */ }
  });
  const url = `https://openrouter.ai/${id}`;
  const model = documents.find((row) => row?.["@type"] === "SoftwareApplication" && row.url === url);
  if (!model || typeof model.name !== "string" || typeof model.description !== "string" ||
    !isOpenRouterStealthEntry({ id, description: model.description })) return null;
  const answers = documents.filter((row) => row?.["@type"] === "FAQPage")
    .flatMap((row) => Array.isArray(row.mainEntity) ? row.mainEntity : [])
    .filter((row) => row?.name === `What model was ${model.name}?`)
    .map((row) => row.acceptedAnswer?.text)
    .filter((text): text is string => typeof text === "string");
  const targets = new Set<string>();
  const isReveal = (text: string) => /\b(?:revealed (?:to be|as|on .+? as)|has been revealed|was an early (?:testing version|snapshot) of)\b/i.test(text);
  const addTarget = (href: string) => {
    try {
      const link = new URL(href, "https://openrouter.ai");
      if (link.origin !== "https://openrouter.ai" || link.search || link.hash) return;
      const target = safeOpenRouterModelId(link.pathname.slice(1).replace(/\.+$/, "").replace(/:free$/, ""));
      if (target && target !== id && !/^(stealth|openrouter|terms|docs)\//.test(target)) targets.add(target);
    } catch { /* Not a source model URL. */ }
  };
  for (const text of [model.description, ...answers]) {
    if (!isReveal(text)) continue;
    for (const match of text.matchAll(/https:\/\/openrouter\.ai\/[a-z0-9._:/-]+/gi)) addTarget(match[0]);
    for (const match of text.matchAll(/\]\((\/[a-z0-9._/-]+(?::free)?)\)/gi)) addTarget(match[1]);
  }
  // Reveal notices precede this model's hero and can be newer than JSON-LD.
  // Restrict the scope to the header with the exact API ID, never related cards.
  const heading = $("h1").filter((_, el) => $(el).text().trim() === model.name).first();
  const hero = heading.parents().toArray().find((el) => $(el).find("p").length > 0);
  if (hero && $(hero).find('h3[title="Model identifier for use in the API"]').text().trim() === id) {
    $(hero).prev().find("p").each((_, el) => {
      if (isReveal($(el).text())) $(el).find("a[href]").each((_, link) => { addTarget($(link).attr("href")!); });
    });
  }
  return {
    id, name: model.name, sourceUrl: url,
    ...(ANNOUNCED_STEALTH_MODELS[id] ? { announcementUrl: ANNOUNCED_STEALTH_MODELS[id] } : {}),
    listedAt: /^\d{4}-\d{2}-\d{2}$/.test(model.datePublished) && Number.isFinite(Date.parse(model.datePublished)) ? model.datePublished : null,
    firstSeenAt: null,
    ...(targets.size === 1 ? { revealedAs: [...targets][0] } : {}),
  };
}
