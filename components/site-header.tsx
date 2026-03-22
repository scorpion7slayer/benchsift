"use client";

import Link from "next/link";
import { Brain, ExternalLink, ChevronLeft, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n, type Lang } from "@/lib/i18n";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28s87.04 5.76 128 17.28c97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0" />
    </svg>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  const next: Lang = lang === "fr" ? "en" : "fr";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(next)}
      className="h-8 px-2.5 text-xs font-mono font-medium"
    >
      {next.toUpperCase()}
    </Button>
  );
}

interface SiteHeaderProps {
  backHref?: string;
  modelCount?: number;
}

export function SiteHeader({ backHref, modelCount }: SiteHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center gap-3">
        {backHref ? (
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link href={backHref} className="flex items-center gap-1.5">
              <ChevronLeft className="size-4" />
              {t.nav.back}
            </Link>
          </Button>
        ) : (
          <Link href="/" className="flex items-center gap-2 mr-2">
            <Brain className="size-5" />
            <span className="font-semibold text-sm">{t.brand}</span>
          </Link>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {modelCount !== undefined && (
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
              {t.grid.results(modelCount, modelCount)}
            </span>
          )}

          {/* Données source */}
          <a
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" />
            <span className="hidden sm:inline">{t.nav.source}</span>
          </a>

          <a
            href="https://openrouter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" />
            <span className="hidden sm:inline">OpenRouter</span>
          </a>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Feedback */}
          <a
            href="https://github.com/scorpion7slayer/nxtaicard/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquarePlus className="size-3" />
            <span className="hidden sm:inline">{t.nav.feedback}</span>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/scorpion7slayer/nxtaicard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <GithubIcon className="size-4" />
          </a>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Préférences */}
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
