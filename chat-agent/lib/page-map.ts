import { fetchMicrositePages, fetchPageDsl } from "./microsite-loader";
import { logger } from "./logger";

export interface PageMapNode {
  pageCode: string;
  isPopup: boolean;
  isFirst: boolean;
}

export interface PageMapEdge {
  from: string;
  to: string;
  /** How the link is expressed in the source page's DSL. */
  via: "route" | "tab";
}

export interface PageMap {
  firstPageCode: string | null;
  nodes: PageMapNode[];
  edges: PageMapEdge[];
  /** routePage/pageCode targets that don't resolve to a known page. */
  unknownTargets: string[];
}

const MAX_PAGES = 60;

type PageRef = { to: string; via: PageMapEdge["via"] };

/** The routing reference held by one DSL key/value pair, if any. */
function refFromEntry(key: string, value: unknown): PageRef | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (key === "routePage") return { to: value.trim(), via: "route" };
  if (key === "pageCode") return { to: value.trim(), via: "tab" };
  return undefined;
}

/** Deep-walk a page DSL collecting routePage / pageCode references. */
function collectRefs(dsl: any): PageRef[] {
  const refs: PageRef[] = [];
  const seen = new Set<any>();

  const walk = (node: any) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      const ref = refFromEntry(key, value);
      if (ref) refs.push(ref);
      else if (value && typeof value === "object") walk(value);
    }
  };

  walk(dsl);
  return refs;
}

/** Best-effort page DSL load: a failure is logged and yields null. */
async function loadPageDsl(page: any): Promise<any> {
  try {
    return await fetchPageDsl(page.pageCode, page.pageVersion || 1);
  } catch (e) {
    logger.warn("buildPageMap: failed to load page DSL", {
      pageCode: page.pageCode,
      error: (e as Error).message,
    });
    return null;
  }
}

/**
 * Build a page-hierarchy graph for a microsite by loading each page's DSL and
 * deriving edges from routing references: component `routePage` (buttons, table
 * columns, multi-action `routeConfig`) and tabs' bare `pageCode`. A target page's
 * own `properties.showAsPopup` marks it as a popup node. Best-effort: a page whose
 * DSL fails to load is still listed as a node, just without outgoing edges.
 */
export async function buildPageMap(micrositeId: string): Promise<PageMap> {
  const data = await fetchMicrositePages(micrositeId);
  const microsite = data?.dslJson ?? data;
  const pages: any[] = Array.isArray(microsite?.pages) ? microsite.pages : [];
  const firstPageCode: string | null =
    microsite?.firstPageCode ?? pages[0]?.pageCode ?? null;
  const known = new Set(pages.map((p) => p.pageCode));

  const nodes: PageMapNode[] = [];
  const edgeKeys = new Set<string>();
  const edges: PageMapEdge[] = [];
  const unknown = new Set<string>();

  const recordRef = (from: string, ref: PageRef) => {
    if (ref.to === from) return; // ignore self-references
    if (!known.has(ref.to)) {
      unknown.add(ref.to);
      return;
    }
    const key = `${from}->${ref.to}:${ref.via}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to: ref.to, via: ref.via });
  };

  for (const p of pages.slice(0, MAX_PAGES)) {
    const dsl = await loadPageDsl(p);
    const pageDsl = dsl?.dslJson ?? dsl;
    nodes.push({
      pageCode: p.pageCode,
      isPopup: Boolean(pageDsl?.properties?.showAsPopup),
      isFirst: p.pageCode === firstPageCode,
    });
    if (pageDsl) collectRefs(pageDsl).forEach((ref) => recordRef(p.pageCode, ref));
  }

  return { firstPageCode, nodes, edges, unknownTargets: [...unknown] };
}
