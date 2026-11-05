import { useTheme } from "next-themes";
import { Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/**
 * The theme switches at once: next-themes suspends colour transitions during
 * the swap, so the page and the icon change in one frame.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { lang } = useI18n();

  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.cookie = `benchsift_theme=${next};path=/;max-age=31536000;SameSite=Lax`;
    setTheme(next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={lang === "fr" ? "Changer de thème" : "Toggle theme"}
      className="touch-target relative size-10 sm:size-8"
    >
      <Sun className="size-4 opacity-100 dark:opacity-0" />
      <Moon className="absolute size-4 opacity-0 dark:opacity-100" />
    </Button>
  );
}
