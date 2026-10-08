import { ExternalLink, TriangleAlert } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import {
  AA_TRUSTED_ACCESS_ARTICLE,
  ANTHROPIC_FABLE_ACCESS_ARTICLE,
  isClaudeFable5,
  modelAccessRestriction,
  type ModelAccessRestriction,
} from "@/lib/model-availability";
import type { LLMModel } from "@/lib/model-types";
import { cn } from "@/lib/utils";

/** The checkered pattern Artificial Analysis uses for models that are not publicly available. */
export function CheckeredMark({ className = "size-3" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 rounded-sm bg-muted", className)}
      style={{
        backgroundImage:
          "repeating-conic-gradient(rgb(160,160,160) 0% 25%, transparent 0% 50%)",
        backgroundSize: "6px 6px",
      }}
    />
  );
}

/**
 * Marks a model the public cannot use. Lists use the compact label; the model
 * page spells it out. The definition is available on hover and to screen readers.
 */
export function AccessRestrictionBadge({
  restriction,
  compact = false,
  className,
}: {
  restriction: ModelAccessRestriction | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  if (!restriction) return null;
  const trusted = restriction === "trusted_access";
  const label = trusted ? t.card.trustedAccessBadge : compact ? t.card.notPublicBadge : t.card.unavailableBadge;
  const definition = trusted ? t.glossary.trustedAccess : t.glossary.notPublic;

  return (
    <Badge
      variant="outline"
      title={definition}
      className={cn(
        "gap-1.5 border-foreground/25 bg-muted/60 font-medium text-foreground",
        compact ? "h-5 rounded px-1.5 text-[10px] leading-4" : "text-xs",
        className,
      )}
    >
      <CheckeredMark />
      {label}
      <span className="sr-only">. {definition}</span>
    </Badge>
  );
}

export function ModelAvailabilityBadge({
  model,
  compact,
  className,
}: {
  model: Pick<LLMModel, "availability_status" | "cyber_index_result">;
  compact?: boolean;
  className?: string;
}) {
  return <AccessRestrictionBadge restriction={modelAccessRestriction(model)} compact={compact} className={className} />;
}

export function ModelAvailabilityNotice({
  model,
}: {
  model: Pick<LLMModel, "slug" | "availability_status" | "cyber_index_result">;
}) {
  const { t } = useI18n();
  const restriction = modelAccessRestriction(model);
  if (!restriction) return null;

  const trusted = restriction === "trusted_access";
  const isFable = !trusted && isClaudeFable5(model.slug);
  const source = trusted
    ? { href: AA_TRUSTED_ACCESS_ARTICLE, label: t.detail.trustedAccessSource }
    : isFable
      ? { href: ANTHROPIC_FABLE_ACCESS_ARTICLE, label: t.detail.unavailableSource }
      : null;

  return (
    <Card className="border-dashed">
      <CardContent className="flex gap-3 py-4">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <TriangleAlert className="size-4 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <CheckeredMark className="h-3 w-4" />
            {trusted ? t.cyber.legend.trustedAccess : t.detail.unavailableTitle}
          </div>
          <p className="text-muted-foreground">
            {trusted
              ? t.glossary.trustedAccess
              : isFable
                ? t.detail.fableUnavailableDescription
                : t.detail.unavailableDescription}
          </p>
          {source && (
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
            >
              {source.label}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
