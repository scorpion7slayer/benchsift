/// <reference types="vite/client" />
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { fetchPreferences } from "@/lib/server-fns";
import appCss from "../styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nxt AI Card" },
      {
        name: "description",
        content: "Compare AI models — benchmarks, performance and pricing",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
      },
    ],
  }),
  // Reads language/theme cookies so the document renders with the right
  // preferences on the server (replaces the Next.js `cookies()` call).
  loader: async () => fetchPreferences(),
  errorComponent: (props) => (
    <RootDocument>
      <Providers initialLang="en" initialTheme="system">
        <DefaultCatchBoundary {...props} />
      </Providers>
    </RootDocument>
  ),
  component: RootComponent,
});

function RootComponent() {
  const { lang, theme } = Route.useLoaderData();
  return (
    <RootDocument lang={lang}>
      <Providers initialLang={lang} initialTheme={theme}>
        <PageTransitionProvider>
          <Outlet />
        </PageTransitionProvider>
        <CookieBanner />
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
        <HeadContent />
        {/* Third-party analytics — kept in <head> so they load before hydration. */}
        <script
          src="https://analyticstheo.serverscorpion1601.site/api/script.js"
          data-site-id="8544cf104129"
          defer
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "5bd070922a22443597ba68ce27a345e6"}'
        />
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
