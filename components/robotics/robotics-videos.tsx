import { useCallback, useEffect, useRef, useState } from "react";
import { CatalogSelect } from "@/components/catalog-select";
import { Pause, Play } from "@/components/icons";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ROBOTICS_CAMERAS,
  type RoboticsCamera,
  type RoboticsClip,
  type RoboticsData,
  type RoboticsRunVideo,
  type RoboticsSearch,
  type RoboticsTask,
} from "@/lib/aa-robotics-data";
import { roboticsClipCaption, roboticsFailReason, roboticsTaskText } from "@/lib/aa-robotics-fr";
import { formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const RUNS_ID = "robotics-runs";
const CLIPS_PAGE = 9;
/** Playback rates; with AA's run videos already sped up, 4 is AA's default. */
const RATES = [1, 2, 4, 8] as const;
type Rate = (typeof RATES)[number];

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

function scrollToRuns() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(RUNS_ID)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

type Update = (patch: Partial<RoboticsSearch>) => void;

/** Task clips, the run explorer and the mistake clips of the AA-Robotics article. */
export function RoboticsVideos({ data, search, update }: { data: RoboticsData; search: RoboticsSearch; update: Update }) {
  const { media } = data;
  return (
    <>
      {Object.keys(media.task_videos).length > 0 && (
        <TaskVideos tasks={data.tasks} videos={media.task_videos} onWatch={(task) => {
          update({ task });
          scrollToRuns();
        }} />
      )}
      {Object.keys(media.run_videos).length > 0 && <RunExplorer data={data} search={search} update={update} />}
      {media.clips.length > 0 && <MistakeClips data={data} search={search} update={update} />}
    </>
  );
}

function TaskVideos({ tasks, videos, onWatch }: { tasks: RoboticsTask[]; videos: Record<string, string>; onWatch: (task: string) => void }) {
  const { t, lang } = useI18n();
  const copy = t.robotics.videos;
  return (
    <section aria-labelledby="robotics-task-videos-title" className="min-w-0 space-y-4">
      <div>
        <h2 id="robotics-task-videos-title" className="text-base font-semibold">{copy.tasksTitle}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.tasksHint}</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.filter((task) => videos[task.id]).map((task) => {
          const text = roboticsTaskText(task, lang);
          return (
            <li key={task.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
              <video
                src={videos[task.id]}
                aria-label={copy.demoLabel(text.name)}
                className="aspect-[4/3] w-full bg-muted object-cover"
                controls
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="text-sm font-medium">{text.name}</h3>
                <dl className="space-y-1 text-xs leading-5 text-muted-foreground">
                  {text.instruction && <div><dt className="inline font-medium text-foreground">{copy.goal} · </dt><dd className="inline">{text.instruction}</dd></div>}
                  {text.success && <div><dt className="inline font-medium text-foreground">{copy.success} · </dt><dd className="inline">{text.success}</dd></div>}
                </dl>
                <Button variant="outline" size="sm" className="touch-target mt-auto self-start" onClick={() => onWatch(task.id)}>
                  {copy.watchRuns(text.short_name)}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RunExplorer({ data, search, update }: { data: RoboticsData; search: RoboticsSearch; update: Update }) {
  const { t, lang } = useI18n();
  const copy = t.robotics.videos;
  const task = data.tasks.find((item) => item.id === search.task) ?? data.tasks[0];
  const text = roboticsTaskText(task, lang);
  const row = data.rows.find((item) => item.slug === search.model) ?? data.rows[0];
  const camera = search.camera ?? "left";
  const run = data.media.run_videos[`${task.id}__${row.slug}`] ?? null;
  const score = row.task_scores[task.id];

  return (
    <section id={RUNS_ID} aria-labelledby="robotics-runs-title" className="min-w-0 scroll-mt-24 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 id="robotics-runs-title" className="text-base font-semibold">{copy.runsTitle}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.runsHint}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <CatalogSelect
            value={task.id}
            onChange={(value) => update({ task: value })}
            label={copy.task}
            className="sm:w-60"
            options={data.tasks.map((item) => ({ value: item.id, label: roboticsTaskText(item, lang).name }))}
          />
          <CatalogSelect
            value={row.slug}
            onChange={(value) => update({ model: value })}
            label={copy.model}
            className="sm:w-48"
            options={data.rows.map((item) => ({ value: item.slug, label: item.name }))}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,2fr)]">
        {run ? (
          <RunPlayer
            key={run.url}
            run={run}
            camera={camera}
            onCameraChange={(value) => update({ camera: value })}
            label={copy.runLabel(row.name, text.name, copy.cameras[camera])}
          />
        ) : (
          <p role="status" className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{copy.noRun}</p>
        )}
        <div className="min-w-0 space-y-2 text-sm">
          <p className="font-medium">{row.name}{row.harness ? <span className="font-normal text-muted-foreground"> · {row.harness}</span> : null}</p>
          <p className="text-muted-foreground">{text.name}</p>
          {score != null && <p className="text-lg font-semibold tabular-nums">{copy.runScore(formatNumber(score, lang, 0))}</p>}
          {text.success && <p className="text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">{copy.success} · </span>{text.success}</p>}
          {run?.fail_reason && <p className="text-xs text-muted-foreground">{copy.end(roboticsFailReason(run.fail_reason, lang))}</p>}
        </div>
      </div>
    </section>
  );
}

/**
 * Player for AA's run videos, which tile the left, right and overhead cameras
 * in a 2×2 grid. One hidden video feeds three canvases: the chosen camera
 * large, the other two as thumbnails. Under it, AA's arm-activity histogram,
 * the stretches where the arm moves and the run's key moments, all seekable;
 * "movement only" skips the stretches where the arm is still.
 */
function RunPlayer({
  run,
  camera,
  onCameraChange,
  label,
}: {
  run: RoboticsRunVideo;
  camera: RoboticsCamera;
  onCameraChange: (camera: RoboticsCamera) => void;
  label: string;
}) {
  const { t, lang } = useI18n();
  const copy = t.robotics.videos;
  const video = useRef<HTMLVideoElement>(null);
  const canvases = useRef<Array<HTMLCanvasElement | null>>([]);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<Rate>(4);
  const [movementOnly, setMovementOnly] = useState(false);

  // Run seconds per video second, from the run's length; AA's videos are 8× real time.
  const scale = run.end_seconds && duration ? run.end_seconds / duration : null;
  const runTime = (videoSeconds: number) => videoSeconds * (scale ?? 1);
  const total = run.end_seconds ?? duration;
  const windows = run.movement_windows;

  const draw = useCallback(() => {
    const element = video.current;
    if (!element || element.readyState < 2) return;
    const width = element.videoWidth / 2;
    const height = element.videoHeight / 2;
    ROBOTICS_CAMERAS.forEach((_, index) => {
      const canvas = canvases.current[index];
      canvas?.getContext("2d")?.drawImage(element, (index % 2) * width, Math.floor(index / 2) * height, width, height, 0, 0, canvas.width, canvas.height);
    });
    setTime(element.currentTime);
  }, []);

  // The video may load before hydration, when its media events have no listener yet.
  useEffect(() => {
    const element = video.current;
    if (element && element.readyState >= 1) setDuration(element.duration || 0);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const element = video.current;
      if (element && movementOnly && scale && windows.length > 0 && !element.seeking) {
        const now = element.currentTime * scale;
        if (!windows.some(([from, to]) => now >= from && now < to)) {
          const next = windows.find(([from]) => from > now);
          if (next) element.currentTime = next[0] / scale;
          else element.pause();
        }
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, movementOnly, scale, windows, draw]);

  useEffect(() => {
    if (video.current) {
      video.current.defaultPlaybackRate = rate;
      video.current.playbackRate = rate;
    }
  }, [rate]);

  const seekRun = (seconds: number) => {
    const element = video.current;
    if (!element || !duration) return;
    element.currentTime = Math.min(duration, Math.max(0, seconds / (scale ?? 1)));
    setTime(element.currentTime);
  };
  const toggle = () => {
    const element = video.current;
    if (!element) return;
    if (!element.paused) return element.pause();
    const last = windows.at(-1);
    if (movementOnly && scale && last && element.currentTime * scale >= last[1]) element.currentTime = windows[0][0] / scale;
    void element.play();
  };

  const others = ROBOTICS_CAMERAS.filter((name) => name !== camera);
  const percent = (seconds: number | null) => (seconds == null || !total ? null : `${Math.min(100, (seconds / total) * 100)}%`);
  const markers = [
    { key: "first", seconds: run.first_action_seconds, label: copy.firstAction, color: "text-foreground" },
    { key: "passing", seconds: run.passing_seconds, label: copy.passing, color: "text-chart-1" },
    { key: "end", seconds: run.fail_reason ? run.end_seconds : null, label: copy.end(run.fail_reason ? roboticsFailReason(run.fail_reason, lang) : null), color: "text-destructive" },
  ].filter((marker) => percent(marker.seconds) !== null);
  const bars = run.activity ? [...run.activity].map(Number) : [];
  const peak = Math.max(1, ...bars);
  const progress = duration ? time / duration : 0;

  return (
    <div className="min-w-0 space-y-3">
      <video
        ref={video}
        src={run.url}
        className="hidden"
        muted
        playsInline
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onLoadedData={draw}
        onSeeked={draw}
      />
      <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg bg-muted">
        {ROBOTICS_CAMERAS.map((name, index) => {
          const main = name === camera;
          return (
            <button
              key={name}
              type="button"
              onClick={() => (main ? toggle() : onCameraChange(name))}
              aria-label={main ? `${label} · ${playing ? copy.pause : copy.play}` : copy.showCamera(copy.cameras[name])}
              style={main ? undefined : { gridRow: others.indexOf(name) + 1 }}
              className={cn(
                "relative block focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                main ? "col-span-2 row-span-2 row-start-1" : "col-start-3",
              )}
            >
              <canvas ref={(element) => { canvases.current[index] = element; }} width={640} height={480} className="block aspect-[4/3] h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">{copy.cameras[name]}</span>
              {main && !playing && (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-black/55 text-white"><Play className="size-5 translate-x-px" /></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" className="touch-target mt-3 shrink-0" aria-label={playing ? copy.pause : copy.play} onClick={toggle}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="relative h-3" aria-hidden="true">
            {markers.map((marker) => (
              <svg key={marker.key} width="10" height="10" viewBox="0 0 10 10" className={cn("absolute top-0 -translate-x-1/2", marker.color)} style={{ left: percent(marker.seconds)! }}>
                <path d="M1 1H9L5 9Z" fill="currentColor" />
              </svg>
            ))}
          </div>
          <div className="relative rounded-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-card">
            {bars.length > 0 && (
              <div className="flex h-7 items-end gap-px" aria-hidden="true" title={copy.activity}>
                {bars.map((value, index) => (
                  <span
                    key={index}
                    className={cn("flex-1 rounded-t-[1px]", index / bars.length < progress ? "bg-foreground/80" : "bg-muted-foreground/30")}
                    style={{ height: `${8 + (value / peak) * 92}%` }}
                  />
                ))}
              </div>
            )}
            <div className="relative mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true" title={copy.moving}>
              {run.moving.map(([from, to]) => (
                <span key={from} className="absolute inset-y-0 bg-foreground/70" style={{ left: percent(from)!, width: `max(1px, ${((to - from) / (total || 1)) * 100}%)` }} />
              ))}
              <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-chart-2" style={{ left: `${progress * 100}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.round(runTime(duration)))}
              step={1}
              value={Math.round(runTime(time))}
              disabled={!duration}
              aria-label={copy.position}
              aria-valuetext={`${clock(runTime(time))} / ${clock(runTime(duration))}`}
              onChange={(event) => seekRun(Number(event.currentTarget.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums" title={copy.realTime}>{clock(runTime(time))} / {clock(runTime(duration))}</span>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {markers.map((marker) => (
                <li key={marker.key} className="flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" className={marker.color}><path d="M1 1H9L5 9Z" fill="currentColor" /></svg>
                  {marker.label}{marker.seconds != null && <span className="tabular-nums"> · {clock(marker.seconds)}</span>}
                </li>
              ))}
              {run.moving.length > 0 && (
                <li className="flex items-center gap-1"><span aria-hidden="true" className="h-1.5 w-3 rounded-full bg-foreground/70" />{copy.moving}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SegmentedControl
          value={camera}
          onChange={onCameraChange}
          label={copy.camera}
          size="sm"
          options={ROBOTICS_CAMERAS.map((value) => ({ value, label: copy.cameras[value] }))}
        />
        <SegmentedControl
          value={String(rate) as `${Rate}`}
          onChange={(value) => setRate(Number(value) as Rate)}
          label={copy.speed}
          size="sm"
          options={RATES.map((value) => ({ value: String(value) as `${Rate}`, label: `${scale ? Math.round(scale * value) : value}×` }))}
        />
        {windows.length > 0 && scale && (
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium" title={copy.movementOnlyHint}>
            <Switch checked={movementOnly} onCheckedChange={setMovementOnly} aria-describedby="robotics-movement-hint" />
            {copy.movementOnly}
            <span id="robotics-movement-hint" className="sr-only">{copy.movementOnlyHint}</span>
          </label>
        )}
      </div>
    </div>
  );
}

function MistakeClips({ data, search, update }: { data: RoboticsData; search: RoboticsSearch; update: Update }) {
  const { t } = useI18n();
  const copy = t.robotics.videos;
  const { clips, issues } = data.media;
  const issue = issues.some((item) => item.id === search.issue) ? search.issue! : "all";
  const model = data.rows.some((row) => row.slug === search.clips) ? search.clips! : "all";
  const matching = clips.filter((clip) => (issue === "all" || clip.issue === issue) && (model === "all" || clip.model === model));
  const issueLabel = (id: string) => copy.issues[id] ?? issues.find((item) => item.id === id)?.label ?? id;

  return (
    <section aria-labelledby="robotics-clips-title" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 id="robotics-clips-title" className="text-base font-semibold">{copy.clipsTitle}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.clipsHint}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <CatalogSelect
            value={issue}
            onChange={(value) => update({ issue: value === "all" ? undefined : value })}
            label={copy.issue}
            className="sm:w-72"
            options={[
              { value: "all", label: `${copy.allIssues} (${clips.length})` },
              ...issues.map((item) => ({ value: item.id, label: `${issueLabel(item.id)} (${clips.filter((clip) => clip.issue === item.id).length})` })),
            ]}
          />
          <CatalogSelect
            value={model}
            onChange={(value) => update({ clips: value === "all" ? undefined : value })}
            label={copy.model}
            className="sm:w-48"
            options={[{ value: "all", label: copy.allModels }, ...data.rows.map((row) => ({ value: row.slug, label: row.name }))]}
          />
        </div>
      </div>
      {/* A new filter starts again from the first page of clips. */}
      <ClipGrid key={`${issue}:${model}`} data={data} clips={matching} issueLabel={issueLabel} />
    </section>
  );
}

function ClipGrid({ data, clips, issueLabel }: { data: RoboticsData; clips: RoboticsClip[]; issueLabel: (id: string) => string }) {
  const { t, lang } = useI18n();
  const copy = t.robotics.videos;
  const [shown, setShown] = useState(CLIPS_PAGE);
  if (clips.length === 0) {
    return <p role="status" className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{copy.noClips}</p>;
  }
  const modelName = (slug: string) => data.rows.find((row) => row.slug === slug)?.name ?? slug;
  const taskName = (id: string) => {
    const task = data.tasks.find((item) => item.id === id);
    return task ? roboticsTaskText(task, lang).short_name : id;
  };
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clips.slice(0, shown).map((clip) => {
          const caption = roboticsClipCaption(clip, lang);
          return (
            <li key={clip.url} className="min-w-0 overflow-hidden rounded-xl border bg-card">
              <video
                src={clip.url}
                aria-label={copy.clipLabel(modelName(clip.model), caption)}
                className="aspect-[4/3] w-full bg-muted object-cover"
                controls
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="space-y-1 p-3">
                <p className="text-sm leading-5">{caption}</p>
                <p className="text-xs text-muted-foreground">
                  {modelName(clip.model)} · {taskName(clip.task)}
                  {clip.start_seconds !== null && <> · {copy.at(clock(clip.start_seconds))}</>}
                </p>
                <p className="text-xs text-muted-foreground">{issueLabel(clip.issue)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-muted-foreground">{copy.count(Math.min(shown, clips.length), clips.length)}</p>
        {shown < clips.length && (
          <Button variant="outline" size="sm" className="touch-target" onClick={() => setShown((count) => count + CLIPS_PAGE)}>
            {copy.showMore}
          </Button>
        )}
      </div>
    </>
  );
}
