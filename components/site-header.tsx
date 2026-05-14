import { useState } from "react";
import { Link } from "@/components/link";
import { Brain, ExternalLink, ChevronLeft, MessageSquarePlus, Menu, X, Terminal } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center gap-3">
        {/* Logo ou bouton retour */}
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

          {/* Liens internes + externes — desktop uniquement */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/agents/coding"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Terminal className="size-3" />
              {t.nav.codingAgents}
            </Link>
            <div className="w-px h-4 bg-border mx-1" />
            <a
              href="https://artificialanalysis.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              {t.nav.source}
            </a>
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              OpenRouter
            </a>
            <div className="w-px h-4 bg-border mx-1" />
            <a
              href="https://github.com/scorpion7slayer/nxtaicard/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquarePlus className="size-3" />
              {t.nav.feedback}
            </a>
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
          </div>

          {/* Préférences — toujours visibles */}
          <LangToggle />
          <ThemeToggle />

          {/* Bouton hamburger — mobile uniquement */}
          <button
            className="sm:hidden flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu déroulant mobile */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-card/95 backdrop-blur px-4 py-3 flex flex-col gap-4 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <Link
            href="/agents/coding"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <Terminal className="size-4 shrink-0" />
            {t.nav.codingAgents}
          </Link>
          <a
            href="https://artificialanalysis.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <ExternalLink className="size-4 shrink-0" />
            {t.nav.source}
          </a>
          <a
            href="https://openrouter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <ExternalLink className="size-4 shrink-0" />
            OpenRouter
          </a>
          <a
            href="https://github.com/scorpion7slayer/nxtaicard/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <MessageSquarePlus className="size-4 shrink-0" />
            {t.nav.feedback}
          </a>
          <a
            href="https://github.com/scorpion7slayer/nxtaicard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <GithubIcon className="size-4 shrink-0" />
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}
