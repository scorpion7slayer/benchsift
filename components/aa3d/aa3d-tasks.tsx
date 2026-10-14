import { useState } from "react";
import { ChevronDown, ExternalLink } from "@/components/icons";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { aa3dSceneUrl, type Aa3dDomain, type Aa3dTask } from "@/lib/aa3d-data";
import { formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface Aa3dSceneModel {
  name: string;
  logoKey: string;
  iconUrl?: string | null;
}

/**
 * The published AA-3D briefs by domain. Each task opens to the scenes the
 * ranked models built, linked to AA's media CDN rather than embedded.
 */
export function Aa3dTasks({
  tasks,
  domains,
  models,
  modelCount,
}: {
  tasks: readonly Aa3dTask[];
  domains: readonly Aa3dDomain[];
  /** Scene models in leaderboard order; scenes of other models are not listed. */
  models: ReadonlyMap<string, Aa3dSceneModel>;
  modelCount: number;
}) {
  const { t, lang } = useI18n();
  const copy = t.aa3d.tasks;
  const [domain, setDomain] = useState<string | null>(null);
  if (tasks.length === 0) return null;

  const order = [...models.keys()];
  const shown = domain ? tasks.filter((task) => task.domain === domain) : tasks;
  const label = (id: string) => t.aa3d.domains.names[id] ?? domains.find((item) => item.id === id)?.label ?? id;
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <section aria-labelledby="aa3d-tasks-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="min-w-0">
        <h2 id="aa3d-tasks-title" className="text-base font-semibold">{copy.title}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.hint}</p>
      </div>
      <div role="group" aria-label={copy.domain} className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={domain === null} className={chip(domain === null)} onClick={() => setDomain(null)}>
          {copy.all}
        </button>
        {domains.map((item) => (
          <button key={item.id} type="button" aria-pressed={domain === item.id} className={chip(domain === item.id)} onClick={() => setDomain(item.id)}>
            {label(item.id)}
          </button>
        ))}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {copy.count(formatNumber(shown.length, lang, 0), formatNumber(tasks.length, lang, 0))}
      </p>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {shown.map((task) => (
          <TaskItem key={task.id} task={task} domainLabel={label(task.domain)} models={models} order={order} modelCount={modelCount} />
        ))}
      </ul>
    </section>
  );
}

/** One brief; its scene links render only once opened, which keeps the page light. */
function TaskItem({
  task,
  domainLabel,
  models,
  order,
  modelCount,
}: {
  task: Aa3dTask;
  domainLabel: string;
  models: ReadonlyMap<string, Aa3dSceneModel>;
  order: readonly string[];
  modelCount: number;
}) {
  const { t, lang } = useI18n();
  const copy = t.aa3d.tasks;
  const [open, setOpen] = useState(false);
  const scenes = task.scenes.filter((scene) => models.has(scene.slug));
  return (
    <li>
      <details className="group rounded-lg border bg-background" onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex min-h-12 cursor-pointer list-none items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span lang="en" className="block text-sm font-medium">{task.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {domainLabel} · {copy.coverage(formatNumber(scenes.length, lang, 0), formatNumber(modelCount, lang, 0))}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="disclosure-content border-t px-3 py-3">
          <p lang="en" className="text-xs leading-5 text-muted-foreground">{task.brief}</p>
          {scenes.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{copy.noScenes}</p>
          ) : open ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...scenes]
                .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
                .map((scene) => {
                  const model = models.get(scene.slug)!;
                  return (
                    <li key={scene.id} className="min-w-0 max-w-full">
                      <a
                        href={aa3dSceneUrl(scene.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={copy.openScene(task.title, model.name)}
                        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-md border bg-card px-2 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ModelProviderIcon provider={model.logoKey} iconUrl={model.iconUrl} size={16} />
                        <span className="truncate">{model.name}</span>
                        <ExternalLink aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </div>
      </details>
    </li>
  );
}
