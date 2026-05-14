import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n";
import { CompareProvider } from "@/lib/compare-store";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: React.ReactNode;
  initialLang?: "fr" | "en";
  initialTheme?: string;
}

export function Providers({ children, initialLang, initialTheme }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme={initialTheme ?? "system"} enableSystem>
      <LanguageProvider initialLang={initialLang}>
        <CompareProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </CompareProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
