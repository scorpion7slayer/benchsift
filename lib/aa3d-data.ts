import { aaEvalPerTask } from "./aa-eval-cost";
import { findFlightElementProps, parseFlightRecords } from "./aa-flight";
import { getCanonicalCreatorSlug, getCreatorDisplayName } from "./provider-map";

/*
 * Artificial Analysis AA-3D leaderboard, read from the `/evaluations/aa-3d` RSC
 * payload. Each model turns a written brief into an interactive three.js scene
 * and a recruited panel votes blind between pairs of scenes; AA ranks the
 * models by Elo. The `initialModels` prop carries each model's Elo
 * (`aa3dElo`), token counts, prices and agent-run breakdown; the leaderboard
 * element's `models` prop adds the 95% confidence interval, joined by AA id.
 * The win-rate element gives each model's votes by task domain, and the scene
 * explorer lists every task with the scene each model built for it.
 */

/** Size of AA-3D v1.0, the task set AA runs; per-scene figures divide by it, as on AA. */
export const AA3D_TASKS = 55;

export interface Aa3dRow {
  /** AA model slug, also the catalogue join key. */
  slug: string;
  /** Full AA name, including the configuration. */
  name: string;
  /** Name without the configuration, e.g. "Claude Opus 5.5". */
  family_name: string;
  /** AA configuration suffix, e.g. "Max, Default Fallback". */
  configuration: string | null;
  elo: number;
  /** 95% confidence interval of the Elo; null when unpublished. */
  elo_lower: number | null;
  elo_upper: number | null;
  /** The reference model whose Elo AA fixes (1000), so it has no interval. */
  is_anchor: boolean;
  release_date: string | null;
  creator_slug: string | null;
  creator_name: string | null;
  is_reasoning: boolean | null;
  is_open_weights: boolean | null;
  /** Answer plus reasoning tokens per scene. */
  output_tokens_per_scene: number | null;
  cost_per_scene_usd: number | null;
  /** Median agent turns per scene, out of a 250-turn limit. */
  median_turns: number | null;
  /** Agent turns per scene at the 5th, 25th, 50th, 75th and 95th percentiles. */
  turns: Aa3dTurns | null;
  /** Average tool calls per scene, by kind. */
  tool_calls: Aa3dToolCalls | null;
  /** Share of scenes where the agent looked at its render by turn 20. */
  first_look_share: number | null;
  /** Share of scenes that used the bundled asset library. */
  asset_library_share: number | null;
  /** Panel votes by task domain, keyed by domain id. */
  domains: Record<string, Aa3dDomainResult>;
}

export interface Aa3dTurns {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface Aa3dToolCalls {
  browser_test: number;
  code: number;
  assets: number;
  image_views: number;
  other: number;
}

export interface Aa3dDomainResult {
  /** Share of panel votes won in the domain. */
  win_rate: number;
  /** Mean win rate against each opponent faced, so every opponent counts equally. */
  win_rate_balanced: number | null;
  opponents: number | null;
  scenes: number | null;
  /** AA flags results from too few scenes or opponents as unreliable. */
  too_few_scenes: boolean;
  too_few_opponents: boolean;
}

export interface Aa3dDomain {
  id: string;
  /** English label from the source, used when no translation exists. */
  label: string;
}

export interface Aa3dTask {
  id: string;
  domain: string;
  title: string;
  brief: string;
  /** Scenes in blind voting: the model slug and AA's scene id on its media CDN. */
  scenes: Array<{ slug: string; id: string }>;
}

export interface Aa3dData {
  rows: Aa3dRow[];
  domains: Aa3dDomain[];
  tasks: Aa3dTask[];
  /** Lower bound AA states for the panel votes behind the win rates. */
  panel_votes: number | null;
}

export type Aa3dSort = "elo" | "release";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SCENE_URL_PATTERN = /^https:\/\/artificialanalysiscdn\.com\/media-arena\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/index\.html$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:$|T)/;

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function flag(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function positive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegative(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function share(value: unknown): number | null {
  const number = nonNegative(value);
  return number !== null && number <= 1 ? number : null;
}

function count(value: unknown): number | null {
  const number = nonNegative(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

/** Percentiles must all be published and in order. */
function turnsOf(value: unknown): Aa3dTurns | null {
  if (!isProps(value)) return null;
  const turns = [value.p5, value.p25, value.p50, value.p75, value.p95].map(positive);
  if (turns.some((turn) => turn === null)) return null;
  const [p5, p25, p50, p75, p95] = turns as number[];
  return p5 <= p25 && p25 <= p50 && p50 <= p75 && p75 <= p95 ? { p5, p25, p50, p75, p95 } : null;
}

function toolCallsOf(value: unknown): Aa3dToolCalls | null {
  if (!isProps(value)) return null;
  const calls = {
    browser_test: nonNegative(value.browserTest),
    code: nonNegative(value.code),
    assets: nonNegative(value.assets),
    image_views: nonNegative(value.imageViews),
    other: nonNegative(value.other),
  };
  return Object.values(calls).every((call) => call !== null) ? (calls as Aa3dToolCalls) : null;
}

function domainResultOf(value: unknown): Aa3dDomainResult | null {
  if (!isProps(value)) return null;
  const winRate = share(value.winRate);
  if (winRate === null) return null;
  return {
    win_rate: winRate,
    win_rate_balanced: share(value.winRateBalanced),
    opponents: count(value.opponents),
    scenes: count(value.scenes),
    too_few_scenes: value.tooFewScenes === true,
    too_few_opponents: value.tooFewOpponents === true,
  };
}

function familyName(name: string, suffix: string | null, release: string | null): string {
  if (release) return release;
  const tail = suffix ? ` (${suffix})` : null;
  return tail && name.endsWith(tail) ? name.slice(0, -tail.length).trim() || name : name;
}

/** Published intervals by AA model id; one that does not contain its Elo is dropped. */
function intervals(records: Map<string, unknown>): Map<string, { elo: number; lower: number; upper: number }> {
  const [props] = findFlightElementProps(
    records,
    (props) => Array.isArray(props.models) && props.models.some((model) => isProps(model) && "lower95ci" in model && "displayName" in model),
  );
  const byId = new Map<string, { elo: number; lower: number; upper: number }>();
  for (const model of (props?.models as unknown[] | undefined) ?? []) {
    if (!isProps(model)) continue;
    const id = text(model.id);
    const elo = positive(model.elo);
    const lower = positive(model.lower95ci);
    const upper = positive(model.upper95ci);
    if (id && elo !== null && lower !== null && upper !== null && lower <= elo && elo <= upper && !byId.has(id)) {
      byId.set(id, { elo, lower, upper });
    }
  }
  return byId;
}

interface WinRates {
  byModelId: Props;
  panelVotes: number | null;
}

function winRates(records: Map<string, unknown>): WinRates {
  const [props] = findFlightElementProps(records, (props) => isProps(props.winRatesByModelId));
  return {
    byModelId: isProps(props?.winRatesByModelId) ? props.winRatesByModelId : {},
    panelVotes: count(props?.panelVotes),
  };
}

/**
 * Parses the leaderboard. A row needs a valid slug, a name and a positive Elo.
 * Duplicates keep their first occurrence and rows are ordered by Elo, ties in
 * source order. An interval is kept only when it was published for the same Elo.
 */
export function parseAa3d(payload: string): Aa3dRow[] {
  return parseAa3dRecords(parseFlightRecords(payload)).rows;
}

function parseAa3dRecords(records: Map<string, unknown>): { rows: Aa3dRow[]; slugById: Map<string, string>; panelVotes: number | null } {
  const slugById = new Map<string, string>();
  const [props] = findFlightElementProps(records, (props) => Array.isArray(props.initialModels));
  if (!props) return { rows: [], slugById, panelVotes: null };
  const published = intervals(records);
  const votes = winRates(records);
  const seen = new Set<string>();
  const rows = (props.initialModels as unknown[]).flatMap((model): Aa3dRow[] => {
    if (!isProps(model)) return [];
    const slug = text(model.slug);
    const name = text(model.name);
    const elo = positive(model.aa3dElo);
    if (!slug || !SLUG_PATTERN.test(slug) || !name || elo === null || seen.has(slug)) return [];
    seen.add(slug);
    const id = text(model.id);
    if (id) slugById.set(id, slug);
    const byDomain = id && isProps(votes.byModelId[id]) ? votes.byModelId[id] : {};
    const domains: Record<string, Aa3dDomainResult> = {};
    for (const [domain, value] of Object.entries(byDomain)) {
      const result = domainResultOf(value);
      if (ID_PATTERN.test(domain) && result) domains[domain] = result;
    }
    const interval = id ? published.get(id) : undefined;
    const ci = interval && interval.elo === elo ? interval : null;
    const suffix = text(model.suffix);
    const creator = isProps(model.creator) ? model.creator : null;
    const releaseDate = text(model.releaseDate);
    const creatorSlug = text(creator?.slug);
    const creatorName = text(creator?.name);
    const breakdown = isProps(model.aa3dBreakdown) ? model.aa3dBreakdown : null;
    const turns = isProps(breakdown?.turns) ? breakdown.turns : null;
    const figures = aaEvalPerTask(model, "aa3d", AA3D_TASKS);
    return [{
      slug,
      name,
      family_name: familyName(name, suffix, isProps(model.release) ? text(model.release.name) : null),
      configuration: suffix,
      elo,
      elo_lower: ci?.lower ?? null,
      elo_upper: ci?.upper ?? null,
      is_anchor: ci !== null && ci.lower === elo && ci.upper === elo,
      release_date: releaseDate && DATE_PATTERN.test(releaseDate) ? releaseDate : null,
      creator_slug: creatorSlug ? getCanonicalCreatorSlug(creatorSlug) : null,
      creator_name: creatorSlug && creatorName ? getCreatorDisplayName(creatorSlug, creatorName) : creatorName,
      is_reasoning: flag(model.isReasoning),
      is_open_weights: flag(model.isOpenWeights),
      output_tokens_per_scene: figures.output_tokens,
      cost_per_scene_usd: figures.cost_usd,
      median_turns: positive(turns?.p50),
      turns: turnsOf(turns),
      tool_calls: toolCallsOf(breakdown?.toolCallsPerTask),
      first_look_share: share(breakdown?.firstLookByTurn20Share),
      asset_library_share: share(breakdown?.assetLibraryShare),
      domains,
    }];
  });
  return {
    rows: rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => b.row.elo - a.row.elo || a.index - b.index)
      .map(({ row }) => row),
    slugById,
    panelVotes: votes.panelVotes,
  };
}

/**
 * Tasks of the scene explorer, by domain. A scene is kept only for a ranked
 * model and only when its address is a scene page on AA's media CDN.
 */
function parseTasks(records: Map<string, unknown>, slugById: Map<string, string>): { domains: Aa3dDomain[]; tasks: Aa3dTask[] } {
  const [props] = findFlightElementProps(
    records,
    (props) => Array.isArray(props.domains) && props.domains.some((domain) => isProps(domain) && Array.isArray(domain.tasks)),
  );
  const domains: Aa3dDomain[] = [];
  const tasks: Aa3dTask[] = [];
  const seenTasks = new Set<string>();
  for (const domain of (props?.domains as unknown[] | undefined) ?? []) {
    if (!isProps(domain)) continue;
    const id = text(domain.id);
    const label = text(domain.label);
    if (!id || !ID_PATTERN.test(id) || !label || domains.some((item) => item.id === id)) continue;
    domains.push({ id, label });
    for (const task of Array.isArray(domain.tasks) ? domain.tasks : []) {
      if (!isProps(task)) continue;
      const taskId = text(task.id);
      const title = text(task.title);
      const brief = text(task.brief);
      if (!taskId || !ID_PATTERN.test(taskId) || !title || !brief || seenTasks.has(taskId)) continue;
      seenTasks.add(taskId);
      const scenes: Aa3dTask["scenes"] = [];
      for (const scene of Array.isArray(task.scenes) ? task.scenes : []) {
        if (!isProps(scene)) continue;
        const slug = slugById.get(text(scene.modelId) ?? "");
        const sceneId = SCENE_URL_PATTERN.exec(text(scene.url) ?? "")?.[1];
        if (slug && sceneId && !scenes.some((item) => item.slug === slug)) scenes.push({ slug, id: sceneId });
      }
      tasks.push({ id: taskId, domain: id, title, brief, scenes });
    }
  }
  return { domains, tasks };
}

/** Leaderboard, domains, tasks and panel size from one AA-3D page payload. */
export function parseAa3dPage(payload: string): Aa3dData {
  const records = parseFlightRecords(payload);
  const { rows, slugById, panelVotes } = parseAa3dRecords(records);
  const { domains, tasks } = parseTasks(records, slugById);
  // A domain with votes but no explorer entry still gets a column, labelled by its id.
  for (const id of rows.flatMap((row) => Object.keys(row.domains))) {
    if (!domains.some((domain) => domain.id === id)) domains.push({ id, label: id });
  }
  return { rows, domains, tasks, panel_votes: panelVotes };
}

/** Address of a scene on AA's media CDN, rebuilt from its validated id. */
export function aa3dSceneUrl(id: string): string {
  return `https://artificialanalysiscdn.com/media-arena/${id}/index.html`;
}

function releaseTime(row: Aa3dRow): number {
  const time = row.release_date ? Date.parse(row.release_date) : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/**
 * Filters and orders rows for display. `searchText` adds text to match, such
 * as a catalogue name; a missing release date sorts last.
 */
export function selectAa3dRows(
  rows: readonly Aa3dRow[],
  options: { query: string; openOnly: boolean; sort: Aa3dSort; searchText?: (row: Aa3dRow) => string },
): Aa3dRow[] {
  const query = options.query.trim().toLowerCase();
  const selected = rows.filter((row) => {
    if (options.openOnly && row.is_open_weights !== true) return false;
    if (!query) return true;
    return [row.name, row.slug, row.creator_name, row.creator_slug, options.searchText?.(row)]
      .some((value) => value?.toLowerCase().includes(query));
  });
  if (options.sort === "release") {
    return selected
      .map((row, index) => ({ row, index }))
      .sort((a, b) => releaseTime(b.row) - releaseTime(a.row) || a.index - b.index)
      .map(({ row }) => row);
  }
  return selected;
}
