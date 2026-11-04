/*
 * Language in the URL: English pages live at the root, French pages under /fr.
 * The router strips the prefix before matching, so both languages share one
 * route tree, and adds it back to every link it builds on a French page.
 */

export type Locale = "en" | "fr";

export const LOCALES: readonly Locale[] = ["en", "fr"];
export const DEFAULT_LOCALE: Locale = "en";

/** Open Graph locale codes. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", fr: "fr_FR" };

/**
 * Paths that are not translated pages: files, feeds, APIs and agent
 * documents. They are served at the root only, so /fr/<one of these> is a 404.
 */
const UNLOCALIZED = /^\/(?:_serverFn|api|assets|logos|fonts|_build|\.well-known|docs|health|sitemap\.xml|robots\.txt|auth\.md|og-image\.png|favicon[^/]*)(?:\/|$)/i;

export function isLocalizablePath(pathname: string): boolean {
  return !UNLOCALIZED.test(pathname);
}

/** The language a public path is in and the path without its prefix. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const match = pathname.match(/^\/fr(?=\/|$)/i);
  if (!match) return { locale: "en", path: pathname || "/" };
  const path = pathname.slice(match[0].length) || "/";
  // /fr/api/... is not a French page; leave it unmatched.
  if (!isLocalizablePath(path)) return { locale: "en", path: pathname };
  return { locale: "fr", path };
}

export function localeFromPath(pathname: string): Locale {
  return splitLocale(pathname).locale;
}

/** The public path of an unprefixed page path in a language. */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en" || !isLocalizablePath(clean)) return clean;
  if (/^\/fr(?:[/?#]|$)/i.test(clean)) return clean;
  // The home page is /fr, never /fr/, with or without a query.
  return /^\/(?:[?#]|$)/.test(clean) ? `/fr${clean.slice(1)}` : `/fr${clean}`;
}

/** The same public href (path, query and hash) in another language. */
export function switchLocaleHref(publicHref: string, locale: Locale): string {
  const url = new URL(publicHref, "http://localhost");
  const { path } = splitLocale(url.pathname);
  return `${localizedPath(path, locale)}${url.search}${url.hash}`;
}

/**
 * Router URL rewrite. `input` reads the language from the address and hands
 * the router the unprefixed path; `output` prefixes the links built while a
 * French page is open. Each router instance (one per server request, one in
 * the browser) keeps the language of the page it rendered; switching language
 * loads the other document, so the value never changes under rendered links.
 */
export function createLocaleRewrite() {
  let current: Locale = DEFAULT_LOCALE;
  return {
    rewrite: {
      input: ({ url }: { url: URL }) => {
        const { locale, path } = splitLocale(url.pathname);
        current = locale;
        if (locale === "en") return undefined;
        url.pathname = path;
        return url;
      },
      output: ({ url }: { url: URL }) => {
        if (current === "en") return undefined;
        url.pathname = localizedPath(url.pathname, current);
        return url;
      },
    },
    locale: () => current,
  };
}

/** The language the visitor asked for: their saved choice, else the browser's. */
export function preferredLocale(savedChoice: string | undefined, browserLanguages: readonly string[]): Locale {
  if (savedChoice === "fr" || savedChoice === "en") return savedChoice;
  for (const language of browserLanguages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "fr") return "fr";
    if (base === "en") return "en";
  }
  return DEFAULT_LOCALE;
}
