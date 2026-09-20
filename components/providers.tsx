import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n";
import { CompareProvider } from "@/lib/compare-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsConsentProvider } from "@/components/analytics-consent";
import type { AnalyticsConsent } from "@/lib/analytics-consent";

interface ProvidersProps {
  children: React.ReactNode;
  initialLang?: "fr" | "en";
  initialTheme?: string;
  initialAnalyticsConsent?: AnalyticsConsent;
}

export function Providers({ children, initialLang, initialTheme, initialAnalyticsConsent }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme ?? "system"}
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider initialLang={initialLang}>
        <CompareProvider>
          <TooltipProvider><AnalyticsConsentProvider initialConsent={initialAnalyticsConsent}>{children}</AnalyticsConsentProvider></TooltipProvider>
        </CompareProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
