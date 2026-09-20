import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animateContent } from "@/lib/content-motion";

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname,
  });
  const root = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  useEffect(() => {
    animation.current = animateContent(
      root.current?.querySelector("main") ?? null,
      animation.current,
    );
    return () => animation.current?.cancel();
  }, [pathname]);

  return (
    <div ref={root} className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
