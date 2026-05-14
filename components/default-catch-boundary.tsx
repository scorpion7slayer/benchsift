import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

// Replaces the Next.js `app/error.tsx` route-level error boundary.
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isRateLimit = error.message.includes("429");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-4 p-8 text-center">
      <Brain className="size-10 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">{t.error.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {isRateLimit ? t.error.rateLimitDescription(0) : t.error.description}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void router.invalidate();
        }}
      >
        <RefreshCw className="size-4 mr-2" />
        {t.error.retry}
      </Button>
    </div>
  );
}
