import type { JSX } from "react";
import { LOCALES, OG_LOCALE, localizedPath, type Locale } from "./locale";

export const SITE_NAME = "BenchSift";
export const SITE_URL = "https://benchsift.nxtaigen.com";

/** Link preview shared by every page; its source is scripts/og-image.html. */
export const OG_IMAGE = { path: "/og-image.png", width: 1200, height: 630, alt: "BenchSift: compare AI models on real evidence" };

export const DEFAULT_DESCRIPTION =
    "Compare AI models with benchmarks, performance, pricing, coding scores and model capabilities.";

const DEFAULT_DESCRIPTIONS: Record<Locale, string> = {
    en: DEFAULT_DESCRIPTION,
    fr: "Comparez les modèles d'IA : benchmarks, performances, prix, scores de code et capacités.",
};

type JsonLd = Record<string, unknown>;
type MetaTag = JSX.IntrinsicElements["meta"] & {
    title?: string;
    "script:ld+json"?: JsonLd;
};
type LinkTag = JSX.IntrinsicElements["link"];

interface SeoOptions {
    title: string;
    description?: string;
    path?: string;
    type?: "website" | "article";
    jsonLd?: JsonLd | JsonLd[];
    robots?: string;
    /** Language of this version; `path` is the unprefixed page path. */
    lang?: Locale;
}

/** Public URL of a page path in a language: /about, /fr/about. */
export function localizedUrl(path: string, lang: Locale = "en"): string {
    return absoluteUrl(localizedPath(path, lang));
}

/** The hreflang alternates of a page: each language, and English as x-default. */
export function alternateLinks(path: string): LinkTag[] {
    return [
        ...LOCALES.map((locale) => ({ rel: "alternate", hrefLang: locale, href: localizedUrl(path, locale) })),
        { rel: "alternate", hrefLang: "x-default", href: localizedUrl(path, "en") },
    ];
}

export function absoluteUrl(path = "/"): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${normalizedPath}`;
}

export function seo({
    title,
    lang = "en",
    description = DEFAULT_DESCRIPTIONS[lang],
    path = "/",
    type = "website",
    jsonLd,
    robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
}: SeoOptions): { meta: MetaTag[]; links: LinkTag[] } {
    // Absolute paths only; the language prefix comes from `lang`.
    const url = /^https?:\/\//i.test(path) ? path : localizedUrl(path, lang);
    const meta: MetaTag[] = [
        { title },
        { name: "description", content: description },
        {
            name: "robots",
            content: robots,
        },
        { property: "og:type", content: type },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:locale", content: OG_LOCALE[lang] },
        ...LOCALES.filter((locale) => locale !== lang).map((locale) => ({ property: "og:locale:alternate", content: OG_LOCALE[locale] })),
        { property: "og:image", content: absoluteUrl(OG_IMAGE.path) },
        { property: "og:image:width", content: String(OG_IMAGE.width) },
        { property: "og:image:height", content: String(OG_IMAGE.height) },
        { property: "og:image:alt", content: OG_IMAGE.alt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: absoluteUrl(OG_IMAGE.path) },
    ];

    const jsonLdItems = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    for (const item of jsonLdItems) {
        meta.push({ "script:ld+json": item });
    }

    return {
        meta,
        links: [{ rel: "canonical", href: url }, ...(/^https?:\/\//i.test(path) ? [] : alternateLinks(path))],
    };
}

export function websiteJsonLd(lang: Locale = "en") {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: localizedUrl("/", lang),
        description: DEFAULT_DESCRIPTIONS[lang],
        inLanguage: LOCALES,
    };
}

/** schema.org BreadcrumbList from the home page down to the current page. */
export function breadcrumbJsonLd(lang: Locale, items: Array<{ name: string; path: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: localizedUrl(item.path, lang),
        })),
    };
}

interface DatasetOptions {
    lang: Locale;
    path: string;
    name: string;
    description: string;
    /** Who publishes the benchmark results BenchSift reshapes. */
    creator: { name: string; url: string };
    /** The page the results come from. */
    sourceUrl: string;
    measured: string[];
    dateModified?: string | null;
    size?: number;
}

/**
 * schema.org Dataset for a benchmark page: the results as BenchSift shows
 * them, credited to the organisation that measured them.
 */
export function datasetJsonLd({ lang, path, name, description, creator, sourceUrl, measured, dateModified, size }: DatasetOptions) {
    const url = localizedUrl(path, lang);
    return {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name,
        description,
        url,
        inLanguage: lang,
        isAccessibleForFree: true,
        creator: { "@type": "Organization", name: creator.name, url: creator.url },
        publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        isBasedOn: sourceUrl,
        variableMeasured: measured,
        ...(dateModified ? { dateModified } : {}),
        ...(size ? { size: `${size} ${lang === "fr" ? "résultats" : "results"}` } : {}),
        distribution: { "@type": "DataDownload", encodingFormat: "text/html", contentUrl: url },
    };
}
