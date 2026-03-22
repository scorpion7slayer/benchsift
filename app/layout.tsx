import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
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
      {children}
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
      </body>
    </html>
  );
}
