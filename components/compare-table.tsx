import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@/components/link";
import { useNavigate } from "@tanstack/react-router";
import { GitCompareArrows, ChevronLeft, Search, X, Check, Trophy, Type, ImageIcon, Video, Mic, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { getModelProviderKey } from "@/lib/provider-map";
import {
  AA_MEDIA_BENCHMARK_DEFS,
  applicableExtraBenchmarkEntries,
  hasAAIndexBenchmarks,
  hasMediaBenchmarks,
  hasStandardTextBenchmarks,
  numericEval,
  textMetricValue,
} from "@/lib/model-metrics";
import type { LLMModel } from "@/lib/api";
import type { CompareModelOption } from "@/lib/compare-model";

// ─── Benchmark constants ──────────────────────────────────────────────────────

const COMPARE_COLUMN_EXIT_MS = 180;

// ─── Formatters ───────────────────────────────────────────────────────────────

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
  if (val === 0) return "$0";
  if (val < 0.01) return `$${val.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  if (val < 1) return `$${val.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${val.toFixed(2).replace(/\.00$/, "")}`;
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
  const title = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  if (key.startsWith("openrouter_benchmark_")) {
    return `OpenRouter ${title(key.replace("openrouter_benchmark_", ""))}`;
  }
  if (key.startsWith("openrouter_da_")) {
    return `OpenRouter DA ${title(key.replace("openrouter_da_", "").replace(/_win_rate$/, ""))} Win Rate`;
  }
  return title(key);
}

// ─── Score helpers ────────────────────────────────────────────────────────────

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

// ─── Shared sub-components ───────────────────────────────────────────────────

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

interface ModalityData { text?: boolean; image?: boolean; video?: boolean; audio?: boolean }

interface DisplayPriceMetric {
  id: string;
  label: string;
  unit: string;
}

function displayPriceMetrics(models: LLMModel[]): DisplayPriceMetric[] {
  const rows = new Map<string, DisplayPriceMetric>();
  for (const model of models) {
    for (const row of model.pricing.openrouter_display_prices ?? []) {
      const id = `${row.label}|${row.unit}`;
      if (!rows.has(id)) rows.set(id, { id, label: row.label, unit: row.unit });
    }
  }
  return [...rows.values()];
}

function displayPriceValue(model: LLMModel, metric: DisplayPriceMetric): number | null {
  const row = model.pricing.openrouter_display_prices?.find(
    (candidate) => `${candidate.label}|${candidate.unit}` === metric.id,
  );
  return typeof row?.price === "number" ? row.price : null;
}

// ─── Desktop table components ────────────────────────────────────────────────

function LabelCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap sticky left-0 bg-background z-10 min-w-[180px] border-r">
      {children}
    </td>
  );
}

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

interface MetricConfig {
  label: React.ReactNode;
  values: (number | null)[];
  dir: Direction;
  format: (v: number | null) => string;
  colorize?: boolean;
  noBar?: boolean;
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
              <span className={`font-mono text-xs ${winner ? "font-semibold" : ""} ${colorize ? scoreBg(val) : ""} ${winner && !colorize ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {format(val)}
                {winner && val !== null && <span className="ml-1 inline-block size-1.5 rounded-full bg-emerald-500 align-middle" />}
              </span>
              {!noBar && val !== null && (
                <div className="h-0.5 w-14 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-[width] duration-200 ${winner ? "bg-emerald-500" : "bg-primary/40"}`} style={{ width: `${pct}%` }} />
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

function ModalityRow({ label, rows }: { label: string; rows: ModalityData[] }) {
  const { t } = useI18n();
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
              <IconBox icon={<Type className="size-3" />} title={t.detail.modalityLabels.text} active={r.text ?? true} />
              <IconBox icon={<ImageIcon className="size-3" />} title={t.detail.modalityLabels.image} active={r.image} />
              <IconBox icon={<Mic className="size-3" />} title={t.detail.modalityLabels.speech} active={r.audio} />
              <IconBox icon={<Video className="size-3" />} title={t.detail.modalityLabels.video} active={r.video} />
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Mobile components ────────────────────────────────────────────────────────

function MobileSectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-muted/40 border-b">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

interface MobileRowProps {
  label: React.ReactNode;
  value: string;
  isBest?: boolean;
  colorClass?: string;
  barPct?: number;
}

function MobileRow({ label, value, isBest, colorClass, barPct }: MobileRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b last:border-b-0 ${isBest ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""}`}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex flex-col items-end gap-0.5 min-w-0">
        <span className={`text-sm font-mono ${isBest ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""} ${colorClass ?? ""}`}>
          {value}
          {isBest && value !== "—" && <span className="ml-1 inline-block size-1.5 rounded-full bg-emerald-500 align-middle" />}
        </span>
        {barPct !== undefined && value !== "—" && (
          <div className="h-0.5 w-16 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${isBest ? "bg-emerald-500" : "bg-primary/40"}`} style={{ width: `${barPct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MobileBoolRow({ label, value }: { label: string; value: boolean | undefined | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? (
        <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted">
          <X className="size-3 text-muted-foreground/50" />
        </span>
      )}
    </div>
  );
}

function MobileModalityRow({ label, data }: { label: string; data: ModalityData }) {
  const { t } = useI18n();
  if (data.text == null && data.image == null && data.video == null && data.audio == null) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <IconBox icon={<Type className="size-3" />} title={t.detail.modalityLabels.text} active={data.text ?? true} />
        <IconBox icon={<ImageIcon className="size-3" />} title={t.detail.modalityLabels.image} active={data.image} />
        <IconBox icon={<Mic className="size-3" />} title={t.detail.modalityLabels.speech} active={data.audio} />
        <IconBox icon={<Video className="size-3" />} title={t.detail.modalityLabels.video} active={data.video} />
      </div>
    </div>
  );
}

// ─── Mobile view ─────────────────────────────────────────────────────────────

interface MobileViewProps {
  models: LLMModel[];
  allModels: CompareModelOption[];
  winnerCounts: number[];
  winnerDetails: string[][];
  maxWins: number;
  onRemove: (slug: string) => void;
  onAdd: (model: CompareModelOption) => void;
  isFull: boolean;
  extraBenchmarkKeys: string[];
  displayPriceRows: DisplayPriceMetric[];
}

function MobileCompareView({
  models, allModels, winnerCounts, winnerDetails, maxWins,
  onRemove, onAdd, isFull, extraBenchmarkKeys, displayPriceRows,
}: MobileViewProps) {
  const { t, lang } = useI18n();
  const [activeIdx, setActiveIdx] = useState(0);
  const [addSearch, setAddSearch] = useState("");

  const idx = Math.min(activeIdx, models.length - 1);
  const m = models[idx];
  const ev = m.evaluations;
  const pr = m.pricing;

  const searchResults = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return [];
    return allModels
      .filter(x => !models.some(e => e.id === x.id) &&
        (x.name.toLowerCase().includes(q) || x.model_creator.name.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [addSearch, allModels, models]);

  // Helpers to check best and bar for the active model
  const av = (getter: (x: LLMModel) => number | null) => models.map(getter);
  const isB = (val: number | null, getter: (x: LLMModel) => number | null, dir: Direction) =>
    isBest(val, getBest(av(getter), dir));
  const rb = (val: number | null, getter: (x: LLMModel) => number | null, dir: Direction) =>
    relBar(val, av(getter), dir);

  return (
    <div className="space-y-4">
      {/* Tabs — one per model */}
      <div
        role="tablist"
        aria-label={t.compare.title}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl border bg-muted/20 p-1"
      >
        {models.map((model, i) => (
          <button
            key={model.id}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => setActiveIdx(i)}
            className={`touch-target flex w-40 max-w-40 snap-start shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition-colors ${
              i === idx ? "border bg-card shadow-sm" : "border border-transparent hover:bg-muted/50"
            }`}
          >
            <div className="size-7 flex items-center justify-center">
              <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={20} iconUrl={model.provider_icon_url} />
            </div>
            <span className="w-full min-w-0 px-1 text-center text-xs font-medium leading-tight line-clamp-2">{model.name}</span>
            {winnerCounts[i] > 0 && (
              <Badge
                variant={winnerCounts[i] === maxWins && maxWins > 0 ? "default" : "secondary"}
                className="text-xs gap-0.5 py-0 h-4 px-1.5"
              >
                <Trophy className="size-2" />
                {winnerCounts[i]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Active model header */}
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-xl bg-muted border flex items-center justify-center shrink-0">
          <ModelProviderIcon provider={getModelProviderKey(m.slug, m.model_creator.slug)} size={28} iconUrl={m.provider_icon_url} />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/models/${m.slug}`} className="font-semibold leading-tight hover:underline line-clamp-2">
            {m.name}
          </Link>
          <p className="text-sm text-muted-foreground">{m.model_creator.name}</p>
          {m.release_date && <p className="text-xs text-muted-foreground mt-0.5">{m.release_date}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {winnerDetails[idx].length > 0 && (
            <Badge
              variant={winnerCounts[idx] === maxWins ? "default" : "secondary"}
              className="h-6 gap-1"
              title={t.compare.wins(winnerCounts[idx])}
            >
              <Trophy className="size-3" />
              {winnerCounts[idx]}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => { onRemove(m.slug); setActiveIdx(Math.max(0, idx - 1)); }}
            className="touch-target inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`${t.compare.remove} ${m.name}`}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Add model search */}
      {!isFull && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={`${t.compare.addModel}…`}
            aria-label={t.compare.addModel}
            autoComplete="off"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {addSearch && (
            <button
              type="button"
              onClick={() => setAddSearch("")}
              aria-label={t.compare.clear}
              className="touch-target absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <SearchDropdown
            results={searchResults}
            query={addSearch}
            onAdd={(result) => {
              onAdd(result);
              setAddSearch("");
              setActiveIdx(models.length);
            }}
          />
        </div>
      )}

      {/* Metrics card */}
      <div className="rounded-xl border overflow-hidden divide-y">

        {/* AA Indices */}
        {hasAAIndexBenchmarks(m) && (
          <>
            <MobileSectionHeader label={t.compare.sections.aaIndices} />
            {([
              [t.benchmarks.intelligence, "artificial_analysis_intelligence_index"],
              [t.benchmarks.coding, "artificial_analysis_coding_index"],
              [t.benchmarks.math, "artificial_analysis_math_index"],
              [t.benchmarks.agentic, "agentic_index"],
            ] as [string, string][]).map(([label, key]) => {
              const val = textMetricValue(m, key);
              return val !== null ? (
                <MobileRow key={key} label={label}
                  value={fmt(val)}
                  isBest={isB(val, x => textMetricValue(x, key), "higher")}
                  colorClass={scoreBg(val)}
                  barPct={rb(val, x => textMetricValue(x, key), "higher")}
                />
              ) : null;
            })}
          </>
        )}

        {/* Benchmarks */}
        {hasStandardTextBenchmarks(m) && (
          <>
            <MobileSectionHeader label={t.compare.sections.benchmarks} />
            {([
              [t.benchmarks.mmlu_pro,          textMetricValue(m, "mmlu_pro"),          (x: LLMModel) => textMetricValue(x, "mmlu_pro")],
              [t.benchmarks.gpqa,              textMetricValue(m, "gpqa"),              (x: LLMModel) => textMetricValue(x, "gpqa")],
              [t.benchmarks.hle,               textMetricValue(m, "hle"),               (x: LLMModel) => textMetricValue(x, "hle")],
              [t.benchmarks.livecodebench,     textMetricValue(m, "livecodebench"),     (x: LLMModel) => textMetricValue(x, "livecodebench")],
              [t.benchmarks.scicode,           textMetricValue(m, "scicode"),           (x: LLMModel) => textMetricValue(x, "scicode")],
              [t.benchmarks.math_500,          textMetricValue(m, "math_500"),          (x: LLMModel) => textMetricValue(x, "math_500")],
              [t.benchmarks.aime_25,           textMetricValue(m, "aime_25"),           (x: LLMModel) => textMetricValue(x, "aime_25")],
              [t.benchmarks.ifbench,           textMetricValue(m, "ifbench"),           (x: LLMModel) => textMetricValue(x, "ifbench")],
              [t.benchmarks.lcr,               textMetricValue(m, "lcr"),               (x: LLMModel) => textMetricValue(x, "lcr")],
              [t.benchmarks.terminalbench_hard, textMetricValue(m, "terminalbench_hard"),(x: LLMModel) => textMetricValue(x, "terminalbench_hard")],
              [t.benchmarks.tau2,              textMetricValue(m, "tau2"),              (x: LLMModel) => textMetricValue(x, "tau2")],
              [t.benchmarks.gdpval_normalized, textMetricValue(m, "gdpval_normalized"), (x: LLMModel) => textMetricValue(x, "gdpval_normalized")],
              [t.benchmarks.itbench_aa,        textMetricValue(m, "itbench_aa"),        (x: LLMModel) => textMetricValue(x, "itbench_aa")],
            ] as [string, number | null, (x: LLMModel) => number | null][]).map(([label, val, getter]) =>
              val !== null ? (
                <MobileRow key={String(label)} label={label}
                  value={fmtPct(val)}
                  isBest={isB(val, getter, "higher")}
                  barPct={rb(val, getter, "higher")}
                />
              ) : null
            )}
          </>
        )}

        {hasMediaBenchmarks(m) && (
          <>
            <MobileSectionHeader label={t.detail.mediaBenchmarks} />
            {AA_MEDIA_BENCHMARK_DEFS.map((def) => {
              const val = numericEval(ev, def.eloKey);
              return val !== null ? (
                <MobileRow key={def.eloKey} label={def.label[lang]}
                  value={`${fmt(val, 0)} ELO`}
                  isBest={isB(val, x => numericEval(x.evaluations, def.eloKey), "higher")}
                  barPct={rb(val, x => numericEval(x.evaluations, def.eloKey), "higher")}
                />
              ) : null;
            })}
          </>
        )}

        {/* Extra benchmarks */}
        {extraBenchmarkKeys.length > 0 && (
          <>
            <MobileSectionHeader label={t.detail.extraBenchmarks} />
            {extraBenchmarkKeys.map(key => {
              const val = ev[key] ?? null;
              return val !== null ? (
                <MobileRow key={key} label={formatBenchmarkKey(key)}
                  value={fmtDynamic(val)}
                  isBest={isB(val, x => x.evaluations[key] ?? null, "higher")}
                  barPct={rb(val, x => x.evaluations[key] ?? null, "higher")}
                />
              ) : null;
            })}
          </>
        )}

        {/* Performance */}
        {[m.median_output_tokens_per_second, m.median_time_to_first_token_seconds, m.median_time_to_first_answer_token, m.end_to_end_response_time_seconds].some(v => v != null) && (
          <>
            <MobileSectionHeader label={t.compare.sections.performance} />
            <MobileRow label={t.compare.fields.outputSpeed}
              value={m.median_output_tokens_per_second !== null ? `${fmt(m.median_output_tokens_per_second, 0)} t/s` : "—"}
              isBest={isB(m.median_output_tokens_per_second, x => x.median_output_tokens_per_second, "higher")}
              barPct={rb(m.median_output_tokens_per_second, x => x.median_output_tokens_per_second, "higher")}
            />
            <MobileRow label={t.compare.fields.ttft}
              value={m.median_time_to_first_token_seconds !== null ? `${fmt(m.median_time_to_first_token_seconds, 2)}s` : "—"}
              isBest={isB(m.median_time_to_first_token_seconds, x => x.median_time_to_first_token_seconds, "lower")}
              barPct={rb(m.median_time_to_first_token_seconds, x => x.median_time_to_first_token_seconds, "lower")}
            />
            <MobileRow label={t.compare.fields.firstAnswer}
              value={m.median_time_to_first_answer_token !== null ? `${fmt(m.median_time_to_first_answer_token, 2)}s` : "—"}
              isBest={isB(m.median_time_to_first_answer_token, x => x.median_time_to_first_answer_token, "lower")}
              barPct={rb(m.median_time_to_first_answer_token, x => x.median_time_to_first_answer_token, "lower")}
            />
            {m.end_to_end_response_time_seconds != null && (
              <MobileRow label={t.compare.fields.endToEnd}
                value={`${fmt(m.end_to_end_response_time_seconds, 1)}s`}
                isBest={isB(m.end_to_end_response_time_seconds, x => x.end_to_end_response_time_seconds ?? null, "lower")}
                barPct={rb(m.end_to_end_response_time_seconds, x => x.end_to_end_response_time_seconds ?? null, "lower")}
              />
            )}
          </>
        )}

        {/* Pricing */}
        {([pr.price_1m_input_tokens, pr.price_1m_output_tokens, pr.price_1m_blended_3_to_1].some(v => v !== null) || displayPriceRows.some((row) => displayPriceValue(m, row) !== null)) && (
          <>
            <MobileSectionHeader label={t.compare.sections.pricing} />
            {displayPriceRows.map((row) => {
              const value = displayPriceValue(m, row);
              return value !== null ? (
                <MobileRow key={row.id} label={`${row.label} ${row.unit}`}
                  value={fmtPrice(value)}
                  isBest={isB(value, x => displayPriceValue(x, row), "lower")}
                  barPct={rb(value, x => displayPriceValue(x, row), "lower")}
                />
              ) : null;
            })}
            {pr.price_1m_input_tokens !== null && (
              <MobileRow label={t.compare.fields.inputPrice}
                value={fmtPrice(pr.price_1m_input_tokens)}
                isBest={isB(pr.price_1m_input_tokens, x => x.pricing.price_1m_input_tokens, "lower")}
                barPct={rb(pr.price_1m_input_tokens, x => x.pricing.price_1m_input_tokens, "lower")}
              />
            )}
            {pr.price_1m_cache_hit_tokens != null && (
              <MobileRow label={t.compare.fields.cacheHitPrice}
                value={`$${pr.price_1m_cache_hit_tokens.toFixed(3)}`}
                isBest={isB(pr.price_1m_cache_hit_tokens, x => x.pricing.price_1m_cache_hit_tokens ?? null, "lower")}
                barPct={rb(pr.price_1m_cache_hit_tokens, x => x.pricing.price_1m_cache_hit_tokens ?? null, "lower")}
              />
            )}
            {pr.price_1m_output_tokens !== null && (
              <MobileRow label={t.compare.fields.outputPrice}
                value={fmtPrice(pr.price_1m_output_tokens)}
                isBest={isB(pr.price_1m_output_tokens, x => x.pricing.price_1m_output_tokens, "lower")}
                barPct={rb(pr.price_1m_output_tokens, x => x.pricing.price_1m_output_tokens, "lower")}
              />
            )}
            {pr.price_1m_blended_3_to_1 !== null && (
              <MobileRow label={t.compare.fields.blendedPrice}
                value={fmtPrice(pr.price_1m_blended_3_to_1)}
                isBest={isB(pr.price_1m_blended_3_to_1, x => x.pricing.price_1m_blended_3_to_1, "lower")}
                barPct={rb(pr.price_1m_blended_3_to_1, x => x.pricing.price_1m_blended_3_to_1, "lower")}
              />
            )}
            {pr.price_1m_blended_7_2_1 != null && (
              <MobileRow label={t.compare.fields.blended721Price}
                value={fmtPrice(pr.price_1m_blended_7_2_1)}
                isBest={isB(pr.price_1m_blended_7_2_1, x => x.pricing.price_1m_blended_7_2_1 ?? null, "lower")}
                barPct={rb(pr.price_1m_blended_7_2_1, x => x.pricing.price_1m_blended_7_2_1 ?? null, "lower")}
              />
            )}
          </>
        )}

        {/* Capabilities */}
        <>
          <MobileSectionHeader label={t.compare.sections.capabilities} />
          {m.context_window_tokens != null && (
            <MobileRow label={t.detail.contextWindow}
              value={`${fmtCtx(m.context_window_tokens)} tokens`}
              isBest={isB(m.context_window_tokens, x => x.context_window_tokens ?? null, "higher")}
              barPct={rb(m.context_window_tokens, x => x.context_window_tokens ?? null, "higher")}
            />
          )}
          {m.knowledge_cutoff && (
            <MobileRow label={t.compare.fields.knowledgeCutoff} value={m.knowledge_cutoff} />
          )}
          {m.total_parameters_b != null && (
            <MobileRow label={t.detail.totalParams} value={fmtParams(m.total_parameters_b)} />
          )}
          {m.active_parameters_b != null && (
            <MobileRow label={t.detail.activeParams} value={fmtParams(m.active_parameters_b)} />
          )}
          {m.openness_index != null && (
            <MobileRow label={t.detail.opennessIndex}
              value={`${m.openness_index.toFixed(0)} / 100`}
              isBest={isB(m.openness_index, x => x.openness_index ?? null, "higher")}
              barPct={rb(m.openness_index, x => x.openness_index ?? null, "higher")}
            />
          )}
          <MobileBoolRow label={t.detail.reasoning} value={m.reasoning_model} />
          <MobileBoolRow label={t.detail.openWeights} value={m.is_open_weights} />
          <MobileModalityRow label={t.detail.inputModality} data={{ text: m.input_modality_text, image: m.input_modality_image, video: m.input_modality_video, audio: m.input_modality_speech }} />
          <MobileModalityRow label={t.detail.outputModality} data={{ text: m.output_modality_text, image: m.output_modality_image, video: m.output_modality_video, audio: m.output_modality_speech }} />
        </>

        {/* Meta-evaluation (verbosity + eval cost) */}
        {(m.intelligence_index_tokens != null || m.intelligence_index_cost_usd != null) && (
          <>
            <MobileSectionHeader label={t.compare.sections.meta} />
            {m.intelligence_index_tokens != null && (
              <MobileRow label={t.compare.fields.verbosity}
                value={m.intelligence_index_tokens >= 1_000_000
                  ? `${(m.intelligence_index_tokens / 1_000_000).toFixed(1)}M`
                  : `${(m.intelligence_index_tokens / 1_000).toFixed(1)}K`}
                isBest={isB(m.intelligence_index_tokens, x => x.intelligence_index_tokens ?? null, "lower")}
                barPct={rb(m.intelligence_index_tokens, x => x.intelligence_index_tokens ?? null, "lower")}
              />
            )}
            {m.intelligence_index_cost_usd != null && (
              <MobileRow label={t.compare.fields.evalCost}
                value={`$${m.intelligence_index_cost_usd.toFixed(2)}`}
                isBest={isB(m.intelligence_index_cost_usd, x => x.intelligence_index_cost_usd ?? null, "lower")}
                barPct={rb(m.intelligence_index_cost_usd, x => x.intelligence_index_cost_usd ?? null, "lower")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Search results dropdown (shared) ────────────────────────────────────────

function SearchDropdown({
  results,
  onAdd,
  query,
}: {
  results: CompareModelOption[];
  onAdd: (m: CompareModelOption) => void;
  query: string;
}) {
  const { t } = useI18n();
  if (results.length === 0) {
    if (!query.trim()) return null;
    return (
      <div
        role="status"
        className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover px-3 py-4 text-center text-sm text-muted-foreground shadow-md"
      >
        {t.grid.noResults}
      </div>
    );
  }
  return (
    <div
      role="listbox"
      aria-label={t.compare.addModel}
      className="compare-search-dropdown absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover shadow-md"
    >
      {results.map((m, index) => (
        <button
          key={m.id}
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => onAdd(m)}
          className="compare-search-result w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
          style={{ animationDelay: `${Math.min(index, 7) * 32}ms` }}
        >
          <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
            <ModelProviderIcon provider={getModelProviderKey(m.slug, m.model_creator.slug)} size={18} iconUrl={m.provider_icon_url} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{m.name}</p>
            <p className="text-xs text-muted-foreground">{m.model_creator.name}</p>
          </div>
          {m.intelligence_score !== null && (
            <Badge variant="secondary" className="font-mono text-xs shrink-0">
              {m.intelligence_score.toFixed(1)}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CompareTable({ models, allModels }: { models: LLMModel[]; allModels: CompareModelOption[] }) {
  const { t, lang } = useI18n();
  const { replace, lastChange } = useCompare();
  const navigate = useNavigate({ from: "/compare" });
  const [addSearch, setAddSearch] = useState("");
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  const compareUpdateTimerRef = useRef<number | null>(null);
  const compareSignature = models.map((model) => model.slug).join("|") || "empty";
  const compareIsFull = models.length >= 4;
  const removingIndex = removingSlug ? models.findIndex((model) => model.slug === removingSlug) : -1;

  function navigateToCompare(slugs: string[]) {
    const next = [...new Set(slugs)].slice(0, 4);
    replace(next);
    void navigate({
      to: "/compare",
      search: next.length > 0 ? { models: next.join(",") } : {},
      replace: true,
    });
  }

  useEffect(() => {
    replace(models.map((model) => model.slug));
  }, [compareSignature, models, replace]);

  useEffect(() => {
    return () => {
      if (compareUpdateTimerRef.current) window.clearTimeout(compareUpdateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setRemovingSlug(null), 0);
    return () => window.clearTimeout(id);
  }, [compareSignature]);

  const searchResults = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return [];
    return allModels
      .filter(m => !models.some(e => e.id === m.id) &&
        (m.name.toLowerCase().includes(q) || m.model_creator.name.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [addSearch, allModels, models]);

  function addModel(model: CompareModelOption) {
    if (compareIsFull) return;
    navigateToCompare([...models.map(m => m.slug), model.slug]);
    setAddSearch("");
  }

  function removeModel(slug: string) {
    if (removingSlug) return;
    setRemovingSlug(slug);
    if (compareUpdateTimerRef.current) window.clearTimeout(compareUpdateTimerRef.current);
    compareUpdateTimerRef.current = window.setTimeout(() => {
      const next = models.filter(m => m.slug !== slug).map(m => m.slug);
      navigateToCompare(next);
      compareUpdateTimerRef.current = null;
    }, COMPARE_COLUMN_EXIT_MS);
  }

  const extraBenchmarkKeys = useMemo(() => {
    const keys = new Set<string>();
    models.forEach(m => {
      applicableExtraBenchmarkEntries(m).forEach(([key]) => keys.add(key));
    });
    return [...keys].sort();
  }, [models]);

  const displayPriceRows = useMemo(() => displayPriceMetrics(models), [models]);
  const hasAAIndexRows = models.some(hasAAIndexBenchmarks);
  const hasStandardBenchmarkRows = models.some(hasStandardTextBenchmarks);
  const hasMediaBenchmarkRows = models.some(hasMediaBenchmarks);

  const winnerDetails = useMemo(() => {
    const details: string[][] = models.map(() => []);
    const metrics: { vals: (number | null)[]; dir: Direction; label: string }[] = [
      { vals: models.map(m => textMetricValue(m, "artificial_analysis_intelligence_index")), dir: "higher", label: t.benchmarks.intelligence },
      { vals: models.map(m => textMetricValue(m, "artificial_analysis_coding_index")), dir: "higher", label: t.benchmarks.coding },
      { vals: models.map(m => textMetricValue(m, "artificial_analysis_math_index")), dir: "higher", label: t.benchmarks.math },
      { vals: models.map(m => textMetricValue(m, "mmlu_pro")), dir: "higher", label: t.benchmarks.mmlu_pro },
      { vals: models.map(m => textMetricValue(m, "gpqa")), dir: "higher", label: t.benchmarks.gpqa },
      { vals: models.map(m => textMetricValue(m, "hle")), dir: "higher", label: t.benchmarks.hle },
      { vals: models.map(m => textMetricValue(m, "livecodebench")), dir: "higher", label: t.benchmarks.livecodebench },
      { vals: models.map(m => textMetricValue(m, "math_500")), dir: "higher", label: t.benchmarks.math_500 },
      { vals: models.map(m => textMetricValue(m, "aime_25")), dir: "higher", label: t.benchmarks.aime_25 },
      { vals: models.map(m => m.median_output_tokens_per_second), dir: "higher", label: t.compare.fields.outputSpeed },
      { vals: models.map(m => m.median_time_to_first_token_seconds), dir: "lower", label: t.compare.fields.ttft },
      { vals: models.map(m => m.pricing.price_1m_blended_3_to_1), dir: "lower", label: t.compare.fields.blendedPrice },
    ];
    for (const def of AA_MEDIA_BENCHMARK_DEFS) {
      metrics.push({
        vals: models.map((m) => numericEval(m.evaluations, def.eloKey)),
        dir: "higher",
        label: def.label[lang],
      });
    }
    metrics.forEach(({ vals, dir, label }) => {
      if (vals.every(v => v === null)) return;
      const best = getBest(vals, dir);
      vals.forEach((v, i) => { if (isBest(v, best)) details[i].push(label); });
    });
    return details;
  }, [models, t]);

  const winnerCounts = winnerDetails.map(d => d.length);
  const maxWins = Math.max(...winnerCounts);
  const ev = models.map(m => m.evaluations);
  const pr = models.map(m => m.pricing);

  // Empty state
  if (models.length === 0) {
    const dataUnavailable = allModels.length === 0;
    return (
      <div className="compare-empty-state flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
        <GitCompareArrows className="size-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">
            {dataUnavailable ? t.grid.unavailableTitle : t.compare.noModels}
          </p>
          <p className="text-sm text-muted-foreground">
            {dataUnavailable ? t.grid.unavailableDescription : t.compare.addMore}
          </p>
        </div>
        {!dataUnavailable && <div className="relative w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={`${t.compare.addModel}…`}
              aria-label={t.compare.addModel}
              autoComplete="off"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {addSearch && (
              <button
                type="button"
                onClick={() => setAddSearch("")}
                aria-label={t.compare.clear}
                className="touch-target absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <SearchDropdown results={searchResults} onAdd={addModel} query={addSearch} />
        </div>}
        <Button variant="outline" size="sm" asChild className="touch-target">
          <Link href="/">{t.compare.backToList}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.compare.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="touch-target">
            <Link href="/">
              <ChevronLeft data-icon="inline-start" />
              <span className="hidden sm:inline">{t.compare.backToList}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="touch-target"
            onClick={() => {
              navigateToCompare([]);
            }}
          >
            {t.compare.clear}
          </Button>
        </div>
      </div>

      {/* ── MOBILE VIEW ─────────────────────────────────────────────────── */}
      <div
        className="compare-panel-refresh lg:hidden"
      >
        <MobileCompareView
          models={models}
          allModels={allModels}
          winnerCounts={winnerCounts}
          winnerDetails={winnerDetails}
          maxWins={maxWins}
          onRemove={removeModel}
          onAdd={addModel}
          isFull={compareIsFull}
          extraBenchmarkKeys={extraBenchmarkKeys}
          displayPriceRows={displayPriceRows}
        />
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────────────────── */}
      <div
        className="compare-panel-refresh hidden space-y-4 lg:block"
      >
        {/* Add model search */}
        {!compareIsFull && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={`${t.compare.addModel}…`}
              aria-label={t.compare.addModel}
              autoComplete="off"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {addSearch && (
              <button
                type="button"
                onClick={() => setAddSearch("")}
                aria-label={t.compare.clear}
                className="touch-target absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
            <SearchDropdown results={searchResults} onAdd={addModel} query={addSearch} />
          </div>
        )}

        {/* Table */}
        <div key={`table-${compareSignature}`} className="compare-table-frame overflow-x-auto rounded-xl border">
          <table
            className={`compare-table w-full min-w-[500px] text-sm ${
              removingIndex >= 0 ? `compare-removing-col-${removingIndex}` : ""
            }`}
          >
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/40 min-w-[180px] border-r">
                  {t.compare.model}
                </th>
                {models.map((model, idx) => (
                  <th
                    key={model.id}
                    className={`py-3 px-4 text-center min-w-[180px] ${
                      lastChange?.slug === model.slug && lastChange.type === "add" ? "compare-column-added" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="size-9 rounded-lg bg-background flex items-center justify-center border">
                        <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={22} iconUrl={model.provider_icon_url} />
                      </div>
                      <Link href={`/models/${model.slug}`} className="font-medium text-sm leading-tight hover:underline text-foreground line-clamp-2">
                        {model.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{model.model_creator.name}</span>
                      {winnerCounts[idx] > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={winnerCounts[idx] === maxWins && maxWins > 0 ? "default" : "secondary"} className="text-xs gap-1 py-0 h-5 cursor-help">
                              <Trophy className="size-2.5" />
                              {winnerCounts[idx]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px]">
                            <p className="font-medium">{t.compare.wins(winnerCounts[idx])}</p>
                            <ul className="mt-1 space-y-0.5">
                              {winnerDetails[idx].map(cat => <li key={cat} className="text-xs opacity-80">· {cat}</li>)}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <button
                        type="button"
                        onClick={() => removeModel(model.slug)}
                        className="touch-target flex min-h-10 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
              <SectionHeader label={t.compare.sections.info} />
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <LabelCell>{t.compare.fields.provider}</LabelCell>
                {models.map(m => <td key={m.id} className="py-2.5 px-4 text-sm text-center">{m.model_creator.name}</td>)}
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <LabelCell>{t.compare.fields.releaseDate}</LabelCell>
                {models.map(m => <td key={m.id} className="py-2.5 px-4 text-sm text-center font-mono">{m.release_date ?? "—"}</td>)}
              </tr>

              <SectionHeader label={t.compare.sections.capabilities} />
              <MetricRow label={t.detail.contextWindow} values={models.map(m => m.context_window_tokens ?? null)} dir="higher" format={fmtCtx} />
              <MetricRow label={t.detail.totalParams}   values={models.map(m => m.total_parameters_b ?? null)} dir="higher" format={fmtParams} noBar />
              <MetricRow label={t.detail.activeParams}  values={models.map(m => m.active_parameters_b ?? null)} dir="higher" format={fmtParams} noBar />
              <BoolRow   label={t.detail.reasoning}     values={models.map(m => m.reasoning_model)} />
              <BoolRow   label={t.detail.openWeights}   values={models.map(m => m.is_open_weights)} />
              <MetricRow
                label={t.detail.opennessIndex}
                values={models.map(m => m.openness_index ?? null)}
                dir="higher"
                format={v => v !== null ? `${v.toFixed(0)} / 100` : "—"}
              />
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <LabelCell>{t.compare.fields.knowledgeCutoff}</LabelCell>
                {models.map(m => (
                  <td key={m.id} className="py-2.5 px-4 text-sm text-center font-mono">
                    {m.knowledge_cutoff ?? "—"}
                  </td>
                ))}
              </tr>
              <ModalityRow label={t.detail.inputModality}  rows={models.map(m => ({ text: m.input_modality_text, image: m.input_modality_image, video: m.input_modality_video, audio: m.input_modality_speech }))} />
              <ModalityRow label={t.detail.outputModality} rows={models.map(m => ({ text: m.output_modality_text, image: m.output_modality_image, video: m.output_modality_video, audio: m.output_modality_speech }))} />

              {hasAAIndexRows && (
                <>
                  <SectionHeader label={t.compare.sections.aaIndices} />
                  <MetricRow label={t.benchmarks.intelligence} values={models.map(m => textMetricValue(m, "artificial_analysis_intelligence_index"))} dir="higher" format={fmt} colorize />
                  <MetricRow label={t.benchmarks.coding}       values={models.map(m => textMetricValue(m, "artificial_analysis_coding_index"))} dir="higher" format={fmt} colorize />
                  <MetricRow label={t.benchmarks.math}         values={models.map(m => textMetricValue(m, "artificial_analysis_math_index"))} dir="higher" format={fmt} colorize />
                  <MetricRow label={t.benchmarks.agentic}      values={models.map(m => textMetricValue(m, "agentic_index"))} dir="higher" format={fmt} colorize />
                </>
              )}

              {hasStandardBenchmarkRows && (
                <>
                  <SectionHeader label={t.compare.sections.benchmarks} />
                  <MetricRow label={t.benchmarks.mmlu_pro}          values={models.map(m => textMetricValue(m, "mmlu_pro"))}            dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.gpqa}              values={models.map(m => textMetricValue(m, "gpqa"))}               dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.hle}               values={models.map(m => textMetricValue(m, "hle"))}                dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.livecodebench}     values={models.map(m => textMetricValue(m, "livecodebench"))}      dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.scicode}           values={models.map(m => textMetricValue(m, "scicode"))}            dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.math_500}          values={models.map(m => textMetricValue(m, "math_500"))}           dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.aime}              values={models.map(m => textMetricValue(m, "aime"))}               dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.aime_25}           values={models.map(m => textMetricValue(m, "aime_25"))}            dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.ifbench}           values={models.map(m => textMetricValue(m, "ifbench"))}            dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.lcr}               values={models.map(m => textMetricValue(m, "lcr"))}                dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.terminalbench_hard} values={models.map(m => textMetricValue(m, "terminalbench_hard"))} dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.tau2}              values={models.map(m => textMetricValue(m, "tau2"))}               dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.gdpval_normalized} values={models.map(m => textMetricValue(m, "gdpval_normalized"))} dir="higher" format={fmtPct} />
                  <MetricRow label={t.benchmarks.itbench_aa}        values={models.map(m => textMetricValue(m, "itbench_aa"))}        dir="higher" format={fmtPct} />
                </>
              )}

              {hasMediaBenchmarkRows && (
                <>
                  <SectionHeader label={t.detail.mediaBenchmarks} />
                  {AA_MEDIA_BENCHMARK_DEFS.map((def) => (
                    <MetricRow
                      key={def.eloKey}
                      label={def.label[lang]}
                      values={models.map((m) => numericEval(m.evaluations, def.eloKey))}
                      dir="higher"
                      format={(v) => v !== null ? `${fmt(v, 0)} ELO` : "—"}
                    />
                  ))}
                </>
              )}

              {extraBenchmarkKeys.length > 0 && (
                <>
                  <SectionHeader label={t.detail.extraBenchmarks} />
                  {extraBenchmarkKeys.map(key => (
                    <MetricRow
                      key={key}
                      label={formatBenchmarkKey(key)}
                      values={ev.map(e => e[key] ?? null)}
                      dir="higher"
                      format={key.startsWith("openrouter_da_") ? (v) => v !== null ? `${v.toFixed(1)}%` : "—" : fmtDynamic}
                    />
                  ))}
                </>
              )}

              <SectionHeader label={t.compare.sections.performance} />
              <MetricRow label={t.compare.fields.outputSpeed} values={models.map(m => m.median_output_tokens_per_second)} dir="higher" format={v => v !== null ? `${fmt(v, 0)} t/s` : "—"} />
              <MetricRow label={t.compare.fields.ttft}        values={models.map(m => m.median_time_to_first_token_seconds)} dir="lower" format={v => v !== null ? `${fmt(v, 2)}s` : "—"} />
              <MetricRow label={t.compare.fields.firstAnswer} values={models.map(m => m.median_time_to_first_answer_token)} dir="lower" format={v => v !== null ? `${fmt(v, 2)}s` : "—"} />
              <MetricRow
                label={
                  <span className="flex items-center gap-1">
                    {t.compare.fields.endToEnd}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-xs">{t.detail.endToEndTooltip}</TooltipContent>
                    </Tooltip>
                  </span>
                }
                values={models.map(m => m.end_to_end_response_time_seconds ?? null)}
                dir="lower"
                format={v => v !== null ? `${fmt(v, 1)}s` : "—"}
              />

              <SectionHeader label={t.compare.sections.pricing} />
              {displayPriceRows.map((row) => (
                <MetricRow
                  key={row.id}
                  label={`${row.label} ${row.unit}`}
                  values={models.map((m) => displayPriceValue(m, row))}
                  dir="lower"
                  format={fmtPrice}
                />
              ))}
              <MetricRow label={t.compare.fields.inputPrice}  values={pr.map(p => p.price_1m_input_tokens)}   dir="lower" format={fmtPrice} />
              <MetricRow
                label={
                  <span className="flex items-center gap-1">
                    {t.compare.fields.cacheHitPrice}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-xs">{t.detail.cacheHitTooltip}</TooltipContent>
                    </Tooltip>
                  </span>
                }
                values={pr.map(p => p.price_1m_cache_hit_tokens ?? null)}
                dir="lower"
                format={v => v !== null ? `$${v.toFixed(3)}` : "—"}
              />
              <MetricRow label={t.compare.fields.outputPrice} values={pr.map(p => p.price_1m_output_tokens)}  dir="lower" format={fmtPrice} />
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
                values={pr.map(p => p.price_1m_blended_3_to_1)}
                dir="lower"
                format={fmtPrice}
              />
              <MetricRow
                label={
                  <span className="flex items-center gap-1">
                    {t.compare.fields.blended721Price}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-xs">{t.detail.blended721Tooltip}</TooltipContent>
                    </Tooltip>
                  </span>
                }
                values={pr.map(p => p.price_1m_blended_7_2_1 ?? null)}
                dir="lower"
                format={fmtPrice}
              />

              <SectionHeader label={t.compare.sections.meta} />
              <MetricRow
                label={t.compare.fields.verbosity}
                values={models.map(m => m.intelligence_index_tokens ?? null)}
                dir="lower"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
              <MetricRow
                label={t.compare.fields.evalCost}
                values={models.map(m => m.intelligence_index_cost_usd ?? null)}
                dir="lower"
                format={v => v !== null ? `$${v.toFixed(2)}` : "—"}
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyRank}
                values={models.map(m => m.openrouter_weekly_rank ?? null)}
                dir="lower"
                format={v => v !== null ? `#${v.toFixed(0)}` : "—"}
                noBar
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyTokens}
                values={models.map(m => m.openrouter_weekly_tokens ?? null)}
                dir="higher"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyRequests}
                values={models.map(m => m.openrouter_weekly_requests ?? null)}
                dir="higher"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyToolCalls}
                values={models.map(m => m.openrouter_weekly_tool_calls ?? null)}
                dir="higher"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyImages}
                values={models.map(m => m.openrouter_weekly_images ?? null)}
                dir="higher"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
              <MetricRow
                label={t.compare.fields.openrouterWeeklyAudioInputs}
                values={models.map(m => m.openrouter_weekly_audio_inputs ?? null)}
                dir="higher"
                format={v => {
                  if (v === null) return "—";
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return String(v);
                }}
                noBar
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
