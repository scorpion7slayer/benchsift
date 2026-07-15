import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/components/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompareMenu } from "@/components/compare-menu";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import type { LatestModelSummary } from "@/lib/home-catalog";

function subscribeHydration(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(id);
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function formatReleaseDate(value: string | null, lang: "fr" | "en"): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function HomeHero({
  count,
  latestModels,
}: {
  count: number;
  latestModels: LatestModelSummary[];
}) {
  const { lang, t } = useI18n();
  const [activeLatestIndex, setActiveLatestIndex] = useState(0);
  const inlineCompareRef = useRef<HTMLDivElement>(null);
  const [bubbleState, setBubbleState] = useState({ visible: false, x: 0, y: 0 });
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const portalTarget = hydrated ? document.body : null;
  const latestModel = latestModels[activeLatestIndex] ?? latestModels[0] ?? null;
  const latestDate = formatReleaseDate(latestModel?.releaseDate ?? null, lang);
  const hasLatestSlider = latestModels.length > 1;

  useEffect(() => {
    setActiveLatestIndex((index) =>
      Math.min(index, Math.max(0, latestModels.length - 1)),
    );
  }, [latestModels.length]);

  function showPreviousLatestModel() {
    setActiveLatestIndex((index) =>
      (index - 1 + latestModels.length) % latestModels.length,
    );
  }

  function showNextLatestModel() {
    setActiveLatestIndex((index) => (index + 1) % latestModels.length);
  }

  useEffect(() => {
    const HEADER_BOTTOM = 56;
    const BUBBLE_LEFT = 16;
    const BUBBLE_TOP = 64;

    function update() {
      const node = inlineCompareRef.current;
      if (!node) return;
      const trigger = node.querySelector("a");
      const rect = (trigger ?? node).getBoundingClientRect();
      const next = {
        visible: rect.bottom <= HEADER_BOTTOM,
        x: Math.round(rect.left - BUBBLE_LEFT),
        y: Math.round(rect.top - BUBBLE_TOP),
      };

      setBubbleState((current) =>
        current.visible === next.visible && current.x === next.x && current.y === next.y
          ? current
          : next
      );
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const compareBubble = (
    <div
      className="compare-bubble fixed left-4 top-16 z-30"
      data-state={bubbleState.visible ? "visible" : "hidden"}
      aria-hidden={!bubbleState.visible}
      inert={!bubbleState.visible}
      style={
        {
          "--compare-bubble-x": `${bubbleState.x}px`,
          "--compare-bubble-y": `${bubbleState.y}px`,
          transform: bubbleState.visible
            ? "translate3d(0, 0, 0) scale(1)"
            : `translate3d(${bubbleState.x}px, ${bubbleState.y}px, 0) scale(0.96)`,
        } as CSSProperties
      }
    >
      <CompareMenu variant="bubble" />
    </div>
  );

  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.hero.title}</h1>
          <Badge variant="secondary">{count}</Badge>
          <div ref={inlineCompareRef} className="compare-anchor inline-flex">
            <CompareMenu />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.hero.description}</p>
      </div>

      {portalTarget ? createPortal(compareBubble, portalTarget) : null}

      {latestModel && (
        <>
          <section aria-label={t.hero.latestModels} className="sm:hidden">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {t.hero.latestModels}
            </div>
            <div className="latest-models-mobile -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
              {latestModels.map((model) => {
                const modelDate = formatReleaseDate(model.releaseDate, lang);
                return (
                  <Link
                    key={model.slug}
                    href={`/models/${model.slug}`}
                    className="flex w-[calc(100vw-3.5rem)] max-w-72 shrink-0 snap-start items-center gap-2.5 rounded-lg border border-border/70 bg-card p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <ModelProviderIcon
                        provider={getModelProviderKey(model.slug, model.providerSlug)}
                        size={20}
                        iconUrl={model.providerIconUrl}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{model.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{model.providerName}</span>
                    </span>
                    {modelDate && (
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {modelDate}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          <section
            aria-label={t.hero.latestModels}
            className="hidden w-72 shrink-0 rounded-lg border border-border/70 bg-card p-2.5 sm:block"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {t.hero.latestModels}
              </span>
              {hasLatestSlider ? (
                <span className="inline-flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={showPreviousLatestModel}
                    aria-label={t.hero.previousModel}
                    className="touch-target inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextLatestModel}
                    aria-label={t.hero.nextModel}
                    className="touch-target inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </span>
              ) : null}
            </div>

            <Link
              href={`/models/${latestModel.slug}`}
              className="group mt-1 flex min-h-9 items-center gap-2 rounded-md transition-colors hover:text-primary"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <ModelProviderIcon
                  provider={getModelProviderKey(latestModel.slug, latestModel.providerSlug)}
                  size={18}
                  iconUrl={latestModel.providerIconUrl}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{latestModel.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{latestModel.providerName}</span>
              </span>
              {latestDate && (
                <span className="ml-1 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {latestDate}
                </span>
              )}
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
