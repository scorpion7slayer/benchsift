import { Link } from "@/components/link";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "@/components/brand-mark";
import { ExternalLink } from "@/components/icons";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent";

export function SiteFooter() {
  const { t } = useI18n();
  return <footer className="site-footer border-t bg-card/40">
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-5 sm:px-6 sm:pt-10 lg:px-8">
      <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold"><BrandMark className="size-7" />BenchSift</Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{t.footer.description}</p>
          <a href="https://github.com/scorpion7slayer/benchsift" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm">GitHub<ExternalLink className="size-4" /></a>
        </div>
        <nav aria-label={t.footer.explore}>
          <h2 className="mb-2 text-sm font-semibold">{t.footer.explore}</h2>
          <ul className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground sm:grid-cols-1">
            <li><Link href="/">{t.mobile.ranking}</Link></li>
            <li><Link href="/compare">{t.compare.compare}</Link></li>
            <li><Link href="/about">{t.nav.about}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.footer.sources}>
          <h2 className="mb-2 text-sm font-semibold">{t.footer.sources}</h2>
          <ul className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground sm:grid-cols-1">
            {[["Artificial Analysis", "https://artificialanalysis.ai/"], ["OpenRouter", "https://openrouter.ai/"], ["Models.dev", "https://models.dev/"], ["Hugging Face", "https://huggingface.co/"]].map(([name, href]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{name}</a></li>)}
          </ul>
        </nav>
      </div>
      <div className="mt-7 flex flex-col gap-4 border-t pt-4 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <p className="flex flex-wrap items-center gap-x-3"><a href="https://github.com/scorpion7slayer" target="_blank" rel="noopener noreferrer">© scorpion7slayer</a><span aria-hidden="true">·</span><a href="https://github.com/scorpion7slayer/benchsift/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a></p>
        <nav aria-label={t.trust.legal} className="grid grid-cols-2 gap-x-5 sm:flex sm:flex-wrap sm:items-center">
          <Link href="/privacy">{t.trust.privacy}</Link><Link href="/legal">{t.trust.legal}</Link><Link href="/accessibility">{t.trust.accessibility}</Link><AnalyticsPreferencesButton />
        </nav>
      </div>
    </div>
  </footer>;
}
