import { fetchMicrositePages, fetchPageDsl } from "./microsite-loader";
import { tempDslOps } from "../db/queries/temp-dsl";
import { getCachedDsl, primeDslCache, onDslCacheUpdate } from "./dsl-patcher";
import { buildNodeIndex, type NodeIndex } from "./dsl-compact";
import { logger } from "./logger";

/**
 * Read-through store for page DSL used by the agent's read tools.
 *
 *   L1  in-process  — the patcher's dslCache (shared with queuePatch/queueBatch)
 *                     plus a node index built once per loaded DSL.
 *   L2  Mongo       — temp_dsl, shared across restarts/instances; several pages
 *                     come back in ONE $in query.
 *   L3  backend     — only for misses, fetched in parallel, then stored in L2
 *                     with ONE bulk write.
 *
 * Authoritative saves (approve / approve-batch / rollback) go through
 * updateDslCache → the listener below refreshes L2, so reads are never stale.
 * Entries older than FRESH_MS are re-validated against the backend, so edits
 * made outside the agent (in the configurator UI) are picked up too.
 */

const FRESH_MS = 5 * 60 * 1000;

/** When each page was last loaded/saved through this store (L1 freshness). */
const loadedAt = new Map<string, number>();
const indexCache = new WeakMap<object, NodeIndex>();

export const tempDslKey = (micrositeId: string, pageCode: string) => `dsl:${micrositeId}:${pageCode}`;

/** Inverse of tempDslKey; undefined for legacy (uuid) keys. */
export function parseTempDslKey(key: string): { micrositeId: string; pageCode: string } | undefined {
  const m = /^dsl:([^:]+):(.+)$/.exec(key ?? "");
  return m ? { micrositeId: m[1], pageCode: m[2] } : undefined;
}

// Write-through: keep L2 in sync with every authoritative save.
onDslCacheUpdate((pageCode, dsl, pageVersion) => {
  loadedAt.set(pageCode, Date.now());
  tempDslOps
    .refreshByPageCode(pageCode, dsl, pageVersion)
    .catch((e) => logger.warn("temp_dsl write-through failed", { pageCode, error: (e as Error).message }));
});

export function getNodeIndex(dsl: any): NodeIndex {
  let index = indexCache.get(dsl);
  if (!index) {
    index = buildNodeIndex(dsl);
    if (dsl && typeof dsl === "object") indexCache.set(dsl, index);
  }
  return index;
}

export interface LoadedPage {
  pageCode: string;
  pageVersion: number;
  dsl: any;
  tempDslId: string;
  source: "memory" | "mongo" | "backend";
}

export interface LoadPagesResult {
  pages: LoadedPage[];
  errors: Array<{ pageCode: string; error: string }>;
}

function isFresh(pageCode: string, now: number): boolean {
  const at = loadedAt.get(pageCode);
  return at !== undefined && now - at < FRESH_MS;
}

type PageList = Array<{ pageCode: string; pageVersion?: number }>;

interface LoadContext {
  micrositeId: string;
  now: number;
  found: Map<string, LoadedPage>;
}

const toLoadedPage = (
  ctx: LoadContext,
  p: { pageCode: string; pageVersion: number; dsl: any },
  source: LoadedPage["source"],
): LoadedPage => ({ ...p, tempDslId: tempDslKey(ctx.micrositeId, p.pageCode), source });

/** L1: in-process cache. Returns the page codes still to load. */
function loadFromMemory(ctx: LoadContext, pageCodes: string[]): string[] {
  const pending: string[] = [];
  for (const pageCode of pageCodes) {
    const cached = getCachedDsl(pageCode);
    if (cached && isFresh(pageCode, ctx.now)) {
      ctx.found.set(pageCode, toLoadedPage(ctx, { pageCode, pageVersion: cached.pageVersion, dsl: cached.dsl }, "memory"));
    } else {
      pending.push(pageCode);
    }
  }
  return pending;
}

/** L2: Mongo, one $in query for everything still missing. Returns the remaining misses. */
async function loadFromMongo(ctx: LoadContext, pending: string[]): Promise<string[]> {
  try {
    const docs = await tempDslOps.getMany(pending.map((p) => tempDslKey(ctx.micrositeId, p)));
    const byKey = new Map(docs.map((d) => [d.toolCallId, d]));
    const stillMissing: string[] = [];
    for (const pageCode of pending) {
      const doc = byKey.get(tempDslKey(ctx.micrositeId, pageCode));
      const createdAt = doc?.createdAt ? new Date(doc.createdAt).getTime() : 0;
      if (doc?.dsl !== undefined && ctx.now - createdAt < FRESH_MS) {
        const pageVersion = doc.pageVersion ?? 1;
        primeDslCache(pageCode, doc.dsl, pageVersion);
        loadedAt.set(pageCode, createdAt);
        ctx.found.set(pageCode, toLoadedPage(ctx, { pageCode, pageVersion, dsl: doc.dsl }, "mongo"));
      } else {
        stillMissing.push(pageCode);
      }
    }
    return stillMissing;
  } catch (e) {
    logger.warn("temp_dsl read failed; falling back to backend", { error: (e as Error).message });
    return pending;
  }
}

async function resolvePageList(micrositeId: string, pageList?: PageList): Promise<PageList> {
  if (pageList) return pageList;
  const micrositeData: any = await fetchMicrositePages(micrositeId);
  return (micrositeData?.dslJson ?? micrositeData)?.pages ?? [];
}

/** L3: backend, in parallel; one bulk write back to L2. */
async function loadFromBackend(
  ctx: LoadContext,
  pending: string[],
  pageList: PageList | undefined,
  errors: LoadPagesResult["errors"],
) {
  const pages = await resolvePageList(ctx.micrositeId, pageList);
  const results = await Promise.allSettled(
    pending.map(async (pageCode) => {
      const page = pages.find((p) => p.pageCode === pageCode);
      if (!page) throw new Error(`Page "${pageCode}" not found.`);
      const pageVersion = page.pageVersion || 1;
      const dsl = await fetchPageDsl(pageCode, pageVersion);
      return { pageCode, pageVersion, dsl };
    }),
  );
  const loaded: Array<{ pageCode: string; pageVersion: number; dsl: any }> = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") loaded.push(r.value);
    else errors.push({ pageCode: pending[i], error: (r.reason as Error)?.message ?? String(r.reason) });
  });
  const loadedNow = Date.now();
  for (const p of loaded) {
    primeDslCache(p.pageCode, p.dsl, p.pageVersion);
    loadedAt.set(p.pageCode, loadedNow);
    ctx.found.set(p.pageCode, toLoadedPage(ctx, p, "backend"));
  }
  if (!loaded.length) return;
  await tempDslOps
    .storeMany(
      loaded.map((p) => ({
        toolCallId: tempDslKey(ctx.micrositeId, p.pageCode),
        dsl: p.dsl,
        meta: { micrositeId: ctx.micrositeId, pageCode: p.pageCode, pageVersion: p.pageVersion },
      })),
    )
    .catch((e) => logger.warn("temp_dsl store failed", { error: (e as Error).message }));
}

/**
 * Load several pages through L1 → L2 → L3. Results keep the requested order.
 * `refresh: true` skips L1/L2 and reloads from the backend.
 * `pageList` (microsite pages[]) avoids a second microsite fetch when the
 * caller already has it.
 */
export async function loadPages(
  micrositeId: string,
  pageCodes: string[],
  opts: { refresh?: boolean; pageList?: PageList } = {},
): Promise<LoadPagesResult> {
  const ctx: LoadContext = { micrositeId, now: Date.now(), found: new Map() };
  const errors: LoadPagesResult["errors"] = [];

  let pending = pageCodes;
  if (!opts.refresh) {
    pending = loadFromMemory(ctx, pageCodes);
    if (pending.length) pending = await loadFromMongo(ctx, pending);
  }
  if (pending.length) await loadFromBackend(ctx, pending, opts.pageList, errors);

  return {
    pages: pageCodes.map((p) => ctx.found.get(p)).filter((p): p is LoadedPage => !!p),
    errors,
  };
}

/** Test helper: forget freshness state. */
export function __resetDslStoreForTests() {
  loadedAt.clear();
}
