"use client";

import { useRouter } from "next/navigation";
import { X, GitCompareArrows, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import type { LLMModel } from "@/lib/api";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getProviderKey } from "@/lib/provider-map";

export function CompareBar({ models }: { models: LLMModel[] }) {
  const { selected, toggle, clear } = useCompare();
  const { t } = useI18n();
  const router = useRouter();

  if (selected.length === 0) return null;

  const selectedModels = selected
    .map((slug) => models.find((m) => m.slug === slug))
    .filter(Boolean) as LLMModel[];

  function handleCompare() {
    router.push(`/compare?models=${selected.join(",")}`);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Modèles sélectionnés */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
          {selectedModels.map((model) => (
            <div
              key={model.slug}
              className="flex items-center gap-1 sm:gap-1.5 bg-muted rounded-md px-1.5 sm:px-2 py-1 shrink-0"
            >
              <div className="size-5 flex items-center justify-center shrink-0">
                <ModelProviderIcon provider={getProviderKey(model.model_creator.slug)} size={16} />
              </div>
              {/* Nom visible uniquement sur sm+ */}
              <span className="hidden sm:block text-xs font-medium max-w-[120px] truncate">
                {model.name}
              </span>
              <button
                onClick={() => toggle(model.slug)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Retirer ${model.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <span className="text-xs text-muted-foreground shrink-0">
            {selected.length} {t.compare.select}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end sm:justify-start">
          <Button variant="ghost" size="sm" onClick={clear} className="h-8 gap-1.5 flex-1 sm:flex-none">
            <Trash2 className="size-3.5" />
            <span className="sm:hidden">{t.compare.clear}</span>
            <span className="hidden sm:inline">{t.compare.clear}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="h-8 gap-1.5 flex-1 sm:flex-none"
          >
            <GitCompareArrows className="size-3.5" />
            {t.compare.compare}
          </Button>
        </div>
      </div>
    </div>
  );
}
