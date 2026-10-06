import { userPreferences } from "../db/queries/user-preferences";
import { dslHistory } from "../db/queries/dsl-history";
import {
  fetchMicrositePages,
  fetchMicrosites,
} from "./microsite-loader";
import { tempDslOps } from "../db/queries/temp-dsl";
import {
  compactDsl,
  outlineDsl,
  parseDslPath,
  resolveSegments,
  toPointer,
  pointersForId,
  findComponents,
  countDescendants,
  depthOneView,
} from "./dsl-compact";
import { loadPages, getNodeIndex, parseTempDslKey } from "./dsl-store";
import { skillEntries } from "../db/queries/skill-entries";
import { compileAgentSkill } from "./skill-compiler";
import { buildPageMap } from "./page-map";
import { logger } from "./logger";

// Nodes with more nested components than this are returned as a depth-1 view.
const DEPTH_ONE_MIN_DESCENDANTS = 10;

export interface ToolExecutionContext {
  userId?: string;
  micrositeId?: string;
}

type ToolArgs = any;
type ToolHandler = (args: ToolArgs, ctx: ToolExecutionContext) => Promise<unknown> | unknown;
type DslQuery = { tempDslId: string; path?: string; id?: string };

const errorMessage = (e: unknown) => (e as Error).message;

// Return only what the agent needs (the raw backend object is large and
// is resent on every loop iteration once it's in the conversation).
async function getMicrositePages(args: ToolArgs) {
  const data: any = await fetchMicrositePages(args.microsite_id);
  const microsite = data?.dslJson ?? data;
  return {
    code: microsite?.code,
    name: microsite?.name,
    firstPageCode: microsite?.firstPageCode,
    pages: (microsite?.pages ?? []).map((p: any) => ({
      pageCode: p.pageCode,
      pageVersion: p.pageVersion,
    })),
  };
}

async function listMicrosites() {
  try {
    return await fetchMicrosites();
  } catch (e) {
    // Backend list endpoint may be unavailable in some environments; surface
    // the failure to the agent rather than silently returning stale/fake data.
    logger.warn("list_microsites backend fetch failed", { error: errorMessage(e) });
    return { error: `Could not list microsites from the backend: ${errorMessage(e)}` };
  }
}

// Verify the page exists before asking the UI to navigate to it. The chat
// route detects `navigate: true` in this result and emits a `navigate` SSE
// event that the client handles via MicrositeContext.setActivePage.
async function navigateToPage(args: ToolArgs) {
  try {
    const micrositeData = await fetchMicrositePages(args.microsite_id);
    const exists = micrositeData?.pages?.some((p: any) => p.pageCode === args.page_path);
    if (!exists) {
      return { error: `Page "${args.page_path}" not found in microsite "${args.microsite_id}".` };
    }
    return {
      navigate: true,
      pageCode: args.page_path,
      reason: args.reason ?? null,
      message: `Navigating the editor to "${args.page_path}".`,
    };
  } catch (e) {
    return { error: `Could not navigate: ${errorMessage(e)}` };
  }
}

// "*" lists the pages only. Loading every page's outline was the main
// context blow-up (155 pages -> ~565k chars in a single tool result).
async function listPageCodes(micrositeId: string) {
  const micrositeData: any = await fetchMicrositePages(micrositeId);
  const allPages: any[] = (micrositeData?.dslJson ?? micrositeData)?.pages ?? [];
  return {
    totalPages: allPages.length,
    pages: allPages.map((p) => ({ pageCode: p.pageCode, pageVersion: p.pageVersion })),
    note: "Page list only. Call get_page_dsl again with the specific page_paths you need to get their outlines.",
  };
}

function requestedPagePaths(args: ToolArgs): string[] {
  if (Array.isArray(args.page_paths) && args.page_paths.length) return args.page_paths;
  return args.page_path ? [args.page_path] : [];
}

// Pages come from the read-through store (memory -> Mongo -> backend), so a
// page already loaded this session costs no backend or Mongo round trip.
// Returns a compact outline per page instead of raw JSON.
async function getPageDsl(args: ToolArgs) {
  const micrositeId = args.microsite_id;
  if (Array.isArray(args.page_paths) && args.page_paths.includes("*")) {
    return listPageCodes(micrositeId);
  }

  const requested = requestedPagePaths(args);
  if (!requested.length) {
    return { error: "Provide page_path or page_paths." };
  }

  const { pages: loaded, errors } = await loadPages(micrositeId, requested, {
    refresh: Boolean(args.refresh),
  });

  const maxLines = loaded.length > 1 ? 150 : 400;
  const pages = loaded.map((p) => ({
    pageCode: p.pageCode,
    pageVersion: p.pageVersion,
    tempDslId: p.tempDslId,
    outline: outlineDsl(p.dsl, { maxLines }),
  }));

  const note =
    "Outline format: <JSON Pointer> <type> #<id prefix> \"label\" {key props}. Use the pointer in patches, or query_dsl_path (path or id) for a node's JSON.";
  if (requested.length === 1 && pages.length === 1) {
    return { ...pages[0], note };
  }
  return { pages, ...(errors.length ? { errors } : {}), note };
}

// Load every distinct page once, in parallel (grouped per microsite).
async function loadQueriedPages(queries: DslQuery[]) {
  const byMicrosite = new Map<string, Set<string>>();
  for (const q of queries) {
    const key = parseTempDslKey(q.tempDslId);
    if (!key) continue;
    if (!byMicrosite.has(key.micrositeId)) byMicrosite.set(key.micrositeId, new Set());
    byMicrosite.get(key.micrositeId)!.add(key.pageCode);
  }
  const dslByKey = new Map<string, any>();
  await Promise.all(
    [...byMicrosite].map(async ([micrositeId, pageCodes]) => {
      const { pages } = await loadPages(micrositeId, [...pageCodes]);
      for (const p of pages) dslByKey.set(p.tempDslId, p.dsl);
    }),
  );
  return dslByKey;
}

type SegmentResolution = { segments: string[] } | { result: object };

function resolveQuerySegments(q: DslQuery, dsl: any): SegmentResolution {
  const base = { tempDslId: q.tempDslId };
  if (!q.id) return { segments: parseDslPath(q.path) };
  const notFound = { result: { ...base, id: q.id, found: false } };
  if (dsl === undefined) return notFound;
  const pointers = pointersForId(getNodeIndex(dsl), q.id);
  if (pointers.length === 0) return notFound;
  if (pointers.length > 1) {
    return {
      result: { ...base, id: q.id, found: true, ambiguous: true, pointers, note: "Several components match this id prefix; query by pointer." },
    };
  }
  return { segments: parseDslPath(pointers[0]) };
}

function renderQueryValue(base: object, pointer: string, segments: string[], value: any, args: ToolArgs) {
  if (args.outline) return { ...base, pointer, found: true, outline: outlineDsl(value, { basePath: segments }) };
  if (args.full) return { ...base, pointer, found: true, data: value };
  if (countDescendants(value) > DEPTH_ONE_MIN_DESCENDANTS) {
    return {
      ...base,
      pointer,
      found: true,
      view: "depth-1",
      data: depthOneView(value, segments),
      note: "Nested components are shown as one-line stubs; query a stub's pointer for its JSON, or use full: true.",
    };
  }
  return { ...base, pointer, found: true, data: compactDsl(value) ?? value };
}

async function lookupQuery(q: DslQuery, dsl: any, args: ToolArgs) {
  const base = { tempDslId: q.tempDslId };
  const resolved = resolveQuerySegments(q, dsl);
  if ("result" in resolved) return resolved.result;
  const { segments } = resolved;
  const pointer = toPointer(segments) || "/";
  // Legacy keys (not in the store) fall back to a direct Mongo lookup.
  const value = dsl !== undefined
    ? resolveSegments(dsl, segments)
    : await tempDslOps.getDslPath(q.tempDslId, q.path ?? "");
  if (value === undefined) return { ...base, pointer, found: false };
  return renderQueryValue(base, pointer, segments, value, args);
}

// Single lookup or several (queries[]); each by `path` or component `id`
// (full id or the 8-char prefix shown in outlines). Pages are read through
// the in-memory store and grouped, so N lookups on a page cost one load.
async function queryDslPath(args: ToolArgs) {
  const queries: DslQuery[] =
    Array.isArray(args.queries) && args.queries.length
      ? args.queries
      : [{ tempDslId: args.tempDslId, path: args.path, id: args.id }];
  const dslByKey = await loadQueriedPages(queries);
  const rendered = await Promise.all(queries.map((q) => lookupQuery(q, dslByKey.get(q.tempDslId), args)));
  return queries.length === 1 && !Array.isArray(args.queries) ? rendered[0] : { results: rendered };
}

// Search loaded pages via their node index; returns outline lines only.
async function findComponentsTool(args: ToolArgs, ctx: ToolExecutionContext) {
  const micrositeId = args.microsite_id || ctx.micrositeId;
  const pageCodes: string[] = Array.isArray(args.page_paths) ? args.page_paths.filter((p: string) => p !== "*") : [];
  if (!micrositeId || !pageCodes.length) {
    return { error: "Provide microsite_id and page_paths (specific pageCodes)." };
  }
  const filter = {
    type: args.type,
    labelContains: args.labelContains,
    prop: args.prop,
    equals: args.equals === undefined || args.equals === null ? undefined : String(args.equals),
  };
  const { pages, errors } = await loadPages(micrositeId, pageCodes);
  const results = pages.map((p) => {
    const matches = findComponents(getNodeIndex(p.dsl), filter);
    return { pageCode: p.pageCode, tempDslId: p.tempDslId, count: matches.length, matches };
  });
  return { results, ...(errors.length ? { errors } : {}) };
}

// Drop full patch bodies — op count + description is enough to pick a
// rollback target, and the bodies can be large.
async function getDslHistory(args: ToolArgs) {
  const summaries = (await dslHistory.getHistorySummaries(args.microsite_id, args.page_path, args.limit)) ?? [];
  return summaries.map(({ patchApplied, ...rest }: any) => ({
    ...rest,
    patchOpCount: Array.isArray(patchApplied) ? patchApplied.length : 0,
  }));
}

async function logUserPreference(args: ToolArgs, ctx: ToolExecutionContext) {
  const userId = ctx.userId || "anonymous";
  const micrositeId = ctx.micrositeId || "__global__";
  await userPreferences.set(userId, micrositeId, args.key, args.value);
  return { success: true };
}

async function showPageMap(args: ToolArgs, ctx: ToolExecutionContext) {
  try {
    const micrositeId = args.microsite_id || ctx.micrositeId;
    if (!micrositeId) return { error: "No microsite id available for the page map." };
    const pageMap = await buildPageMap(micrositeId);
    return { pageMap };
  } catch (e) {
    return { error: `Could not build the page map: ${errorMessage(e)}` };
  }
}

function suggestNextActions(args: ToolArgs) {
  const raw = Array.isArray(args?.suggestions) ? args.suggestions : [];
  const suggestions = raw
    .filter((s: any) => s && typeof s.label === "string" && typeof s.value === "string")
    .slice(0, 4)
    .map((s: any, i: number) => ({
      id: `sg-${i}`,
      label: s.label.slice(0, 60),
      value: s.value,
    }));
  return { suggestions };
}

async function recordSkill(args: ToolArgs) {
  const { category, title, content } = args;
  if (!title || !content) {
    return { error: "record_skill requires a title and content." };
  }
  try {
    await skillEntries.upsert({
      category: category || "component_pattern",
      title,
      content,
      confidence: 0.8,
      source: "agent_reflection",
    });
    await compileAgentSkill();
    await skillEntries.enforceBounds();
    return { success: true, message: `Recorded skill: "${title}".` };
  } catch (e) {
    logger.error("record_skill failed", { error: errorMessage(e) });
    return { error: `Failed to record skill: ${errorMessage(e)}` };
  }
}

async function proposeRollback(args: ToolArgs) {
  const { microsite_id, page_path, steps_back, reason } = args;
  const clampedStepsBack = Math.min(3, Math.max(1, Number(steps_back) || 1));

  const summaries = await dslHistory.getHistorySummaries(microsite_id, page_path, 3);

  if (!summaries || summaries.length === 0) {
    return {
      queued: false,
      message: `No snapshot history available for "${page_path}" in "${microsite_id}".`,
    };
  }

  const target = summaries[clampedStepsBack - 1];
  if (!target) {
    return {
      queued: false,
      message: `Only ${summaries.length} snapshot(s) available for "${page_path}" — cannot go back ${clampedStepsBack} step(s).`,
    };
  }

  return {
    queued: true,
    rollback: {
      historyId: target.id,
      micrositeId: target.micrositeId,
      pagePath: target.pagePath,
      description: target.description,
      createdAt: target.createdAt,
      reason,
    },
    message: `Rollback proposed to snapshot from ${target.createdAt} ("${target.description}"). Awaiting user confirmation — this does NOT auto-apply.`,
  };
}

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  get_microsite_pages: getMicrositePages,
  list_microsites: listMicrosites,
  navigate_to_page: navigateToPage,
  get_page_dsl: getPageDsl,
  query_dsl_path: queryDslPath,
  find_components: findComponentsTool,
  get_dsl_history: getDslHistory,
  log_user_preference: logUserPreference,
  show_page_map: showPageMap,
  suggest_next_actions: suggestNextActions,
  record_skill: recordSkill,
  propose_rollback: proposeRollback,
};

export async function executeTool(
  name: string,
  args: any,
  ctx: ToolExecutionContext = {},
) {
  const handler = Object.hasOwn(TOOL_HANDLERS, name) ? TOOL_HANDLERS[name] : undefined;
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args, ctx);
}
