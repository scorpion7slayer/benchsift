import type { ReactNode } from "react";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import type { LLMModel } from "@/lib/api";
import { fetchComparePair } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareWorkspace } from "@/components/compare/compare-workspace";
import { Link } from "@/components/link";
import { comparePairPath } from "@/lib/compare-pairs";
import { formatMoney, formatNumber, formatSpeed, formatTokens, type DisplayLang } from "@/lib/format";
import { translationsFor, useI18n, type Translations } from "@/lib/i18n";
import { breadcrumbJsonLd, localizedUrl, seo } from "@/lib/seo";

const NOINDEX = "noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export const Route = createFileRoute("/compare_/$pair")({
  loader: async ({ params }) => {
    const data = await fetchComparePair({ data: params.pair });
    if (!data) throw notFound();
    // A popular pair has one address; the reversed order moves to it.
    if (data.redirectTo) {
      throw redirect({ to: "/compare/$pair", params: { pair: `${data.redirectTo[0]}-vs-${data.redirectTo[1]}` }, statusCode: 301 });
    }
    return data;
  },
  head: ({ match, loaderData }) => {
    if (!loaderData) return {};
    const lang = match.context.lang;
    const t = translationsFor(lang);
    const [a, b] = orderedModels(loaderData.selected, loaderData.pair);
    if (!a || !b) return {};
    const path = comparePairPath(loaderData.pair[0], loaderData.pair[1]);
    const facts = pairFacts(a, b, lang, t).join(", ");
    const description = t.comparePair.description(a.name, b.name, facts);
    return seo({
      title: t.comparePair.title(a.name, b.name),
      description,
      lang,
      path,
      // Only the popular pairs are indexed; any other pair still works as a link.
      robots: loaderData.popular ? undefined : NOINDEX,
      jsonLd: [
        breadcrumbJsonLd(lang, [
          { name: t.seo.breadcrumb.home, path: "/" },
          { name: t.seo.breadcrumb.compare, path: "/compare" },
          { name: t.comparePair.heading(a.name, b.name), path },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t.comparePair.heading(a.name, b.name),
          url: localizedUrl(path, lang),
          inLanguage: lang,
          description,
          about: [a, b].map((model) => ({
            "@type": "SoftwareApplication",
            name: model.name,
            applicationCategory: "AI model",
            url: localizedUrl(`/models/${model.slug}`, lang),
            creator: { "@type": "Organization", name: model.model_creator.name },
          })),
        },
      ],
    });
  },
  component: ComparePairPage,
});

/** The two compared models in the order of the address. */
function orderedModels(selected: LLMModel[], pair: [string, string]): [LLMModel | undefined, LLMModel | undefined] {
  const bySlug = new Map(selected.map((model) => [model.slug, model]));
  return [bySlug.get(pair[0]) ?? selected[0], bySlug.get(pair[1]) ?? selected[1]];
}

const finite = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value);

/** Short, sourced facts for the page description; missing values are left out. */
function pairFacts(a: LLMModel, b: LLMModel, lang: DisplayLang, t: Translations): string[] {
  const copy = t.comparePair;
  const facts: string[] = [];
  const ia = a.evaluations.artificial_analysis_intelligence_index;
  const ib = b.evaluations.artificial_analysis_intelligence_index;
  if (finite(ia) && finite(ib)) facts.push(copy.factIntelligence(formatNumber(ia, lang), formatNumber(ib, lang)));
  const pa = a.pricing.price_1m_blended_3_to_1;
  const pb = b.pricing.price_1m_blended_3_to_1;
  if (finite(pa) && finite(pb)) facts.push(copy.factPrice(formatMoney(pa, lang), formatMoney(pb, lang)));
  const sa = a.median_output_tokens_per_second;
  const sb = b.median_output_tokens_per_second;
  if (finite(sa) && finite(sb) && sa > 0 && sb > 0) facts.push(copy.factSpeed(formatSpeed(sa, lang), formatSpeed(sb, lang)));
  return facts;
}

/** The generated introduction: one sentence per measure both models have. */
function PairIntro({ a, b }: { a: LLMModel; b: LLMModel }) {
  const { t, lang } = useI18n();
  const copy = t.comparePair;
  const name = (model: LLMModel) => (
    <Link href={`/models/${encodeURIComponent(model.slug)}`} className="font-medium text-foreground underline-offset-4 hover:underline">{model.name}</Link>
  );
  const sentences: ReactNode[] = [];

  const ia = a.evaluations.artificial_analysis_intelligence_index;
  const ib = b.evaluations.artificial_analysis_intelligence_index;
  if (finite(ia) && finite(ib)) {
    const [hi, lo, shi, slo] = ia >= ib ? [a, b, ia, ib] : [b, a, ib, ia];
    sentences.push(ia === ib
      ? copy.intelligenceTie(name(a), name(b), formatNumber(ia, lang))
      : copy.intelligence(name(hi), name(lo), formatNumber(shi, lang), formatNumber(slo, lang)));
  }
  const pa = a.pricing.price_1m_blended_3_to_1;
  const pb = b.pricing.price_1m_blended_3_to_1;
  if (finite(pa) && finite(pb)) {
    const [cheap, other, pc, po] = pa <= pb ? [a, b, pa, pb] : [b, a, pb, pa];
    sentences.push(pa === pb
      ? copy.priceTie(name(a), name(b), formatMoney(pa, lang))
      : copy.price(name(cheap), formatMoney(pc, lang), name(other), formatMoney(po, lang)));
  }
  const sa = a.median_output_tokens_per_second;
  const sb = b.median_output_tokens_per_second;
  if (finite(sa) && finite(sb) && sa > 0 && sb > 0) {
    const [fast, other, sf, so] = sa >= sb ? [a, b, sa, sb] : [b, a, sb, sa];
    sentences.push(copy.speed(name(fast), formatSpeed(sf, lang), name(other), formatSpeed(so, lang)));
  }
  const ca = a.context_window_tokens;
  const cb = b.context_window_tokens;
  if (finite(ca) && finite(cb)) {
    const [large, other, cl, co] = ca >= cb ? [a, b, ca, cb] : [b, a, cb, ca];
    sentences.push(ca === cb
      ? copy.contextTie(name(a), name(b), formatTokens(ca, lang))
      : copy.context(name(large), formatTokens(cl, lang), name(other), formatTokens(co, lang)));
  }

  return (
    <div className="mt-2 max-w-3xl space-y-1.5 text-sm leading-6 text-muted-foreground">
      {sentences.length > 0 && <p>{sentences.map((sentence, index) => <span key={index}>{index > 0 && " "}{sentence}</span>)}</p>}
      <p className="text-xs">{copy.lead}</p>
    </div>
  );
}

function ComparePairPage() {
  const { t } = useI18n();
  const { selected, allModels, families, pair, related } = Route.useLoaderData();
  const [a, b] = orderedModels(selected, pair);

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8"
      >
        <CompareWorkspace
          models={selected}
          allModels={allModels}
          families={families}
          heading={a && b ? { title: t.comparePair.heading(a.name, b.name), intro: <PairIntro a={a} b={b} /> } : undefined}
        />
        <nav aria-labelledby="related-comparisons" className="mt-10 border-t pt-6">
          <h2 id="related-comparisons" className="text-base font-semibold">{related.length ? t.comparePair.related : t.comparePair.allCompare}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={`${item.a.slug}-${item.b.slug}`}>
                <Link
                  href={comparePairPath(item.a.slug, item.b.slug)}
                  className="inline-flex min-h-10 items-center rounded-lg border bg-card px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t.comparePair.heading(item.a.name, item.b.name)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/compare"
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t.comparePair.allCompare}
              </Link>
            </li>
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
