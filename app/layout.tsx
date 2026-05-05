import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nxt AI Card",
  description: "Compare AI models — benchmarks, performance and pricing",
};

// connection() garantit que ce composant est toujours rendu dynamiquement
// (par requête), même avec cacheComponents: true.
async function PreferencesLoader({ children }: { children: React.ReactNode }) {
  await connection();
  const cookieStore = await cookies();
  const lang = cookieStore.get("nxtaicard_lang")?.value === "fr" ? "fr" : "en";
  const storedTheme = cookieStore.get("nxtaicard_theme")?.value;
  const theme = ["dark", "light", "system"].includes(storedTheme ?? "") ? storedTheme! : "system";

  return (
    <Providers initialLang={lang} initialTheme={theme}>
      <PageTransitionProvider>{children}</PageTransitionProvider>
      <CookieBanner />
    </Providers>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background antialiased" suppressHydrationWarning>
        <Suspense>
          <PreferencesLoader>{children}</PreferencesLoader>
        </Suspense>
        <Script
          src="https://analyticstheo.serverscorpion1601.site/api/script.js"
          data-site-id="8544cf104129"
          defer
          strategy="beforeInteractive"
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "5bd070922a22443597ba68ce27a345e6"}'
        ></script>
      </body>
    </html>
  );
}
