import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ScrollToTop() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "touch-target fixed bottom-6 right-6 z-50 size-11 rounded-full shadow-md",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-2 scale-95 pointer-events-none"
      )}
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })}
      aria-label={lang === "fr" ? "Retour en haut" : "Back to top"}
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
