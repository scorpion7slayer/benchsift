import { useEffect, useState } from "react";
import { ArrowUp } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ScrollToTop() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const show = visible && !footerVisible;

  return (
    <Button
      data-scroll-to-top
      variant="outline"
      size="icon"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={cn(
        "touch-target fixed bottom-24 right-4 z-40 size-11 rounded-full shadow-md sm:bottom-6 sm:right-6",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        show
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
