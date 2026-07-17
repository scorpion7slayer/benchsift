import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

export type ProgressTone = "default" | "strong" | "good" | "moderate" | "low"

const indicatorToneClassNames: Record<ProgressTone, string> = {
  default: "bg-primary",
  strong: "bg-chart-1",
  good: "bg-chart-2",
  moderate: "bg-chart-3",
  low: "bg-chart-4",
}

function Progress({
  className,
  tone = "default",
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: ProgressTone
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 transition-transform duration-200",
          indicatorToneClassNames[tone]
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
