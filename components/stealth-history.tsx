import type { LLMModel } from "@/lib/model-types";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Eye, ExternalLink, ChevronDown } from "./icons";

type Identity = Pick<LLMModel, "is_stealth" | "stealth_history">;

export function StealthBadge({ model }: { model: Identity }) {
  const { t } = useI18n();
  if (!model.is_stealth && !model.stealth_history?.length) return null;
  const revealed = model.stealth_history?.some((row) => row.revealedAs);
  return <Badge variant="outline" className="max-w-full gap-1 whitespace-normal text-xs">
    <Eye data-icon="inline-start" />{model.is_stealth && !revealed ? t.stealth.active : t.stealth.former}
  </Badge>;
}

export function StealthHistory({ model }: { model: Identity }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (!model.stealth_history?.length) return null;
  const formatDate = (value: string) => new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
  return <div>
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)} className="flex min-h-12 w-full items-center gap-2 rounded-lg border bg-card px-3 text-left text-sm sm:hidden"><Eye className="size-4 shrink-0" /><span className="flex-1">{t.stealth.title}</span><ChevronDown className={cn("size-4 shrink-0", expanded && "rotate-180")} /></button>
    <Card id={id} className={cn("sm:flex", expanded ? "mt-2 flex sm:mt-0" : "hidden")}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Eye className="size-4" />{t.stealth.title}</CardTitle>
      <CardDescription>{t.stealth.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="flex flex-col gap-5">
        {model.stealth_history.map((row) => <li key={row.id} className="flex min-w-0 flex-col gap-2 text-sm">
          <p className="font-medium">{row.name} <span className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{row.id}</span></p>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
            {[[t.stealth.listed, row.listedAt], [t.stealth.firstSeen, row.firstSeenAt]].map(([label, value]) => value && Number.isFinite(Date.parse(value)) ? <div key={label}><dt className="text-muted-foreground">{label}</dt><dd><time dateTime={value}>{formatDate(value)}</time></dd></div> : null)}
            {row.revealedAs && <div><dt className="text-muted-foreground">{t.stealth.revealed}</dt><dd className="[overflow-wrap:anywhere]">{row.revealedAs}</dd></div>}
          </dl>
          <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1 underline underline-offset-4">{t.stealth.source}<ExternalLink className="size-3" /></a>
          {row.announcementUrl && <a href={row.announcementUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1 underline underline-offset-4">{t.stealth.source} · LinkedIn<ExternalLink className="size-3" /></a>}
        </li>)}
      </ul>
    </CardContent>
  </Card></div>;
}
