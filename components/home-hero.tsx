"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

export function HomeHero({ count }: { count: number }) {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.hero.title}</h1>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{t.hero.description}</p>
    </div>
  );
}
