import { useRouterState } from "@tanstack/react-router";

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div key={pathname} className="page-transition-frame flex flex-1 flex-col">
      {children}
    </div>
  );
}
