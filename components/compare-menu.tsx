import { Link as RouterLink } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CompareMenu({
  variant = "default",
}: {
  variant?: "default" | "bubble";
}) {
  const { t } = useI18n();
  const { selected } = useCompare();
  const isBubble = variant === "bubble";
  const search = selected.length > 0 ? { models: selected.join(",") } : {};
  const label = `${t.compare.compare} · ${selected.length} ${t.compare.select}`;

  return (
    <Button
      asChild
      variant={isBubble ? "default" : "outline"}
      size={isBubble ? "icon-lg" : "default"}
      className={cn(
        "touch-target transition-[color,background-color,border-color,box-shadow,transform] duration-150",
        isBubble
          ? "size-11 rounded-full shadow-md hover:shadow-lg"
          : "h-9 active:scale-[0.96]",
      )}
    >
      <RouterLink
        to="/compare"
        search={search}
        aria-label={isBubble ? label : undefined}
      >
        <GitCompareArrows data-icon={isBubble ? undefined : "inline-start"} />
        {!isBubble && t.compare.compare}
        {selected.length > 0 && (
          <Badge
            variant={isBubble ? "default" : "secondary"}
            className={cn(
              "tabular-nums",
              isBubble
                ? "absolute -right-1 -top-1 min-w-5 border-2 border-background px-1"
                : "ml-1",
            )}
          >
            {selected.length}
          </Badge>
        )}
      </RouterLink>
    </Button>
  );
}
