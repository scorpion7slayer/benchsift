import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { lang } = useI18n();

  function toggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const html = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      html.classList.remove("theme-transitioning");
      void html.offsetWidth;
      html.classList.add("theme-transitioning");
    }

    setTheme(next);
    document.cookie = `benchsift_theme=${next};path=/;max-age=31536000;SameSite=Lax`;

    if (!reduceMotion) {
      window.setTimeout(() => html.classList.remove("theme-transitioning"), 200);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={lang === "fr" ? "Changer de thème" : "Toggle theme"}
      className="touch-target relative size-10 sm:size-8"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
