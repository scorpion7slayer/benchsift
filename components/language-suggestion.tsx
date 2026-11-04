import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { translationsFor, useI18n, type Lang } from "@/lib/i18n";
import { readCookieValue } from "@/lib/http-cookie";
import { preferredLocale, switchLocaleHref } from "@/lib/locale";

const COOKIE = "benchsift_lang";

/**
 * Offers the visitor's language when the page is in the other one. It only
 * suggests: nothing redirects, so crawlers and shared links get the language
 * of the address. Read after hydration, since it depends on the browser.
 */
export function LanguageSuggestion() {
  const { lang, setLang } = useI18n();
  const publicHref = useRouterState({ select: (state) => state.location.publicHref });
  const [suggested, setSuggested] = useState<Lang | null>(null);

  useEffect(() => {
    let saved: string | undefined;
    try { saved = readCookieValue(document.cookie, COOKIE); } catch { saved = undefined; }
    const preferred = preferredLocale(saved, navigator.languages ?? [navigator.language]);
    setSuggested(preferred === lang ? null : preferred);
  }, [lang]);

  if (!suggested) return null;
  const copy = translationsFor(suggested).langSuggestion;
  const dismiss = () => {
    // Staying is a choice too: remember it so the offer does not come back.
    document.cookie = `${COOKIE}=${lang};path=/;max-age=31536000;SameSite=Lax`;
    setSuggested(null);
  };

  return (
    <div role="region" aria-label={copy.message} lang={suggested} className="border-b bg-muted/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="min-w-0 flex-1 text-muted-foreground">{copy.message}</p>
        <Button asChild size="sm" variant="secondary" className="touch-target">
          <a
            href={switchLocaleHref(publicHref, suggested)}
            hrefLang={suggested}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              setLang(suggested);
            }}
          >
            {copy.action}
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="touch-target size-8" onClick={dismiss} aria-label={copy.dismiss} title={copy.dismiss}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
