import { useEffect, useMemo, useRef, useState } from "react";
import type { LLMModel } from "@/lib/model-types";
import { enrichComparisonModel } from "@/lib/comparison-models";
import { fetchModelCapabilities } from "@/lib/server-fns";

const MAX_CACHED_REQUESTS = 20;

/**
 * Renders catalogue values immediately, then merges each model's page-level
 * capabilities (parameters, cutoff, openness…) as they arrive. A failed
 * request leaves the catalogue values in place and can be retried later.
 */
export function useComparisonModels(baseModels: LLMModel[]): LLMModel[] {
  const requests = useRef(new Map<string, Promise<Partial<LLMModel>>>());
  const [supplements, setSupplements] = useState<Record<string, Partial<LLMModel>>>({});

  useEffect(() => {
    let cancelled = false;
    const selected = new Set(baseModels.map((model) => model.slug));
    setSupplements((current) =>
      Object.fromEntries(Object.entries(current).filter(([slug]) => selected.has(slug))),
    );
    for (const model of baseModels) {
      let request = requests.current.get(model.slug);
      if (!request) {
        request = fetchModelCapabilities({ data: model.slug });
        if (requests.current.size >= MAX_CACHED_REQUESTS) {
          requests.current.delete(requests.current.keys().next().value!);
        }
        requests.current.set(model.slug, request);
      }
      const pending = request;
      pending
        .then((extra) => {
          if (!cancelled) setSupplements((current) => ({ ...current, [model.slug]: extra }));
        })
        .catch(() => {
          if (requests.current.get(model.slug) === pending) requests.current.delete(model.slug);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [baseModels]);

  return useMemo(
    () => baseModels.map((model) => enrichComparisonModel(model, supplements[model.slug])),
    [baseModels, supplements],
  );
}
