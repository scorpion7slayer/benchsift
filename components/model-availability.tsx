import { ExternalLink, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import {
  ANTHROPIC_FABLE_ACCESS_ARTICLE,
  isClaudeFable5,
  isModelCurrentlyUnavailable,
} from "@/lib/model-availability";
import type { LLMModel } from "@/lib/api";

function CheckeredMark({ className = "size-3" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 rounded-sm bg-muted ${className}`}
      style={{
        backgroundImage:
          "repeating-conic-gradient(rgb(160,160,160) 0% 25%, transparent 0% 50%)",
        backgroundSize: "6px 6px",
      }}
    />
  );
}

export function ModelAvailabilityBadge({
  model,
}: {
  model: Pick<LLMModel, "availability_status">;
}) {
  const { t } = useI18n();
  if (!isModelCurrentlyUnavailable(model)) return null;

  return (
    <Badge
      variant="outline"
      className="gap-1.5 bg-muted/40 text-xs font-medium text-muted-foreground"
    >
      <CheckeredMark />
      {t.card.unavailableBadge}
    </Badge>
  );
}

export function ModelAvailabilityNotice({
  model,
}: {
  model: Pick<LLMModel, "slug" | "availability_status">;
}) {
  const { t } = useI18n();
  if (!isModelCurrentlyUnavailable(model)) return null;

  const isFable = isClaudeFable5(model.slug);

  return (
    <Card className="border-dashed">
      <CardContent className="flex gap-3 py-4">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <TriangleAlert className="size-4 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <CheckeredMark className="h-3 w-4" />
            {t.detail.unavailableTitle}
          </div>
          <p className="text-muted-foreground">
            {isFable
              ? t.detail.fableUnavailableDescription
              : t.detail.unavailableDescription}
          </p>
          {isFable && (
            <a
              href={ANTHROPIC_FABLE_ACCESS_ARTICLE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
            >
              {t.detail.unavailableSource}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
