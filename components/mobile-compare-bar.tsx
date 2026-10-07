import { Link as RouterLink } from "@tanstack/react-router";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import { Button } from "./ui/button";
import { GitCompareArrows, X } from "./icons";

export function MobileCompareBar() {
  const { selected, clear } = useCompare();
  const { t } = useI18n();
  if (!selected.length) return null;
  return <aside data-compare-dock aria-label={t.mobile.selection} className="compare-selection-dock fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-xl border bg-card p-2 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:min-w-80">
    <button type="button" onClick={clear} aria-label={t.compare.clear} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
    <span className="min-w-0 flex-1 text-xs font-medium tabular-nums" role="status">{t.compare.selectedCount(selected.length)}</span>
    <Button asChild className="h-11 shrink-0 gap-2"><RouterLink to="/compare" search={{ models: selected.join(",") }}><GitCompareArrows className="size-4" />{t.compare.compare}</RouterLink></Button>
  </aside>;
}
