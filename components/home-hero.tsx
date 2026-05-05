"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompareMenu, type CompareMenuModel } from "@/components/compare-menu";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";

export interface LatestModelSummary {
  slug: string;
  name: string;
  providerName: string;
  providerSlug: string;
  releaseDate: string | null;
}

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
  latestModel,
  compareModels,
}: {
  count: number;
  latestModel: LatestModelSummary | null;
  compareModels: CompareMenuModel[];
}) {
  const { lang, t } = useI18n();
  const latestDate = formatReleaseDate(latestModel?.releaseDate ?? null, lang);
  const inlineCompareRef = useRef<HTMLDivElement>(null);
  const [bubbleState, setBubbleState] = useState({ visible: false, x: 0, y: 0 });
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const portalTarget = hydrated ? document.body : null;

  useEffect(() => {
    const HEADER_BOTTOM = 56;
    const BUBBLE_LEFT = 16;
    const BUBBLE_TOP = 64;

    function update() {
      const node = inlineCompareRef.current;
      if (!node) return;
      const trigger = node.querySelector("button");
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
      className="compare-bubble fixed left-4 top-[64px] z-[70]"
      data-state={bubbleState.visible ? "visible" : "hidden"}
      aria-hidden={!bubbleState.visible}
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
      <CompareMenu models={compareModels} variant="bubble" />
    </div>
  );

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t.hero.title}</h1>
          <Badge variant="secondary">{count}</Badge>
          <div ref={inlineCompareRef} className="compare-anchor inline-flex">
            <CompareMenu models={compareModels} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.hero.description}</p>
      </div>

      {portalTarget ? createPortal(compareBubble, portalTarget) : null}

      {latestModel && (
        <Link
          href={`/models/${latestModel.slug}`}
          className="group w-full shrink-0 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/70 sm:max-w-72"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {t.hero.latestModels}
            </span>
            {latestDate && (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {latestDate}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <ModelProviderIcon provider={getProviderKey(latestModel.providerSlug)} size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium group-hover:text-primary">
                {latestModel.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {latestModel.providerName}
              </span>
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
