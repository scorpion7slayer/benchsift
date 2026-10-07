import { Link } from "@/components/link";
import { ArrowRight } from "@/components/icons";
import { CompareMenu } from "@/components/compare-menu";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import type { LatestModelSummary } from "@/lib/home-catalog";
import { PageCat } from "@/components/pixel-art/page-cats";

export function HomeHero({ count, latestModels }: { count: number; latestModels: LatestModelSummary[] }) {
  const { lang, t } = useI18n();
  return <header className="mb-6 space-y-5 sm:mb-8 sm:space-y-6">
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.hero.title}</h1>
          <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
        </div>
        <CompareMenu />
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.hero.description}</p>
    </div>
    {latestModels.length > 0 && <section aria-label={t.hero.latestModels}>
      <div className="relative mb-3">
        <h2 className="text-xs font-medium text-muted-foreground">{t.hero.latestModels}</h2>
        {/* Sits on the cards' top edge, in the empty end of the label row. */}
        <PageCat kind="home" className="absolute -bottom-3 right-3" />
      </div>
      <ol className="latest-models-strip -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
        {latestModels.map((model) => {
          const date = model.releaseDate ? new Date(model.releaseDate) : null;
          return <li key={model.slug} className="w-[80%] shrink-0 snap-start sm:w-auto sm:min-w-0">
            <Link href={`/models/${model.slug}`} className="latest-model-link group flex h-full items-center gap-3 rounded-xl border bg-card p-3 transition-[border-color,background-color] hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ModelProviderIcon provider={getModelProviderKey(model.slug, model.providerSlug)} iconUrl={model.providerIconUrl} size={40} />
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5 [overflow-wrap:anywhere]">{model.name}</span><span className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">{model.providerName}{date && Number.isFinite(date.getTime()) && <time dateTime={model.releaseDate!}>{new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }).format(date)}</time>}</span></span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform" />
            </Link>
          </li>;
        })}
      </ol>
    </section>}
  </header>;
}
