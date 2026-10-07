import { useState } from "react";
import { Info } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A definition behind a real button: hover and keyboard focus open it like a
 * tooltip, and a tap toggles it so touch screens can read it too.
 */
export function InfoTip({
  label,
  content,
  className,
}: {
  label: string;
  content: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          // Radix closes tooltips on press; a tap should toggle instead.
          onPointerDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            setOpen((value) => !value);
          }}
          className={cn(
            "info-tip relative inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=delayed-open]:text-foreground data-[state=instant-open]:text-foreground pointer-coarse:before:absolute pointer-coarse:before:-inset-3 pointer-coarse:before:content-['']",
            className,
          )}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">{content}</TooltipContent>
    </Tooltip>
  );
}
