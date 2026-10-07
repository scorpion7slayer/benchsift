/// <reference types="vite/client" />
import {
  Asset,
  Outlet,
  createRootRoute,
  Scripts,
  useRouter,
  useTags,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { RouteError } from "@/components/error-page";
import { WebMcpProvider } from "@/components/webmcp-provider";
import { fetchPreferences } from "@/lib/server-fns";
import { useI18n } from "@/lib/i18n";
import { SITE_NAME, seo, websiteJsonLd } from "@/lib/seo";
import appCss from "../styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      ...seo({
        title: SITE_NAME,
        path: "/",
        jsonLd: websiteJsonLd(),
      }).meta,
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // The text font is discovered only once the stylesheet parses; preloading
      // it saves a round trip on slow connections. Geist Mono stays lazy.
      { rel: "preload", href: "/fonts/Geist.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "48x48",
        href: "/favicon-97b25adc-48.png",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        sizes: "any",
        href: "/favicon-97b25adc.svg",
      },

    ],
  }),
  // Reads language/theme cookies so the document renders with the right
  // preferences on the server (replaces the Next.js `cookies()` call).
  loader: async () => fetchPreferences(),
  errorComponent: (props) => (
    <RootDocument>
      <Providers initialLang="en" initialTheme="system">
        <RouteError {...props} />
      </Providers>
    </RootDocument>
  ),
  component: RootComponent,
});

function RootComponent() {
  const { lang, theme, analyticsConsent } = Route.useLoaderData();
  return (
    <RootDocument lang={lang}>
      <Providers initialLang={lang} initialTheme={theme} initialAnalyticsConsent={analyticsConsent}>
        <SkipLink />
        <PageTransitionProvider>
          <Outlet />
        </PageTransitionProvider>
        <WebMcpProvider />
      </Providers>
    </RootDocument>
  );
}

function RootDocument({
  children,
  lang = "en",
}: {
  children: ReactNode;
  lang?: string;
}) {
  return (
    <html lang={lang} className="h-full" suppressHydrationWarning>
      <head>
        <DocumentHead />

      </head>
      <body
        className="min-h-full flex flex-col bg-background antialiased"
        suppressHydrationWarning
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * HeadContent, except that route chunks preload at low priority: the
 * server-rendered page is readable before they run, so the stylesheet, fonts
 * and images it shows first get the bandwidth.
 */
function DocumentHead() {
  const tags = useTags();
  const nonce = useRouter().options.ssr?.nonce;
  return (
    <>
      {tags.map((tag) => {
        const key = `tsr-meta-${JSON.stringify(tag)}`;
        const preload = tag.tag === "link" && tag.attrs?.rel === "modulepreload";
        return <Asset {...tag} attrs={preload ? { ...tag.attrs, fetchPriority: "low" } : tag.attrs} key={key} nonce={nonce} />;
      })}
    </>
  );
}

function SkipLink() { const { t } = useI18n(); return <a href="#main-content" className="skip-link">{t.trust.skip}</a>; }
