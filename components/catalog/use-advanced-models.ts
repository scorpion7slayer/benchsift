import { useEffect, useRef, useState } from "react";
import type { LLMModel } from "@/lib/model-types";
import { collapseReasoningVariants } from "@/lib/model-reasoning";
import { fetchModels } from "@/lib/server-fns";

/**
 * The full catalogue is heavier than the ranking, so it loads the first time
 * Advanced mode opens and is kept for the rest of the visit.
 */
export function useAdvancedModels(enabled: boolean) {
  const [models, setModels] = useState<LLMModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const request = useRef<Promise<LLMModel[]> | null>(null);

  useEffect(() => {
    if (!enabled || models) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const pending = request.current ?? fetchModels();
    request.current = pending;
    pending
      .then((loaded) => {
        if (!cancelled) setModels(collapseReasoningVariants(loaded));
      })
      .catch(() => {
        request.current = null;
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, models, attempt]);

  function retry() {
    request.current = null;
    setAttempt((value) => value + 1);
  }

  return { models, loading, failed, retry };
}
