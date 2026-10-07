import { useRef, useState } from "react";
import { Link } from "@/components/link";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  Coffee,
  ExternalLink,
  Info,
  LibraryBig,
  Menu,
  MessageSquarePlus,
  PanelsTopLeft,
  Terminal,
} from "@/components/icons";
import { MobileSheet } from "@/components/mobile-sheet";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
      className="touch-target h-10 px-2.5 text-xs font-mono font-medium sm:h-8"
    >
      <span key={next} className="language-label">{next.toUpperCase()}</span>
    </Button>
  );
}

interface SiteHeaderProps {
  backHref?: string;
  modelCount?: number;
}

export function SiteHeader({ backHref, modelCount }: SiteHeaderProps) {
  const { t, lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center gap-3">
        {/* Logo ou bouton retour */}
        {backHref ? (
          <Button variant="ghost" size="sm" asChild className="touch-target h-8 px-2">
            <Link href={backHref} className="flex items-center gap-1.5">
              <ChevronLeft className="size-4" />
              {t.nav.back}
            </Link>
          </Button>
        ) : (
          <Link href="/" className="flex min-h-10 items-center gap-2 mr-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark className="size-5" />
            <span className="font-semibold text-sm">{t.brand}</span>
          </Link>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {modelCount !== undefined && (
            <span className="mr-1 hidden text-xs text-muted-foreground xl:inline">
              {t.grid.results(modelCount, modelCount)}
            </span>
          )}

          {/* Liens internes + externes — desktop uniquement */}
          <nav aria-label={lang === "fr" ? "Navigation principale" : "Primary navigation"} className="hidden items-center gap-1 lg:flex">
            <Link
              href="/models"
              className="flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[status=active]:text-foreground"
            >
              <LibraryBig className="size-3" />
              {t.nav.allModels}
            </Link>
            <Link
              href="/about"
              className="flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[status=active]:text-foreground"
            >
              <Info className="size-3" />
              {t.nav.about}
            </Link>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-1.5 text-xs font-normal text-muted-foreground"
                >
                  <PanelsTopLeft data-icon="inline-start" />
                  {t.nav.otherBenchmarks}
                  <ChevronDown
                    data-icon="inline-end"
                    className="transition-transform duration-150 ease-out group-data-[state=open]/button:rotate-180 motion-reduce:transition-none"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/agents/coding">
                      <Terminal />
                      {t.nav.codingAgents}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/benchmarks/deepswe">
                      <Activity />
                      {t.nav.deepSwe}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-1.5 text-xs font-normal text-muted-foreground"
                >
                  {t.nav.dataSources}
                  <ChevronDown
                    data-icon="inline-end"
                    className="transition-transform duration-150 ease-out group-data-[state=open]/button:rotate-180 motion-reduce:transition-none"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <a href="https://artificialanalysis.ai" target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      {t.nav.source}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      OpenRouter
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://models.dev/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      Models.dev
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      {t.nav.huggingFace}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1" />
            <a
              href="https://buymeacoffee.com/scorpion7slayer"
              target="_blank"
              rel="noopener noreferrer"
              title={t.nav.buyMeACoffee}
              className="flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Coffee className="size-3" />
              <span className="sr-only xl:not-sr-only">{t.nav.buyMeACoffee}</span>
            </a>
            <a
              href="https://github.com/scorpion7slayer/benchsift/issues"
              target="_blank"
              rel="noopener noreferrer"
              title={t.nav.feedback}
              className="flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <MessageSquarePlus className="size-3" />
              <span className="sr-only xl:not-sr-only">{t.nav.feedback}</span>
            </a>
            <a
              href="https://github.com/scorpion7slayer/benchsift"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label="GitHub"
            >
              <GithubIcon className="size-4" />
            </a>
            <div className="w-px h-4 bg-border mx-1" />
          </nav>

          {/* Préférences — toujours visibles */}
          <LangToggle />
          <ThemeToggle />

          {/* Bouton hamburger — mobile uniquement */}
          <button
            ref={menuButton}
            type="button"
            className="touch-target flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen
              ? lang === "fr" ? "Fermer le menu" : "Close menu"
              : lang === "fr" ? "Ouvrir le menu" : "Open menu"}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <MobileSheet open={menuOpen} onOpenChange={setMenuOpen} title={t.brand} returnFocus={menuButton} placement="right">
        <nav aria-label={lang === "fr" ? "Navigation mobile" : "Mobile navigation"} className="grid gap-1 p-3">
          <p className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.footer.explore}</p>
          <Link href="/" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm font-medium"><BrandMark className="size-5" />{t.mobile.catalog}</Link>
          <Link href="/compare" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><PanelsTopLeft className="size-5" />{t.compare.compare}</Link>
          <div className="my-2 border-t" />
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nav.otherBenchmarks}</p>
          <Link href="/agents/coding" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><Terminal className="size-5" />{t.nav.codingAgents}</Link>
          <Link href="/benchmarks/deepswe" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><Activity className="size-5" />{t.nav.deepSwe}</Link>
          <div className="my-2 border-t" />
          <Link href="/models" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><LibraryBig className="size-5" />{t.nav.allModels}</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><Info className="size-5" />{t.nav.about}</Link>
          <a href="https://github.com/scorpion7slayer/benchsift/issues" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"><MessageSquarePlus className="size-5" />{t.nav.feedback}</a>
        </nav>
      </MobileSheet>
    </header>
  );
}
