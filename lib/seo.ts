import type { JSX } from "react";

export const SITE_NAME = "BenchSift";
export const SITE_URL = "https://benchsift.nxtaigen.com";

/** Link preview shared by every page; its source is scripts/og-image.html. */
export const OG_IMAGE = { path: "/og-image.png", width: 1200, height: 630, alt: "BenchSift: compare AI models on real evidence" };

export const DEFAULT_DESCRIPTION =
    "Compare AI models with benchmarks, performance, pricing, coding scores and model capabilities.";

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
}

export function absoluteUrl(path = "/"): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${normalizedPath}`;
}

export function seo({
    title,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    type = "website",
    jsonLd,
    robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
}: SeoOptions): { meta: MetaTag[]; links: LinkTag[] } {
    const url = absoluteUrl(path);
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
        links: [{ rel: "canonical", href: url }],
    };
}

export function websiteJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: DEFAULT_DESCRIPTION,
    };
}
