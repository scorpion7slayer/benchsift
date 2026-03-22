"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitCompareArrows, ChevronLeft, Search, X, Check, Trophy, Type, ImageIcon, Video, Mic, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { getProviderKey } from "@/lib/provider-map";
import type { LLMModel } from "@/lib/api";

// Benchmark constants / Constantes benchmarks

const AA_INDEX_KEYS = new Set([
  "artificial_analysis_intelligence_index",
  "artificial_analysis_coding_index",
  "artificial_analysis_math_index",
]);

const KNOWN_BENCHMARK_KEYS = new Set([
  "mmlu_pro", "gpqa", "hle", "livecodebench", "scicode",
  "math_500", "aime", "aime_25", "ifbench", "lcr", "terminalbench_hard", "tau2",
]);

// Helpers

function fmt(val: number | null, decimals = 1): string {
  if (val === null) return "—";
  return val.toFixed(decimals);
}

function fmtPct(val: number | null): string {
  if (val === null) return "—";
  return `${(val * 100).toFixed(1)}%`;
}

function fmtPrice(val: number | null): string {
  if (val === null) return "—";
  return `$${val.toFixed(2)}`;
}

function fmtCtx(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
  return String(val);
}

function fmtParams(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1000) return `${(val / 1000).toFixed(1)}T`;
  return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
}

function fmtDynamic(val: number | null): string {
  if (val === null) return "—";
  if (val > 1) return val.toFixed(1);
  return `${(val * 100).toFixed(1)}%`;
}

function formatBenchmarkKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function scoreBg(val: number | null): string {
  if (val === null) return "";
  if (val >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (val >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

type Direction = "higher" | "lower";

function getBest(values: (number | null)[], dir: Direction): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return dir === "higher" ? Math.max(...valid) : Math.min(...valid);
}

function isBest(val: number | null, best: number | null): boolean {
  if (val === null || best === null) return false;
  return Math.abs(val - best) < 1e-9;
}

function relBar(val: number | null, values: (number | null)[], dir: Direction): number {
  if (val === null) return 0;
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return 100;
  const maxV = Math.max(...valid);
  const minV = Math.min(...valid);
  const range = maxV - minV;
  if (range === 0) return 100;
  return dir === "higher"
    ? ((val - minV) / range) * 100
    : ((maxV - val) / range) * 100;
}

// Sticky label cell / Cellule label collante

function LabelCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-background z-10 min-w-[180px] border-r">
      {children}
    </td>
  );
}

// Row types / Types de ligne

interface MetricConfig {
  label: React.ReactNode;
  values: (number | null)[];
  dir: Direction;
  format: (v: number | null) => string;
  colorize?: boolean;
  /** If true, hides the mini-bar (e.g. dates). / Si true, supprime la mini-barre. */
  noBar?: boolean;
}

// Subcomponents / Sous-composants

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={99} className="pt-6 pb-1 px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Separator className="mt-1" />
      </td>
    </tr>
  );
}

function MetricRow({ label, values, dir, format, colorize, noBar }: MetricConfig) {
  if (values.every(v => v === null)) return null;

  const best = getBest(values, dir);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <LabelCell>{label}</LabelCell>
      {values.map((val, i) => {
        const winner = isBest(val, best);
        const pct = noBar ? 0 : relBar(val, values, dir);
        return (
          <td key={i} className="py-2.5 px-4 text-sm text-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`font-mono text-xs ${winner ? "font-semibold" : ""} ${colorize ? scoreBg(val) : ""} ${winner && !colorize ? "text-emerald-600 dark:text-emerald-400" : ""}`}
              >
                {format(val)}
                {winner && val !== null && (
                  <span className="ml-1 inline-block size-1.5 rounded-full bg-emerald-500 align-middle" />
                )}
              </span>
              {!noBar && val !== null && (
                <div className="h-0.5 w-14 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${winner ? "bg-emerald-500" : "bg-primary/40"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function BoolRow({ label, values }: { label: string; values: (boolean | undefined | null)[] }) {
  if (values.every(v => v == null)) return null;
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <LabelCell>{label}</LabelCell>
      {values.map((val, i) => (
        <td key={i} className="py-2.5 px-4 text-sm text-center">
          {val == null ? (
            <span className="text-muted-foreground font-mono text-xs">—</span>
          ) : val ? (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
            </span>
          ) : (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted">
              <X className="size-3 text-muted-foreground/50" />
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

function IconBox({ icon, title, active }: { icon: React.ReactNode; title: string; active?: boolean }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center size-6 rounded border transition-colors ${
        active ? "bg-muted text-foreground border-border" : "text-muted-foreground/20 border-border/20"
      }`}
    >
      {icon}
    </span>
  );
}

interface ModalityData {
  text?: boolean;
  image?: boolean;
  video?: boolean;
  audio?: boolean;
}

function ModalityRow({ label, rows }: { label: string; rows: ModalityData[] }) {
  const hasData = rows.some(r => r.text != null || r.image != null || r.video != null || r.audio != null);
  if (!hasData) return null;
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <LabelCell>{label}</LabelCell>
      {rows.map((r, i) => (
        <td key={i} className="py-2.5 px-4 text-center">
          {r.text == null && r.image == null && r.video == null && r.audio == null ? (
            <span className="text-muted-foreground font-mono text-xs">—</span>
          ) : (
            <div className="flex items-center gap-1 justify-center">
              <IconBox icon={<Type className="size-3" />}      title="Text"  active={r.text ?? true} />
              <IconBox icon={<ImageIcon className="size-3" />} title="Image" active={r.image} />
              <IconBox icon={<Video className="size-3" />}     title="Vidéo" active={r.video} />
              <IconBox icon={<Mic className="size-3" />}       title="Audio" active={r.audio} />
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

// Main component / Composant principal

export function CompareTable({
  models,
  allModels,
}: {
  models: LLMModel[];
  allModels: LLMModel[];
}) {
  const { t } = useI18n();
  const { selected, toggle, clear, isFull } = useCompare();
  const router = useRouter();
  const [addSearch, setAddSearch] = useState("");

  useEffect(() => () => { clear(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search / Recherche
  const searchResults = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return [];
    return allModels
      .filter(
        (m) =>
          !models.some((existing) => existing.id === m.id) &&
          (m.name.toLowerCase().includes(q) ||
            m.model_creator.name.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [addSearch, allModels, models]);

  function addModel(model: LLMModel) {
    if (!selected.includes(model.slug)) toggle(model.slug);
    const slugs = [...models.map((m) => m.slug), model.slug];
    router.replace(`/compare?models=${slugs.join(",")}`);
    setAddSearch("");
  }

  function removeModel(slug: string) {
    toggle(slug);
    const next = models.filter((m) => m.slug !== slug).map((m) => m.slug);
    if (next.length >= 1) router.replace(`/compare?models=${next.join(",")}`);
    else router.replace("/compare");
  }

  // Additional benchmarks / Benchmarks supplémentaires
  const extraBenchmarkKeys = useMemo(() => {
    const keys = new Set<string>();
    models.forEach((m) => {
      Object.keys(m.evaluations).forEach((key) => {
        if (!AA_INDEX_KEYS.has(key) && !KNOWN_BENCHMARK_KEYS.has(key)) {
          keys.add(key);
        }
      });
    });
    return [...keys].sort();
  }, [models]);

  // Win count / Comptage des victoires
  const winnerDetails = useMemo(() => {
    const details: string[][] = models.map(() => []);
    const metrics: { vals: (number | null)[]; dir: Direction; label: string }[] = [
      { vals: models.map(m => m.evaluations.artificial_analysis_intelligence_index), dir: "higher", label: t.benchmarks.intelligence },
      { vals: models.map(m => m.evaluations.artificial_analysis_coding_index), dir: "higher", label: t.benchmarks.coding },
      { vals: models.map(m => m.evaluations.artificial_analysis_math_index), dir: "higher", label: t.benchmarks.math },
      { vals: models.map(m => m.evaluations.mmlu_pro), dir: "higher", label: t.benchmarks.mmlu_pro },
      { vals: models.map(m => m.evaluations.gpqa), dir: "higher", label: t.benchmarks.gpqa },
      { vals: models.map(m => m.evaluations.hle), dir: "higher", label: t.benchmarks.hle },
      { vals: models.map(m => m.evaluations.livecodebench), dir: "higher", label: t.benchmarks.livecodebench },
      { vals: models.map(m => m.evaluations.math_500), dir: "higher", label: t.benchmarks.math_500 },
      { vals: models.map(m => m.evaluations.aime_25), dir: "higher", label: t.benchmarks.aime_25 },
      { vals: models.map(m => m.median_output_tokens_per_second), dir: "higher", label: t.compare.fields.outputSpeed },
      { vals: models.map(m => m.median_time_to_first_token_seconds), dir: "lower", label: t.compare.fields.ttft },
      { vals: models.map(m => m.pricing.price_1m_blended_3_to_1), dir: "lower", label: t.compare.fields.blendedPrice },
    ];
    metrics.forEach(({ vals, dir, label }) => {
      if (vals.every(v => v === null)) return;
      const best = getBest(vals, dir);
      vals.forEach((v, i) => { if (isBest(v, best)) details[i].push(label); });
    });
    return details;
  }, [models, t]);

  const winnerCounts = winnerDetails.map(d => d.length);

  const maxWins = Math.max(...winnerCounts);

  const ev = models.map((m) => m.evaluations);
  const pr = models.map((m) => m.pricing);

  // Empty state / État vide
  if (models.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
        <GitCompareArrows className="size-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">{t.compare.noModels}</p>
          <p className="text-sm text-muted-foreground">{t.compare.addMore}</p>
        </div>
        {/* Inline search bar in empty state / Barre de recherche inline dans l'état vide */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`${t.compare.addMore}…`}
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {addSearch && (
              <button
                onClick={() => setAddSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-md overflow-hidden max-h-72 overflow-y-auto text-left">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addModel(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <ModelProviderIcon provider={getProviderKey(m.model_creator.slug)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.model_creator.name}</p>
                  </div>
                  {m.evaluations.artificial_analysis_intelligence_index !== null && (
                    <Badge variant="secondary" className="font-mono text-xs shrink-0">
                      {m.evaluations.artificial_analysis_intelligence_index.toFixed(1)}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">{t.compare.backToList}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.compare.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { clear(); router.push("/"); }}>
            <ChevronLeft className="size-4 mr-1.5" />
            {t.compare.backToList}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { clear(); router.replace("/compare"); }}>
            {t.compare.clear}
          </Button>
        </div>
      </div>

      {/* Ajout de modèle */}
      {!isFull && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`${t.compare.addMore}…`}
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {addSearch && (
              <button
                onClick={() => setAddSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-md overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addModel(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <ModelProviderIcon provider={getProviderKey(m.model_creator.slug)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.model_creator.name}</p>
                  </div>
                  {m.evaluations.artificial_analysis_intelligence_index !== null && (
                    <Badge variant="secondary" className="font-mono text-xs shrink-0">
                      {m.evaluations.artificial_analysis_intelligence_index.toFixed(1)}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[500px] text-sm">
          {/* Model headers */}
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/40 min-w-[180px] border-r">
                {t.compare.model}
              </th>
              {models.map((model, idx) => (
                <th key={model.id} className="py-3 px-4 text-center min-w-[180px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="size-9 rounded-lg bg-background flex items-center justify-center border">
                      <ModelProviderIcon provider={getProviderKey(model.model_creator.slug)} size={22} />
                    </div>
                    <Link
                      href={`/models/${model.slug}`}
                      className="font-medium text-sm leading-tight hover:underline text-foreground line-clamp-2"
                    >
                      {model.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{model.model_creator.name}</span>
                    {winnerCounts[idx] > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={winnerCounts[idx] === maxWins && maxWins > 0 ? "default" : "secondary"}
                            className="text-xs gap-1 py-0 h-5 cursor-help"
                          >
                            <Trophy className="size-2.5" />
                            {winnerCounts[idx]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          <p className="font-medium">{t.compare.wins(winnerCounts[idx])}</p>
                          <ul className="mt-1 space-y-0.5">
                            {winnerDetails[idx].map(cat => (
                              <li key={cat} className="text-xs opacity-80">· {cat}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <button
                      onClick={() => removeModel(model.slug)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <X className="size-3" />
                      {t.compare.remove}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* — Informations — */}
            <SectionHeader label={t.compare.sections.info} />
            <tr className="border-b hover:bg-muted/30 transition-colors">
              <LabelCell>{t.compare.fields.provider}</LabelCell>
              {models.map((m) => (
                <td key={m.id} className="py-2.5 px-4 text-sm text-center">{m.model_creator.name}</td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30 transition-colors">
              <LabelCell>{t.compare.fields.releaseDate}</LabelCell>
              {models.map((m) => (
                <td key={m.id} className="py-2.5 px-4 text-sm text-center font-mono">{m.release_date ?? "—"}</td>
              ))}
            </tr>

            {/* — Capacités — */}
            <SectionHeader label={t.compare.sections.capabilities} />
            <MetricRow
              label={t.detail.contextWindow}
              values={models.map(m => m.context_window_tokens ?? null)}
              dir="higher"
              format={fmtCtx}
            />
            <MetricRow
              label={t.detail.totalParams}
              values={models.map(m => m.total_parameters_b ?? null)}
              dir="higher"
              format={fmtParams}
              noBar
            />
            <MetricRow
              label={t.detail.activeParams}
              values={models.map(m => m.active_parameters_b ?? null)}
              dir="higher"
              format={fmtParams}
              noBar
            />
            <BoolRow label={t.detail.reasoning}    values={models.map(m => m.reasoning_model)} />
            <BoolRow label={t.detail.openWeights}  values={models.map(m => m.is_open_weights)} />
            <ModalityRow
              label={t.detail.inputModality}
              rows={models.map(m => ({
                text:  m.input_modality_text,
                image: m.input_modality_image,
                video: m.input_modality_video,
                audio: m.input_modality_speech,
              }))}
            />
            <ModalityRow
              label={t.detail.outputModality}
              rows={models.map(m => ({
                text:  m.output_modality_text,
                image: m.output_modality_image,
                video: m.output_modality_video,
                audio: m.output_modality_speech,
              }))}
            />

            {/* — AA Indices — */}
            <SectionHeader label={t.compare.sections.aaIndices} />
            <MetricRow label={t.benchmarks.intelligence} values={ev.map((e) => e.artificial_analysis_intelligence_index)} dir="higher" format={fmt} colorize />
            <MetricRow label={t.benchmarks.coding}       values={ev.map((e) => e.artificial_analysis_coding_index)} dir="higher" format={fmt} colorize />
            <MetricRow label={t.benchmarks.math}         values={ev.map((e) => e.artificial_analysis_math_index)} dir="higher" format={fmt} colorize />

            {/* — Standard Benchmarks — */}
            <SectionHeader label={t.compare.sections.benchmarks} />
            <MetricRow label={t.benchmarks.mmlu_pro}          values={ev.map((e) => e.mmlu_pro)}            dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.gpqa}              values={ev.map((e) => e.gpqa)}               dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.hle}               values={ev.map((e) => e.hle)}                dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.livecodebench}     values={ev.map((e) => e.livecodebench)}      dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.scicode}           values={ev.map((e) => e.scicode)}            dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.math_500}          values={ev.map((e) => e.math_500)}           dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.aime}              values={ev.map((e) => e.aime)}               dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.aime_25}           values={ev.map((e) => e.aime_25)}            dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.ifbench}           values={ev.map((e) => e.ifbench)}            dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.lcr}               values={ev.map((e) => e.lcr)}                dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.terminalbench_hard} values={ev.map((e) => e.terminalbench_hard)} dir="higher" format={fmtPct} />
            <MetricRow label={t.benchmarks.tau2}              values={ev.map((e) => e.tau2)}               dir="higher" format={fmtPct} />

            {/* — Benchmarks supplémentaires (dynamiques) — */}
            {extraBenchmarkKeys.length > 0 && (
              <>
                <SectionHeader label={t.detail.extraBenchmarks} />
                {extraBenchmarkKeys.map((key) => (
                  <MetricRow
                    key={key}
                    label={formatBenchmarkKey(key)}
                    values={ev.map((e) => e[key] ?? null)}
                    dir="higher"
                    format={fmtDynamic}
                  />
                ))}
              </>
            )}

            {/* — Performance — */}
            <SectionHeader label={t.compare.sections.performance} />
            <MetricRow
              label={t.compare.fields.outputSpeed}
              values={models.map((m) => m.median_output_tokens_per_second)}
              dir="higher"
              format={(v) => v !== null ? `${fmt(v, 0)} t/s` : "—"}
            />
            <MetricRow
              label={t.compare.fields.ttft}
              values={models.map((m) => m.median_time_to_first_token_seconds)}
              dir="lower"
              format={(v) => v !== null ? `${fmt(v, 2)}s` : "—"}
            />
            <MetricRow
              label={t.compare.fields.firstAnswer}
              values={models.map((m) => m.median_time_to_first_answer_token)}
              dir="lower"
              format={(v) => v !== null ? `${fmt(v, 2)}s` : "—"}
            />

            {/* — Pricing — */}
            <SectionHeader label={t.compare.sections.pricing} />
            <MetricRow label={t.compare.fields.inputPrice}   values={pr.map((p) => p.price_1m_input_tokens)}   dir="lower" format={fmtPrice} />
            <MetricRow label={t.compare.fields.outputPrice}  values={pr.map((p) => p.price_1m_output_tokens)}  dir="lower" format={fmtPrice} />
            <MetricRow
              label={
                <span className="flex items-center gap-1">
                  {t.compare.fields.blendedPrice}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 text-xs">{t.detail.blendedTooltip}</TooltipContent>
                  </Tooltip>
                </span>
              }
              values={pr.map((p) => p.price_1m_blended_3_to_1)}
              dir="lower"
              format={fmtPrice}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
