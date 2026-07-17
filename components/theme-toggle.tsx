import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { lang } = useI18n();
  const activeTransitionRef = useRef<ViewTransition | null>(null);
  const pendingThemeRef = useRef<"light" | "dark" | null>(null);
  const finishThemeWaitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (resolvedTheme === pendingThemeRef.current) pendingThemeRef.current = null;
  }, [resolvedTheme]);

  function waitForThemeClass(theme: "light" | "dark") {
    const html = document.documentElement;
    const expectsDark = theme === "dark";

    return new Promise<void>((resolve) => {
      const isApplied = () => html.classList.contains("dark") === expectsDark;
      if (isApplied()) {
        resolve();
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(fallbackTimer);
        if (finishThemeWaitRef.current === finish) finishThemeWaitRef.current = null;
        resolve();
      };
      const observer = new MutationObserver(() => {
        if (isApplied()) finish();
      });
      const fallbackTimer = window.setTimeout(finish, 250);
      observer.observe(html, { attributes: true, attributeFilter: ["class"] });
      finishThemeWaitRef.current = finish;
    });
  }

  function toggle() {
    const html = document.documentElement;
    const currentTheme = pendingThemeRef.current
      ?? (html.classList.contains("dark") ? "dark" : resolvedTheme);
    const next = currentTheme === "dark" ? "light" : "dark";
    pendingThemeRef.current = next;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.cookie = `benchsift_theme=${next};path=/;max-age=31536000;SameSite=Lax`;
    finishThemeWaitRef.current?.();

    if (reduceMotion || typeof document.startViewTransition !== "function") {
      activeTransitionRef.current?.skipTransition();
      activeTransitionRef.current = null;
      setTheme(next);
      return;
    }

    activeTransitionRef.current?.skipTransition();

    try {
      const transition = document.startViewTransition(async () => {
        setTheme(next);
        await waitForThemeClass(next);
      });
      activeTransitionRef.current = transition;
      void transition.finished
        .catch(() => undefined)
        .finally(() => {
          if (activeTransitionRef.current === transition) {
            activeTransitionRef.current = null;
          }
        });
    } catch {
      activeTransitionRef.current = null;
      setTheme(next);
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
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-200 motion-reduce:transition-none dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-200 motion-reduce:transition-none dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
