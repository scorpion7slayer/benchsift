/*
 * Head tags of the translated pages: title and description in the page's
 * language, canonical and hreflang alternates, and the structured data each
 * kind of page carries (breadcrumbs, a Dataset for benchmark results).
 */
import type { BenchmarkSummary } from "@/lib/benchmark-summaries";
import { translationsFor, type SeoPageKey } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { breadcrumbJsonLd, datasetJsonLd, localizedUrl, seo } from "@/lib/seo";

type JsonLd = Record<string, unknown>;

/** A static page: its translated title and description, and its breadcrumb. */
export function pageHead(lang: Locale, key: SeoPageKey, path: string, options: { jsonLd?: JsonLd[]; robots?: string; crumb?: string } = {}) {
  const t = translationsFor(lang);
  const page = t.seo.pages[key];
  const jsonLd = [...(options.jsonLd ?? [])];
  if (path !== "/") {
    jsonLd.push(breadcrumbJsonLd(lang, [
      { name: t.seo.breadcrumb.home, path: "/" },
      { name: options.crumb ?? page.title.replace(/\s*[-|]\s*BenchSift$/, ""), path },
    ]));
  }
  return seo({ title: page.title, description: page.description, path, lang, robots: options.robots, jsonLd });
}

/** The leader sentence of a summary, as plain text for a description. */
export function summaryLead(lang: Locale, data: BenchmarkSummary | null): string {
  const leader = data?.summary.leader;
  if (!data || !leader) return "";
  return translationsFor(lang).seo.leaderLead(data.benchmark, leader.name, data.formatScore(leader.score, lang));
}

interface BenchmarkHeadOptions {
  lang: Locale;
  key: SeoPageKey;
  path: string;
  /** Short name for the breadcrumb and the dataset. */
  name: string;
  summary: BenchmarkSummary | null;
  creator: { name: string; url: string };
  sourceUrl: string;
  measured: string[];
}

/** A benchmark page: the current leader leads its description, and it carries a Dataset. */
export function benchmarkHead({ lang, key, path, name, summary, creator, sourceUrl, measured }: BenchmarkHeadOptions) {
  const t = translationsFor(lang);
  const page = t.seo.pages[key];
  const lead = summaryLead(lang, summary);
  const description = lead ? `${lead} ${page.description}` : page.description;
  return seo({
    title: page.title,
    description,
    path,
    lang,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "CollectionPage", name, url: localizedUrl(path, lang), inLanguage: lang, description },
      breadcrumbJsonLd(lang, [{ name: t.seo.breadcrumb.home, path: "/" }, { name, path }]),
      datasetJsonLd({
        lang,
        path,
        name: `${name} - BenchSift`,
        description: page.description,
        creator,
        sourceUrl,
        measured,
        dateModified: summary?.updatedAt,
        size: summary?.summary.count,
      }),
    ],
  });
}

export const ARTIFICIAL_ANALYSIS = { name: "Artificial Analysis", url: "https://artificialanalysis.ai" };
