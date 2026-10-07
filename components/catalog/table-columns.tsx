import { useEffect, useState } from "react";
import { Download, PanelsTopLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber, type DisplayLang } from "@/lib/format";
import { useI18n, type Translations } from "@/lib/i18n";
import { mediaBenchmarkValues, textMetricValue } from "@/lib/model-metrics";
import type { LLMModel } from "@/lib/model-types";
import { COLUMN_KEYS, DEFAULT_COLUMNS, MAX_COLUMNS, catalogCsv, type ColumnKey } from "@/lib/catalog-columns";
import { formatSortValue } from "./sort-controls";

const STORAGE_KEY = "benchsift-table-columns";

/** Short header text; the full name stays in the column picker and the sort menu. */
export function columnLabel(key: ColumnKey, t: Translations): string {
  switch (key) {
    case "intelligence":
      return t.card.intelligence;
    case "speed":
      return t.card.speed;
    case "price":
      return t.card.price1m;
    case "context":
      return t.grid.contextShort;
    default:
      return t.grid.sorts[key];
  }
}

/** Display value of a cell; media models show their arena Elo for intelligence. */
export function columnValue(model: LLMModel, key: ColumnKey, lang: DisplayLang): string {
  if (key === "intelligence" && textMetricValue(model, "artificial_analysis_intelligence_index") == null) {
    const media = mediaBenchmarkValues(model)[0];
    if (media) return `${formatNumber(media.elo, lang, 0)} Elo`;
  }
  return formatSortValue(model, key, lang) ?? "—";
}

/** The chosen columns, remembered in this browser only. */
export function useTableColumns() {
  const [columns, setColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (Array.isArray(stored)) {
        const valid = stored.filter((key): key is ColumnKey => (COLUMN_KEYS as readonly string[]).includes(key)).slice(0, MAX_COLUMNS);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (valid.length) setColumns(valid);
      }
    } catch {
      // The default columns remain when storage is blocked or malformed.
    }
  }, []);
  function update(next: ColumnKey[]) {
    // Keep the canonical order so columns do not jump as they are toggled.
    const ordered = COLUMN_KEYS.filter((key) => next.includes(key));
    setColumns(ordered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
    } catch {
      // The choice still applies to this visit.
    }
  }
  return [columns, update] as const;
}

export function ColumnPicker({ columns, onChange }: { columns: ColumnKey[]; onChange: (columns: ColumnKey[]) => void }) {
  const { t } = useI18n();
  const copy = t.grid.columns;
  const full = columns.length >= MAX_COLUMNS;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="control" className="hidden lg:inline-flex">
          <PanelsTopLeft aria-hidden="true" className="size-4" />
          {copy.label}
          <span className="rounded bg-muted px-1.5 text-xs tabular-nums">{columns.length}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{copy.limit(MAX_COLUMNS)}</DropdownMenuLabel>
        {COLUMN_KEYS.map((key) => {
          const checked = columns.includes(key);
          return (
            <DropdownMenuCheckboxItem
              key={key}
              checked={checked}
              disabled={(!checked && full) || (checked && columns.length === 1)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(value) => onChange(value ? [...columns, key] : columns.filter((item) => item !== key))}
            >
              {t.grid.sorts[key]}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(DEFAULT_COLUMNS)}>{copy.reset}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ExportCsvButton({ models, columns }: { models: LLMModel[]; columns: ColumnKey[] }) {
  const { t } = useI18n();
  function download() {
    // The byte-order mark lets spreadsheet apps read the file as UTF-8.
    const blob = new Blob([`\uFEFF${catalogCsv(models, columns, t.grid.sorts)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `benchsift-models-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="outline" onClick={download} disabled={!models.length} size="control">
      <Download aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">{t.grid.exportCsv}</span>
      <span className="sr-only sm:hidden">{t.grid.exportCsv}</span>
    </Button>
  );
}
