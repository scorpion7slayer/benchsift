"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
      <Brain className="size-10 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">{t.error.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t.error.description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => unstable_retry()}>
        <RefreshCw className="size-4 mr-2" />
        {t.error.retry}
      </Button>
    </div>
  );
}
