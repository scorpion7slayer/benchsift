import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { runViewTransition } from "@/lib/view-transition";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { lang } = useI18n();
  const activeTransitionRef = useRef<ViewTransition | null>(null);
  const requestId = useRef(0);
  const pendingThemeRef = useRef<"light" | "dark" | null>(null);
  const finishThemeWaitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (resolvedTheme === pendingThemeRef.current)
      pendingThemeRef.current = null;
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
        if (finishThemeWaitRef.current === finish)
          finishThemeWaitRef.current = null;
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

  useEffect(
    () => () => {
      requestId.current++;
      finishThemeWaitRef.current?.();
      activeTransitionRef.current?.skipTransition();
    },
    [],
  );

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const id = ++requestId.current;
    const html = document.documentElement;
    const currentTheme =
      pendingThemeRef.current ??
      (html.classList.contains("dark") ? "dark" : resolvedTheme);
    const next = currentTheme === "dark" ? "light" : "dark";
    pendingThemeRef.current = next;
    document.cookie = `benchsift_theme=${next};path=/;max-age=31536000;SameSite=Lax`;
    finishThemeWaitRef.current?.();
    activeTransitionRef.current?.skipTransition();

    // The new theme grows from the button (or its centre for keyboard use).
    const bounds = event.currentTarget.getBoundingClientRect();
    const origin = event.clientX || event.clientY
      ? { x: event.clientX, y: event.clientY }
      : { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    const transition = runViewTransition("theme", async () => {
      if (id !== requestId.current) return;
      setTheme(next);
      await waitForThemeClass(next);
    }, origin);
    activeTransitionRef.current = transition;
    void transition?.finished
      .catch(() => undefined)
      .finally(() => {
        if (activeTransitionRef.current === transition) activeTransitionRef.current = null;
      });
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
