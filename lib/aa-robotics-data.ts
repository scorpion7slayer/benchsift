/*
 * Artificial Analysis AA-Robotics, read from the client bundle of the
 * `/articles/aa-robotics` page. AA does not send this data in the RSC payload:
 * the article's charts import it from module literals in the page chunk. The
 * parser reads those literals (models, tasks, one record per attempt, the
 * per-task scores, the run timelines and the human baseline) and applies the
 * aggregation the article's charts use; tests pin it to the values AA shows.
 * Video URLs come from the article's RSC payload (run and task videos) and the
 * chunk (captioned mistake clips); only files on AA's CDN are kept.
 */

export interface RoboticsTask {
  /** AA task id, e.g. "press-red-button". */
  id: string;
  name: string;
  short_name: string;
  instruction: string | null;
  success: string | null;
}

export interface RoboticsRow {
  /** AA model slug, also the catalogue join key. */
  slug: string;
  name: string;
  creator_name: string | null;
  /** Coding-agent harness the model ran in, e.g. "Codex". */
  harness: string | null;
  /** Mean per-task score, 0–100; a task without a published score counts as zero, as on AA. */
  score: number;
  attempts: number;
  /** Attempts that passed the task's criteria. */
  passes: number;
  cost_per_task_usd: number | null;
  minutes_per_task: number | null;
  /** Mean time observing and reasoning before the first physical action. */
  first_action_minutes: number | null;
  /** Score per task id, 0–100; null when AA publishes no attempt for the task. */
  task_scores: Record<string, number | null>;
}

export interface RoboticsHumanBaseline {
  minutes_per_task: number;
  /** By-hand time priced at the hourly wage AA cites; null when the wage is absent. */
  cost_per_task_usd: number | null;
  hourly_wage_usd: number | null;
}

/** A category of the article's "mistake wall". */
export interface RoboticsIssue {
  id: string;
  label: string;
  description: string | null;
}

/** A short captioned clip of one mistake during a run. */
export interface RoboticsClip {
  url: string;
  model: string;
  task: string;
  issue: string;
  caption: string;
  /** Where the clip starts in the full run. */
  start_seconds: number | null;
}

/** One run's video with what AA's player overlays on it; times are run seconds. */
export interface RoboticsRunVideo {
  url: string;
  /** Arm activity per time bucket, one digit each (higher is busier). */
  activity: string | null;
  end_seconds: number | null;
  first_action_seconds: number | null;
  /** First time the scene met the task's criteria. */
  passing_seconds: number | null;
  /** Why a failed run ended, as AA words it, e.g. "timed out". */
  fail_reason: string | null;
  /** Stretches where the arm moves, merged across sub-second pauses. */
  moving: Array<[number, number]>;
  /** Moving stretches padded by 4 s and merged across gaps up to 24 s: what "movement only" plays. */
  movement_windows: Array<[number, number]>;
}

export interface RoboticsMedia {
  /** Short loop of each task, by task id. */
  task_videos: Record<string, string>;
  /**
   * Whole run of one model on one task, keyed `${task}__${model}`. Each video
   * tiles the left, right and overhead cameras in a 2×2 grid.
   */
  run_videos: Record<string, RoboticsRunVideo>;
  issues: RoboticsIssue[];
  clips: RoboticsClip[];
}

export interface RoboticsData {
  /** AA version label, e.g. "v0.1". */
  version: string | null;
  tasks: RoboticsTask[];
  /** Best score first, ties in source order. */
  rows: RoboticsRow[];
  human: RoboticsHumanBaseline | null;
  media: RoboticsMedia;
}

export const EMPTY_ROBOTICS_MEDIA: RoboticsMedia = { task_videos: {}, run_videos: {}, issues: [], clips: [] };

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/;
const IDENT = String.raw`[A-Za-z_$][\w$]*`;
const STRING = String.raw`"(?:[^"\\\n]|\\.)*"`;
// The minifier writes some integers in hex ("0xe0167c") and some constants as fractions ("1/60").
const NUMBER = String.raw`-?(?:0x[0-9a-f]+|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:\/\d+(?:\.\d+)?)?)`;
const VALUE = String.raw`(?:${STRING}|!0|!1|null|${NUMBER})`;
const PAIR = new RegExp(String.raw`(${IDENT}):(${VALUE})`, "g");

type Scalar = string | number | boolean | null;
type Flat = Record<string, Scalar>;

function scalar(raw: string): Scalar | undefined {
  if (raw === "!0") return true;
  if (raw === "!1") return false;
  if (raw === "null") return null;
  if (raw.startsWith('"')) {
    try {
      return JSON.parse(raw) as string;
    } catch {
      return undefined;
    }
  }
  if (/^-?0x/.test(raw)) return (raw.startsWith("-") ? -1 : 1) * Number.parseInt(raw.replace(/^-?0x/, ""), 16);
  const [numerator, denominator] = raw.split("/");
  const value = Number(numerator) / (denominator === undefined ? 1 : Number(denominator));
  return Number.isFinite(value) ? value : undefined;
}

/** Flat object literals (no nested values) whose first key is `firstKey`. */
function flatObjects(source: string, firstKey: string): Flat[] {
  const pattern = new RegExp(String.raw`\{${firstKey}:${STRING}(?:,${IDENT}:${VALUE})*\}`, "g");
  return [...source.matchAll(pattern)].flatMap(([literal]) => {
    const object: Flat = {};
    for (const [, key, raw] of literal.matchAll(PAIR)) {
      const value = scalar(raw);
      if (value === undefined) return [];
      object[key] = value;
    }
    return [object];
  });
}

function text(value: Scalar | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function measure(value: Scalar | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** The balanced `{…}` starting at `start`, ignoring braces inside strings. */
function balancedObject(source: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (char === "\\") index += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return null;
}

/** The JSON map of scores by model, then by task, that the result charts read. */
function scoreMap(source: string, models: Set<string>, tasks: Set<string>): Map<string, Map<string, number>> {
  const start = /\{"[a-z0-9][a-z0-9._-]*":\{"[a-z0-9][a-z0-9-]*":-?\d/g;
  for (const match of source.matchAll(start)) {
    const literal = balancedObject(source, match.index);
    if (!literal) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(literal);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (!entries.some(([model]) => models.has(model))) continue;
    return new Map(entries.flatMap(([model, byTask]) => {
      if (!models.has(model) || !byTask || typeof byTask !== "object") return [];
      const scores = Object.entries(byTask as Record<string, unknown>).flatMap(([task, score]) =>
        tasks.has(task) && typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100
          ? [[task, score] as const]
          : []);
      return [[model, new Map(scores)] as const];
    }));
  }
  return new Map();
}

interface Timeline {
  model: string;
  task: string;
  fields: Record<string, Scalar>;
  segments: string | null;
}

/** Each run's timeline object; its nested `share` and `actions` are skipped. */
function runTimelines(source: string): Timeline[] {
  const start = new RegExp(String.raw`\{model:(${STRING}),task:(${STRING}),`, "g");
  return [...source.matchAll(start)].flatMap((match): Timeline[] => {
    const model = text(scalar(match[1]));
    const task = text(scalar(match[2]));
    const literal = balancedObject(source, match.index);
    if (!model || !task || !literal || !/(?:activitySegments|thinkingBeforeFirstActionSeconds):/.test(literal)) return [];
    const fields: Record<string, Scalar> = {};
    for (const [, key, raw] of literal.matchAll(new RegExp(String.raw`[,{](${IDENT}):(${VALUE})(?=[,}])`, "g"))) {
      const value = scalar(raw);
      if (value !== undefined && !(key in fields)) fields[key] = value;
    }
    const segments = typeof fields.activitySegments === "string" ? fields.activitySegments : null;
    return [{ model, task, fields, segments }];
  });
}

/** Seconds before the first action, by model, from each run's timeline. */
function firstActionSeconds(timelines: Timeline[]): Map<string, number[]> {
  const byModel = new Map<string, number[]>();
  for (const { model, fields } of timelines) {
    const seconds = measure(fields.thinkingBeforeFirstActionSeconds);
    if (seconds !== null) byModel.set(model, [...(byModel.get(model) ?? []), seconds]);
  }
  return byModel;
}

/**
 * Stretches where the arm moves, in run seconds. AA encodes a run as letter
 * and duration pairs ("-65a14s116…", tenths of a second); "m" is the arm
 * moving. Stretches closer than `gap` seconds merge, and each is widened by
 * `pad` seconds, as AA's player does for its "Movement only" mode.
 */
export function movingStretches(segments: string, pad = 0, gap = 0): Array<[number, number]> {
  const stretches: Array<[number, number]> = [];
  let at = 0;
  for (const [, letter, tenths] of segments.matchAll(/([a-z-])(\d+)/g)) {
    const end = at + Number(tenths) / 10;
    if (letter === "m") {
      const last = stretches.at(-1);
      if (last && at - pad - last[1] <= gap) last[1] = end + pad;
      else stretches.push([Math.max(0, at - pad), end + pad]);
    }
    at = end;
  }
  return stretches.map(([from, to]) => [Math.round(from * 10) / 10, Math.round(to * 10) / 10]);
}

/** The run explorer's arm-activity histogram: one digit per time bucket, keyed `${task}__${model}`. */
function activityMap(source: string): Record<string, string> {
  for (const match of source.matchAll(/\{"[a-z0-9-]+__[a-z0-9._-]+":"\d+"/g)) {
    const literal = balancedObject(source, match.index);
    if (!literal) continue;
    try {
      const parsed = JSON.parse(literal) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && /^\d{1,2000}$/.test(entry[1]),
      ));
    } catch {
      continue;
    }
  }
  return {};
}

function humanBaseline(source: string, tasks: Set<string>): RoboticsHumanBaseline | null {
  // Human attempts are the only flat `{task, pass, minutes}` records.
  const minutes = flatObjects(source, "task").flatMap((attempt) => {
    const value = measure(attempt.minutes);
    return Object.keys(attempt).length === 3 && typeof attempt.task === "string" && tasks.has(attempt.task) && value !== null
      ? [value]
      : [];
  });
  const perTask = mean(minutes);
  if (perTask === null) return null;
  const wage = source.match(/meanCostUsd:[A-Za-z_$][\w$]*\/60\*(\d+(?:\.\d+)?)/)?.[1];
  const hourly = wage === undefined ? null : Number(wage);
  return {
    minutes_per_task: perTask,
    hourly_wage_usd: hourly,
    cost_per_task_usd: hourly === null ? null : (perTask / 60) * hourly,
  };
}

const CDN_ORIGIN = "https://artificialanalysiscdn.com/";
const VIDEO_PATH = /^[A-Za-z0-9][A-Za-z0-9/_.-]{0,255}\.mp4$/;

/** An AA CDN video URL, or null for anything else. */
function cdnVideo(base: string, file: string): string | null {
  const url = `${base.replace(/\/+$/, "")}/${file}`;
  const path = url.startsWith(CDN_ORIGIN) ? url.slice(CDN_ORIGIN.length) : "";
  return VIDEO_PATH.test(path) && !path.includes("..") && !path.includes("//") ? url : null;
}

/** The first string value of `key` in the RSC payload. */
function payloadString(payload: string, key: string): string | null {
  const raw = payload.match(new RegExp(String.raw`"${key}":(${STRING})`))?.[1];
  const value = raw === undefined ? undefined : scalar(raw);
  return typeof value === "string" ? value : null;
}

function parseMedia(
  payload: string,
  source: string,
  taskIds: Set<string>,
  modelIds: Set<string>,
  timelines: Timeline[],
): RoboticsMedia {
  const taskVideos: Record<string, string> = {};
  for (const [, url, task] of payload.matchAll(/"src":"(https:\/\/artificialanalysiscdn\.com\/[A-Za-z0-9/_.-]+\/([a-z0-9-]+)\.mp4)"/g)) {
    if (taskIds.has(task) && !(task in taskVideos) && cdnVideo(CDN_ORIGIN, url.slice(CDN_ORIGIN.length))) taskVideos[task] = url;
  }

  const runVideos: Record<string, RoboticsRunVideo> = {};
  const runBase = payloadString(payload, "videoBaseUrl");
  const available = payload.match(/"available":\[((?:"[a-z0-9._-]+",?)*)\]/)?.[1] ?? "";
  const activity = activityMap(source);
  for (const [, key] of available.matchAll(/"([a-z0-9._-]+)"/g)) {
    const [task, model, extra] = key.split("__");
    const url = runBase && extra === undefined && taskIds.has(task) && modelIds.has(model) ? cdnVideo(runBase, `${key}.mp4`) : null;
    if (!url) continue;
    const timeline = timelines.find((item) => item.task === task && item.model === model);
    const fields = timeline?.fields ?? {};
    runVideos[key] = {
      url,
      activity: activity[key] ?? null,
      end_seconds: measure(fields.endSeconds),
      first_action_seconds: measure(fields.firstTaskActionSeconds),
      passing_seconds: measure(fields.passingStateSeconds),
      fail_reason: text(fields.failEnd),
      moving: timeline?.segments ? movingStretches(timeline.segments, 0, 1) : [],
      movement_windows: timeline?.segments ? movingStretches(timeline.segments, 4, 24) : [],
    };
  }

  const clipBase = payloadString(payload, "clipBaseUrl");
  const clips = clipBase
    ? flatObjects(source, "file").flatMap((clip): RoboticsClip[] => {
      const file = text(clip.file);
      const url = file ? cdnVideo(clipBase, file) : null;
      const model = text(clip.model);
      const task = text(clip.task);
      const issue = text(clip.issue);
      const caption = text(clip.caption);
      if (!url || !model || !modelIds.has(model) || !task || !taskIds.has(task) || !issue || !SLUG_PATTERN.test(issue) || !caption) return [];
      return [{ url, model, task, issue, caption, start_seconds: measure(clip.startSeconds) }];
    }).filter((clip, index, all) => all.findIndex((other) => other.url === clip.url) === index)
    : [];

  // Categories carry nested counts, so read their leading fields only.
  const issuePattern = new RegExp(String.raw`\{id:(${STRING}),label:(${STRING}),description:(${STRING}),counts:`, "g");
  const used = new Set(clips.map((clip) => clip.issue));
  const issues: RoboticsIssue[] = [];
  for (const [, rawId, rawLabel, rawDescription] of source.matchAll(issuePattern)) {
    const id = text(scalar(rawId));
    const label = text(scalar(rawLabel));
    if (!id || !label || !used.has(id) || issues.some((issue) => issue.id === id)) continue;
    issues.push({ id, label, description: text(scalar(rawDescription)) });
  }
  // A clip whose category AA does not describe still needs a filter entry.
  for (const id of used) if (!issues.some((issue) => issue.id === id)) issues.push({ id, label: id, description: null });

  return { task_videos: taskVideos, run_videos: runVideos, issues, clips };
}

/**
 * Parses the page chunk, with the article's RSC payload for the version and
 * the videos. A model needs a valid slug, a name and at least one attempt;
 * tasks come in AA's order. Returns no rows when the chunk no longer carries
 * the expected literals.
 */
export function parseAARobotics(source: string, payload = ""): RoboticsData {
  const tasks: RoboticsTask[] = [];
  for (const object of flatObjects(source, "id")) {
    const id = text(object.id);
    const name = text(object.name);
    if (!id || !SLUG_PATTERN.test(id) || !name || !("instruction" in object) || tasks.some((task) => task.id === id)) continue;
    tasks.push({
      id,
      name,
      short_name: text(object.shortName) ?? name,
      instruction: text(object.instruction),
      success: text(object.success),
    });
  }
  const taskIds = new Set(tasks.map((task) => task.id));

  const models = flatObjects(source, "id").flatMap((object) => {
    const slug = text(object.id);
    const name = text(object.name);
    if (!slug || !SLUG_PATTERN.test(slug) || !name || !("harness" in object)) return [];
    return [{ slug, name, creator_name: text(object.creatorName), harness: text(object.harness) }];
  }).filter((model, index, all) => all.findIndex((other) => other.slug === model.slug) === index);
  const modelIds = new Set(models.map((model) => model.slug));

  const attempts = flatObjects(source, "jobId").filter(
    (attempt) => typeof attempt.model === "string" && modelIds.has(attempt.model) && typeof attempt.task === "string" && taskIds.has(attempt.task),
  );
  const scores = scoreMap(source, modelIds, taskIds);
  const timelines = runTimelines(source);
  const firstActions = firstActionSeconds(timelines);

  const rows = models.flatMap((model): RoboticsRow[] => {
    const own = attempts.filter((attempt) => attempt.model === model.slug);
    if (own.length === 0) return [];
    const byTask = scores.get(model.slug);
    const attempted = new Set(own.map((attempt) => attempt.task as string));
    const costs = own.map((attempt) => measure(attempt.costUsd));
    const minutes = own.map((attempt) => measure(attempt.minutes));
    const firstAction = mean(firstActions.get(model.slug) ?? []);
    return [{
      ...model,
      score: mean(own.map((attempt) => byTask?.get(attempt.task as string) ?? 0)) ?? 0,
      attempts: own.length,
      passes: own.filter((attempt) => attempt.pass === true).length,
      cost_per_task_usd: costs.every((cost) => cost !== null) ? mean(costs as number[]) : null,
      minutes_per_task: minutes.every((value) => value !== null) ? mean(minutes as number[]) : null,
      first_action_minutes: firstAction === null ? null : firstAction / 60,
      task_scores: Object.fromEntries(tasks.map((task) => [
        task.id,
        attempted.has(task.id) ? byTask?.get(task.id) ?? 0 : null,
      ])),
    }];
  });

  if (rows.length === 0) return { version: null, tasks: [], rows: [], human: null, media: EMPTY_ROBOTICS_MEDIA };
  return {
    version: roboticsVersion(payload),
    tasks,
    rows: rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => b.row.score - a.row.score || a.index - b.index)
      .map(({ row }) => row),
    human: humanBaseline(source, taskIds),
    media: parseMedia(payload, source, taskIds, new Set(rows.map((row) => row.slug)), timelines),
  };
}

/** Path of the article's page chunk named in its RSC payload, e.g. "static/chunks/app/…/aa-robotics/page-….js". */
export function roboticsChunkPath(rscPayload: string): string | null {
  const path = rscPayload.match(/static\/chunks\/app\/[A-Za-z0-9%()._\/-]{1,200}\/aa-robotics\/page-[0-9a-f]{8,32}\.js/)?.[0];
  return path && !path.includes("..") ? path : null;
}

/** Version label from the article title, e.g. "v0.1". */
export function roboticsVersion(rscPayload: string): string | null {
  return rscPayload.match(/AA-Robotics (v\d+(?:\.\d+)*)/)?.[1] ?? null;
}

/* ------------------------------------------------------------ page state */

/** Cameras tiled in a run video: left (top left), right (top right) and overhead (bottom left). */
export const ROBOTICS_CAMERAS = ["left", "right", "overhead"] as const;
export type RoboticsCamera = (typeof ROBOTICS_CAMERAS)[number];

/**
 * Video state kept in the URL so a run or a filtered set of clips can be
 * shared. Unknown ids are dropped by the view against the loaded data.
 */
export interface RoboticsSearch {
  task?: string;
  model?: string;
  camera?: RoboticsCamera;
  issue?: string;
  clips?: string;
}

function searchId(value: unknown): string | undefined {
  return typeof value === "string" && SLUG_PATTERN.test(value) ? value : undefined;
}

export function parseRoboticsSearch(raw: Record<string, unknown>): RoboticsSearch {
  const camera = ROBOTICS_CAMERAS.find((name) => name === raw.camera);
  const search: RoboticsSearch = {
    task: searchId(raw.task),
    model: searchId(raw.model),
    camera: camera === "left" ? undefined : camera,
    issue: searchId(raw.issue),
    clips: searchId(raw.clips),
  };
  return Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined)) as RoboticsSearch;
}
