import { useRef, useState, type ReactNode } from "react";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { BarChart3, Coffee, ExternalLink, GitCompareArrows, Info, LibraryBig, Menu, MessageSquarePlus, Trophy } from "@/components/icons";
import { MobileSheet } from "@/components/mobile-sheet";
import { BENCHMARK_LINKS, DATA_SOURCE_LINKS } from "@/components/nav-links";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TAB =
  "mobile-tab relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium leading-4 text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:text-foreground";
const SHEET_ROW = "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-medium";
const SHEET_HEADING = "px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground";

function TabIcon({ icon: Icon, active }: { icon: typeof Trophy; active: boolean }) {
  return (
    <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", active && "bg-muted")}>
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function SheetLink({ href, active, onNavigate, children }: { href: string; active: boolean; onNavigate: () => void; children: ReactNode }) {
  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} data-active={active || undefined} className={SHEET_ROW}>
      {children}
    </Link>
  );
}

/**
 * Phone and tablet navigation: four thumb-reach tabs fixed to the bottom of
 * the screen. The compare tab carries the selection count, which replaces the
 * floating selection dock on these widths.
 */
export function MobileTabBar() {
  const { t } = useI18n();
  const { selected } = useCompare();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sheet, setSheet] = useState<"benchmarks" | "more" | null>(null);
  const benchmarksButton = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const close = () => setSheet(null);
  // Tapping the tab of the current page returns to its top, as native tab bars do.
  const scrollTopIfCurrent = (current: boolean) => (event: { preventDefault: () => void }) => {
    if (!current) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const onHome = pathname === "/";
  const onCompare = pathname.startsWith("/compare");
  const onBenchmark = BENCHMARK_LINKS.some((link) => pathname === link.href);
  const onMore = pathname.startsWith("/models") || pathname === "/about";
  const compareSearch = selected.length ? { models: selected.join(",") } : {};

  return (
    <>
      <nav
        data-mobile-tabs
        aria-label={t.mobile.navigation}
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 px-2 py-1">
          <Link href="/" onClick={scrollTopIfCurrent(onHome)} aria-current={onHome ? "page" : undefined} data-active={onHome} className={TAB}>
            <TabIcon icon={Trophy} active={onHome} />
            {t.mobile.ranking}
          </Link>
          <RouterLink
            to="/compare"
            search={compareSearch}
            aria-current={onCompare ? "page" : undefined}
            aria-label={selected.length ? `${t.compare.compare} · ${t.compare.selectedModels(selected.length)}` : undefined}
            data-active={onCompare}
            className={TAB}
          >
            <TabIcon icon={GitCompareArrows} active={onCompare} />
            {t.compare.compare}
            {selected.length > 0 && (
              <span
                key={selected.length}
                aria-hidden="true"
                className="tab-count absolute top-1 left-[calc(50%+0.5rem)] flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground"
              >
                {selected.length}
              </span>
            )}
          </RouterLink>
          <button
            ref={benchmarksButton}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={sheet === "benchmarks"}
            data-active={onBenchmark}
            onClick={() => setSheet("benchmarks")}
            className={TAB}
          >
            <TabIcon icon={BarChart3} active={onBenchmark} />
            {t.mobile.overview}
          </button>
          <button
            ref={moreButton}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={sheet === "more"}
            data-active={onMore}
            onClick={() => setSheet("more")}
            className={TAB}
          >
            <TabIcon icon={Menu} active={onMore} />
            {t.mobile.more}
          </button>
        </div>
        {/* The tab badge is decorative; this announces selection changes. */}
        <span role="status" className="sr-only">{selected.length ? t.compare.selectedCount(selected.length) : ""}</span>
      </nav>

      <MobileSheet open={sheet === "benchmarks"} onOpenChange={(open) => setSheet(open ? "benchmarks" : null)} title={t.nav.otherBenchmarks} returnFocus={benchmarksButton}>
        <nav aria-label={t.nav.otherBenchmarks} className="grid gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {BENCHMARK_LINKS.map(({ href, icon: Icon, label }) => (
            <SheetLink key={href} href={href} active={pathname === href} onNavigate={close}>
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {label(t)}
            </SheetLink>
          ))}
        </nav>
      </MobileSheet>

      <MobileSheet open={sheet === "more"} onOpenChange={(open) => setSheet(open ? "more" : null)} title={t.mobile.more} returnFocus={moreButton}>
        <nav aria-label={t.mobile.more} className="grid gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <SheetLink href="/models" active={pathname.startsWith("/models")} onNavigate={close}>
            <LibraryBig aria-hidden="true" className="size-5 shrink-0" />
            {t.nav.allModels}
          </SheetLink>
          <SheetLink href="/about" active={pathname === "/about"} onNavigate={close}>
            <Info aria-hidden="true" className="size-5 shrink-0" />
            {t.nav.about}
          </SheetLink>
          <a href="https://github.com/scorpion7slayer/benchsift/issues" target="_blank" rel="noopener noreferrer" onClick={close} className={SHEET_ROW}>
            <MessageSquarePlus aria-hidden="true" className="size-5 shrink-0" />
            {t.nav.feedback}
          </a>
          <a href="https://buymeacoffee.com/scorpion7slayer" target="_blank" rel="noopener noreferrer" onClick={close} className={SHEET_ROW}>
            <Coffee aria-hidden="true" className="size-5 shrink-0" />
            {t.nav.buyMeACoffee}
          </a>
          <div className="my-2 border-t" />
          <p className={SHEET_HEADING}>{t.nav.dataSources}</p>
          {DATA_SOURCE_LINKS.map(({ href, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={close} className={SHEET_ROW}>
              <ExternalLink aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              {label(t)}
            </a>
          ))}
          <a href="https://github.com/scorpion7slayer/benchsift" target="_blank" rel="noopener noreferrer" onClick={close} className={SHEET_ROW}>
            <ExternalLink aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            GitHub
          </a>
        </nav>
      </MobileSheet>
    </>
  );
}
