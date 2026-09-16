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

/** Deep-walk a page DSL collecting routePage / pageCode references. */
function collectRefs(dsl: any): Array<{ to: string; via: PageMapEdge["via"] }> {
  const refs: Array<{ to: string; via: PageMapEdge["via"] }> = [];
  const seen = new Set<any>();

  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "routePage" && typeof value === "string" && value.trim()) {
        refs.push({ to: value.trim(), via: "route" });
      } else if (key === "pageCode" && typeof value === "string" && value.trim()) {
        refs.push({ to: value.trim(), via: "tab" });
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  };

  walk(dsl);
  return refs;
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

  for (const p of pages.slice(0, MAX_PAGES)) {
    let dsl: any = null;
    try {
      dsl = await fetchPageDsl(p.pageCode, p.pageVersion || 1);
    } catch (e) {
      logger.warn("buildPageMap: failed to load page DSL", {
        pageCode: p.pageCode,
        error: (e as Error).message,
      });
    }
    const pageDsl = dsl?.dslJson ?? dsl;
    const isPopup = Boolean(pageDsl?.properties?.showAsPopup);
    nodes.push({
      pageCode: p.pageCode,
      isPopup,
      isFirst: p.pageCode === firstPageCode,
    });

    if (!pageDsl) continue;
    for (const ref of collectRefs(pageDsl)) {
      if (ref.to === p.pageCode) continue; // ignore self-references
      if (known.has(ref.to)) {
        const key = `${p.pageCode}->${ref.to}:${ref.via}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ from: p.pageCode, to: ref.to, via: ref.via });
        }
      } else {
        unknown.add(ref.to);
      }
    }
  }

  return { firstPageCode, nodes, edges, unknownTargets: [...unknown] };
}
