import React from "react";
import { FileText, PanelRight, Home, CornerDownRight, Layers } from "lucide-react";
import styles from "./PageMapCard.module.scss";

interface PageMapNode {
  pageCode: string;
  isPopup: boolean;
  isFirst: boolean;
}
interface PageMapEdge {
  from: string;
  to: string;
  via: "route" | "tab";
}
interface PageMap {
  firstPageCode: string | null;
  nodes: PageMapNode[];
  edges: PageMapEdge[];
  unknownTargets: string[];
}

interface PageMapCardProps {
  pageMap: PageMap;
  activePageCode?: string;
  onNavigate?: (pageCode: string) => void;
}

/** Friendly label: the slug after the microsite prefix (last underscore). */
function pageLabel(code: string): string {
  const idx = code.indexOf("_");
  return idx >= 0 && idx < code.length - 1 ? code.slice(idx + 1) : code;
}

const VIA_LABEL: Record<PageMapEdge["via"], string> = {
  route: "route",
  tab: "tab",
};

export function PageMapCard({ pageMap, activePageCode, onNavigate }: PageMapCardProps) {
  const { nodes, edges, firstPageCode, unknownTargets } = pageMap;
  const byCode = new Map(nodes.map((n) => [n.pageCode, n]));

  // Adjacency + incoming counts to pick roots.
  const children = new Map<string, { to: string; via: PageMapEdge["via"] }[]>();
  const incoming = new Map<string, number>();
  nodes.forEach((n) => incoming.set(n.pageCode, 0));
  edges.forEach((e) => {
    if (!byCode.has(e.from) || !byCode.has(e.to)) return;
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push({ to: e.to, via: e.via });
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  });

  const roots: string[] = [];
  if (firstPageCode && byCode.has(firstPageCode)) roots.push(firstPageCode);
  nodes.forEach((n) => {
    if (n.pageCode === firstPageCode) return;
    if ((incoming.get(n.pageCode) ?? 0) === 0) roots.push(n.pageCode);
  });
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0].pageCode);

  const rendered = new Set<string>();

  const renderNode = (
    code: string,
    via: PageMapEdge["via"] | null,
    path: Set<string>,
    depth: number,
  ): React.ReactNode => {
    const node = byCode.get(code);
    if (!node) return null;
    const isCycle = path.has(code);
    rendered.add(code);
    const kids = isCycle ? [] : children.get(code) ?? [];
    const nextPath = new Set(path).add(code);
    const isActive = code === activePageCode;

    return (
      <li key={`${code}-${depth}`} className={styles.node}>
        <button
          type="button"
          className={`${styles.nodeButton} ${isActive ? styles.nodeActive : ""}`}
          onClick={() => onNavigate?.(code)}
          title={code}
        >
          {via && <CornerDownRight size={12} className={styles.viaIcon} />}
          {node.isFirst ? (
            <Home size={13} />
          ) : node.isPopup ? (
            <PanelRight size={13} />
          ) : (
            <FileText size={13} />
          )}
          <span className={styles.nodeLabel}>{pageLabel(code)}</span>
          {via && <span className={styles.viaBadge}>{VIA_LABEL[via]}</span>}
          {node.isPopup && <span className={styles.popupBadge}>popup</span>}
          {isCycle && <span className={styles.cycleBadge}>↻</span>}
        </button>
        {kids.length > 0 && (
          <ul className={styles.childList}>
            {kids.map((k) => renderNode(k.to, k.via, nextPath, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const tree = (
    <ul className={styles.rootList}>
      {roots.map((r) => renderNode(r, null, new Set(), 0))}
    </ul>
  );

  // Anything never reached from a root (orphan pages).
  const orphans = nodes.filter((n) => !rendered.has(n.pageCode));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Layers size={14} />
        <span>Page map</span>
        <span className={styles.count}>{nodes.length} pages</span>
      </div>
      {tree}
      {orphans.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Unlinked pages</div>
          <ul className={styles.rootList}>
            {orphans.map((o) => renderNode(o.pageCode, null, new Set(), 0))}
          </ul>
        </div>
      )}
      {unknownTargets.length > 0 && (
        <div className={styles.note}>
          Links to unknown pages: {unknownTargets.join(", ")}
        </div>
      )}
    </div>
  );
}
