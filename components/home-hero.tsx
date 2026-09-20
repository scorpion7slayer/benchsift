import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/components/link";
import { ArrowRight, Sparkles } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { CompareMenu } from "@/components/compare-menu";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import type { LatestModelSummary } from "@/lib/home-catalog";

function formatReleaseDate(value: string | null, lang: "fr" | "en") {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function HomeHero({
  count,
  latestModels,
}: {
  count: number;
  latestModels: LatestModelSummary[];
}) {
  const { lang, t } = useI18n();
  const inlineCompare = useRef<HTMLDivElement>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const node = inlineCompare.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setBubbleVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 56,
        );
      },
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mb-6 space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.hero.title}
          </h1>
          <Badge variant="secondary">{count}</Badge>
          <div ref={inlineCompare} className="ml-auto inline-flex">
            <CompareMenu />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.hero.description}</p>
      </div>
      {latestModels.length > 0 && (
        <section aria-label={t.hero.latestModels} className="space-y-2">
          <h2 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-chart-2" aria-hidden="true" />
            {t.hero.latestModels}
          </h2>
          <ol className="grid gap-2 md:grid-cols-3">
            {latestModels.map((model) => {
              const date = formatReleaseDate(model.releaseDate, lang);
              return (
                <li key={model.slug} className="min-w-0">
                  <Link
                    href={`/models/${model.slug}`}
                    className="latest-model-link group flex h-full min-h-20 items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-[border-color,background-color] hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ModelProviderIcon
                      provider={getModelProviderKey(
                        model.slug,
                        model.providerSlug,
                      )}
                      iconUrl={model.providerIconUrl}
                      size={32}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-5 [overflow-wrap:anywhere]">
                        {model.name}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        <span>{model.providerName}</span>
                        {date && (
                          <time dateTime={model.releaseDate!}>{date}</time>
                        )}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {mounted &&
        createPortal(
          <div
            className="compare-bubble fixed left-4 top-16 z-30"
            data-state={bubbleVisible ? "visible" : "hidden"}
            aria-hidden={!bubbleVisible}
            inert={!bubbleVisible}
          >
            <CompareMenu variant="bubble" />
          </div>,
          document.body,
        )}
    </div>
  );
}
