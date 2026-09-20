import { Link } from "@/components/link";
import { useI18n } from "@/lib/i18n";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        {/* Mobile: 2 colonnes, Desktop: ligne unique */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:items-center sm:justify-between">
          <span>
            {t.footer.via}{" "}
            <a
              href="https://artificialanalysis.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Artificial Analysis
            </a>
            {" & "}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              OpenRouter
            </a>
          </span>
          <a
            href="https://github.com/scorpion7slayer"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors text-right sm:text-left"
          >
            © scorpion7slayer
          </a>
          <a
            href="https://github.com/scorpion7slayer/benchsift/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            MIT License
          </a>
        </div>
        <nav aria-label={t.trust.legal} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t pt-3">
          <Link href="/privacy" className="hover:text-foreground">{t.trust.privacy}</Link>
          <AnalyticsPreferencesButton />
          <Link href="/legal" className="hover:text-foreground">{t.trust.legal}</Link>
          <Link href="/accessibility" className="hover:text-foreground">{t.trust.accessibility}</Link>
          <a href="https://models.dev/" target="_blank" rel="noreferrer" className="hover:text-foreground">Models.dev</a>
          <a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="hover:text-foreground">Hugging Face</a>
        </nav>
      </div>
    </footer>
  );
}
