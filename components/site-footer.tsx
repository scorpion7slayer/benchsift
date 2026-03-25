"use client";

import { Cloudflare } from "@lobehub/icons";
import { useI18n } from "@/lib/i18n";

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
            href="https://github.com/scorpion7slayer/nxtaicard/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            MIT License
          </a>
          <a
            href="https://www.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors text-right sm:text-left justify-end sm:justify-start"
          >
            <Cloudflare.Color size={14} />
            Powered by Cloudflare
          </a>
        </div>
      </div>
    </footer>
  );
}
