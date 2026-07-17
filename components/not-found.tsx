import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Home } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

// Rendered when a route throws `notFound()` (e.g. an unknown model slug).
export function NotFound() {
  const { t } = useI18n();
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const block = copyRef.current;
    if (!block || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    block.classList.remove("is-shown");
    void block.offsetHeight;
    block.classList.add("is-shown");
  }, []);

  return (
    <div className="flex min-h-[100svh] flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 items-center" aria-labelledby="not-found-title">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:gap-16 lg:px-8 lg:py-20">
          <div ref={copyRef} className="t-stagger is-shown max-w-xl">
            <div className="t-stagger-line t-stagger-line--1">
              <p className="font-mono text-sm font-medium text-muted-foreground">
                404 <span aria-hidden="true">·</span> {t.notFound.status}
              </p>
              <h1
                id="not-found-title"
                className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl"
              >
                {t.notFound.title}
              </h1>
            </div>

            <p className="t-stagger-line t-stagger-line--2 mt-4 max-w-[58ch] text-base leading-7 text-muted-foreground">
              {t.notFound.description}
            </p>

            <div className="t-stagger-line t-stagger-line--3 mt-7">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-11 sm:min-h-9">
                  <Link to="/">
                    <Home className="size-4" />
                    {t.notFound.home}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-11 sm:min-h-9"
                >
                  <Link to="/models">
                    {t.notFound.browse}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="not-found-stage relative min-h-72 overflow-hidden border-y bg-card/45 px-4 py-5 sm:min-h-96 sm:px-7 sm:py-6">
            <div className="not-found-scan" aria-hidden="true" />

            <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[0.7rem] text-muted-foreground sm:text-xs">
              <span>{t.notFound.scanLabel}</span>
              <span>00 / 00</span>
            </div>

            <div
              className="not-found-code relative z-10 flex min-h-48 items-center justify-center gap-2 font-mono text-7xl font-semibold tracking-[-0.04em] sm:min-h-64 sm:gap-4 sm:text-8xl"
              aria-hidden="true"
            >
              <span className="not-found-symbol not-found-symbol--first">4</span>
              <span className="not-found-zero">
                <BrandMark className="not-found-mark size-6 sm:size-8" />
              </span>
              <span className="not-found-symbol not-found-symbol--last">4</span>
            </div>

            <div className="relative z-10 grid grid-cols-[1fr_auto] items-end gap-8">
              <div className="space-y-2.5" aria-hidden="true">
                <span className="not-found-trace not-found-trace--one block h-px w-full bg-border" />
                <span className="not-found-trace not-found-trace--two block h-px w-3/4 bg-border" />
                <span className="not-found-trace not-found-trace--three block h-px w-2/5 bg-border" />
              </div>
              <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-chart-4" aria-hidden="true" />
                {t.notFound.zeroMatches}
              </span>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
