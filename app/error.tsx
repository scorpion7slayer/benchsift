"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const RETRY_DELAY = 60;

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { t } = useI18n();
  const isRateLimit = error.message.includes("429");
  const [countdown, setCountdown] = useState(isRateLimit ? RETRY_DELAY : 0);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    if (countdown <= 0) {
      if (isRateLimit) unstable_retry();
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, isRateLimit, unstable_retry]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
      <Brain className="size-10 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">{t.error.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {isRateLimit ? t.error.rateLimitDescription(countdown) : t.error.description}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setCountdown(0); unstable_retry(); }}
        disabled={countdown > 0}
      >
        <RefreshCw className="size-4 mr-2" />
        {countdown > 0 ? `${t.error.retry} (${countdown}s)` : t.error.retry}
      </Button>
    </div>
  );
}
