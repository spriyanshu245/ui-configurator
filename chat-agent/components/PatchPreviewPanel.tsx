"use client";
import React, { Suspense, useState } from "react";
import { X, Layers, Boxes, Minus, Maximize2 } from "lucide-react";
import type { PreviewComponent } from "../lib/added-components";
import { DragProvider } from "../../src/app/context/DragContext";
import { PropertyPaneProvider } from "../../src/app/context/PropertiesContext";
import styles from "./PatchPreviewPanel.module.scss";

// The real builder renderer is heavy (pulls in ~50 UI components), so only load
// it when the user switches to the Live tab.
const LiveComponentRenderer = React.lazy(
  () => import("../../src/app/components/ComponentRenderer/ComponentRenderer"),
);

class RenderErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    /* swallow — the fallback (structured view) is shown instead */
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function StructuredNode({ node }: { node: PreviewComponent }) {
  return (
    <div className={styles.node}>
      <div className={styles.nodeHead}>
        <Boxes size={13} />
        <span className={styles.nodeType}>{node.type}</span>
        {node.label && <span className={styles.nodeLabel}>{node.label}</span>}
        {node.op === "replace" && <span className={styles.opBadge}>changed</span>}
      </div>
      {node.fields.length > 0 && (
        <ul className={styles.fields}>
          {node.fields.map((f, i) => (
            <li key={i}>
              <span className={styles.fieldKey}>{f.key}</span>
              <span className={styles.fieldVal}>{f.value}</span>
            </li>
          ))}
        </ul>
      )}
      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((c, i) => (
            <StructuredNode key={i} node={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function StructuredView({ components }: { components: PreviewComponent[] }) {
  return (
    <div className={styles.structured}>
      {components.map((c, i) => (
        <StructuredNode key={i} node={c} />
      ))}
    </div>
  );
}

interface PatchPreviewPanelProps {
  open: boolean;
  /** Short header title, e.g. "Preview · 3 components". */
  title?: string;
  /** Optional longer description (e.g. the change summary), shown truncated. */
  subtitle?: string;
  components: PreviewComponent[];
  rawNodes: Record<string, any>[];
  /** Panel width in px. */
  width: number;
  /** px from the right edge (so it sits just left of the chat panel). */
  offsetRight: number;
  onClose: () => void;
}

export function PatchPreviewPanel({
  open,
  title,
  subtitle,
  components,
  rawNodes,
  width,
  offsetRight,
  onClose,
}: PatchPreviewPanelProps) {
  const [mode, setMode] = useState<"structured" | "live">("structured");
  const [collapsed, setCollapsed] = useState(false);
  if (!open) return null;

  const empty = components.length === 0;

  return (
    <div
      className={styles.panel}
      style={{ width, right: offsetRight }}
      role="dialog"
      aria-label="Component preview"
    >
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <Layers size={15} className={styles.headerIcon} />
          <div className={styles.titleWrap}>
            <span className={styles.title}>{title || "Preview"}</span>
            {subtitle && !collapsed && (
              <span className={styles.subtitle} title={subtitle}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className={styles.headerControls}>
          {!empty && !collapsed && (
            <div className={styles.modeToggle} role="tablist">
              <button
                type="button"
                className={mode === "structured" ? styles.modeActive : ""}
                onClick={() => setMode("structured")}
              >
                Fields
              </button>
              <button
                type="button"
                className={mode === "live" ? styles.modeActive : ""}
                onClick={() => setMode("live")}
              >
                Live
              </button>
            </div>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand preview" : "Minimize preview"}
            title={collapsed ? "Expand" : "Minimize"}
          >
            {collapsed ? <Maximize2 size={15} /> : <Minus size={16} />}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close preview"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          {empty ? (
            <div className={styles.empty}>This change adds no new components.</div>
          ) : mode === "structured" ? (
            <StructuredView components={components} />
          ) : (
            <RenderErrorBoundary
              fallback={
                <div>
                  <div className={styles.liveNote}>
                    Live preview unavailable for this change — showing fields instead.
                  </div>
                  <StructuredView components={components} />
                </div>
              }
            >
              <Suspense fallback={<div className={styles.empty}>Loading live preview…</div>}>
                {/* Fresh providers so the renderer's hooks resolve; the canvas is
                    non-interactive to avoid touching the real editor state. */}
                <DragProvider>
                  <PropertyPaneProvider>
                    <div className={styles.canvas}>
                      {rawNodes.map((n, i) => (
                        <LiveComponentRenderer key={i} component={n as any} />
                      ))}
                    </div>
                  </PropertyPaneProvider>
                </DragProvider>
              </Suspense>
            </RenderErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
}
