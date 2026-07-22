import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Operation } from "fast-json-patch";
import { Differ, Viewer } from "json-diff-kit";
import "json-diff-kit/dist/viewer.css";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { lintGutter, linter } from "@codemirror/lint";
import { Check, X, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { scopeDiffToPatch } from "../lib/scope-diff";
import { DiffChunk } from "./DiffChunk";
import styles from "./DslDiffViewer.module.scss";

interface DslDiffViewerProps {
  currentDsl: unknown;
  patchedDsl: unknown;
  description?: string;
  previewHint?: string;
  patchId?: string;
  toolCallId?: string;
  /**
   * Optional RFC-6902 ops that produced patchedDsl from currentDsl. When
   * present, the View Diff tab is scoped down to per-component chunks
   * derived from these ops. When absent (e.g. the batch viewer, which
   * doesn't carry a raw patch), falls back to the original whole-document
   * diff view.
   */
  patch?: Operation[];
  onApprove?: (patchId: string | undefined, toolCallId: string | undefined, dsl: any) => void | Promise<void>;
  onReject?: (patchId: string | undefined, reason: string, toolCallId: string | undefined) => void | Promise<void>;
  hideActions?: boolean;
}

export function DslDiffViewer({
  currentDsl,
  patchedDsl,
  description,
  previewHint,
  patchId,
  toolCallId,
  patch,
  onApprove,
  onReject,
  hideActions = false,
}: DslDiffViewerProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "edit">("diff");
  const [editedDsl, setEditedDsl] = useState<string>(() =>
    JSON.stringify(patchedDsl, null, 2),
  );
  const [parsedEditedDsl, setParsedEditedDsl] = useState<any>(patchedDsl);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const diffContainerRef = useRef<HTMLDivElement>(null);
  const [changeNodes, setChangeNodes] = useState<Element[]>([]);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  const differ = useMemo(
    () =>
      new Differ({
        detectCircular: true,
        maxDepth: Infinity,
        showModifications: true,
        arrayDiffMethod: "lcs",
      }),
    [],
  );

  // Whole-document diff — used only as a fallback when no `patch` prop is
  // supplied (e.g. the batch viewer reuses this component without the raw
  // RFC-6902 ops), preserving the original pre-scoping behavior.
  const diff = useMemo(() => {
    try {
      return differ.diff(currentDsl, parsedEditedDsl);
    } catch (e) {
      return [[], []] as any;
    }
  }, [currentDsl, parsedEditedDsl, differ]);

  // Scoped, per-component diff chunks derived from the patch ops. Recomputes
  // whenever the user edits the raw patch in the "Edit Patch" tab, since
  // parsedEditedDsl feeds into it.
  const chunks = useMemo(() => {
    if (!patch || patch.length === 0) return null;
    try {
      return scopeDiffToPatch(currentDsl, parsedEditedDsl, patch);
    } catch (e) {
      return null;
    }
  }, [currentDsl, parsedEditedDsl, patch]);

  // Component ids/types touched by the scoped chunks, derived from the real
  // chunk data (replaces the previous empty no-op stub).
  const affectedComponents = useMemo(() => {
    if (!chunks) return [];
    const ids = new Set<string>();
    for (const chunk of chunks) {
      const node = (chunk.after ?? chunk.before) as any;
      if (node && typeof node === "object" && typeof node.id === "string") {
        ids.add(node.type ? `${node.id} (${node.type})` : node.id);
      }
    }
    return Array.from(ids);
  }, [chunks]);

  useEffect(() => {
    if (activeTab === "diff" && diffContainerRef.current) {
      setTimeout(() => {
        if (!diffContainerRef.current) return;
        const nodes = Array.from(
          diffContainerRef.current.querySelectorAll(
            '.json-diff-viewer-line-added, .json-diff-viewer-line-deleted, .json-diff-viewer-line-modified, [class*="added"], [class*="deleted"], [class*="modified"]',
          ),
        ).filter((n) => n.tagName === "TR" || n.tagName === "DIV");
        setChangeNodes(nodes);
        if (nodes.length > 0) {
          nodes[0].scrollIntoView({ behavior: "smooth", block: "center" });
          setCurrentChangeIndex(0);
        }
      }, 100);
    }
    // Depends on `chunks` (scoped view) as well as `diff` (whole-doc
    // fallback view) since either may be what's actually rendered in the DOM
    // under diffContainerRef.
  }, [activeTab, diff, chunks]);

  const goToNextChange = () => {
    if (changeNodes.length === 0) return;
    const nextIdx = (currentChangeIndex + 1) % changeNodes.length;
    setCurrentChangeIndex(nextIdx);
    changeNodes[nextIdx].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const goToPrevChange = () => {
    if (changeNodes.length === 0) return;
    const prevIdx =
      (currentChangeIndex - 1 + changeNodes.length) % changeNodes.length;
    setCurrentChangeIndex(prevIdx);
    changeNodes[prevIdx].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleEditChange = (value: string) => {
    setEditedDsl(value);
    try {
      const parsed = JSON.parse(value);
      setParsedEditedDsl(parsed);
      setIsJsonValid(true);
    } catch (e) {
      setIsJsonValid(false);
    }
  };

  const handleApprove = async () => {
    if (!isJsonValid) return;
    setIsApproving(true);
    try {
      await onApprove?.(patchId, toolCallId, parsedEditedDsl);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReasonOpen) {
      setRejectReasonOpen(true);
      return;
    }
    setIsRejecting(true);
    try {
      await onReject?.(
        patchId,
        rejectReason || "User rejected manually",
        toolCallId,
      );
    } finally {
      setIsRejecting(false);
      setRejectReasonOpen(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div className={styles.container}>
      {/* Header Tabs & Info */}
      <div className={styles.header}>
        <h4 className={styles.headerTitle}>Proposed Patch</h4>
        {description && <p className={styles.description}>{description}</p>}
        {previewHint && (
          <p className={styles.previewHint}>
            <em>Hint: {previewHint}</em>
          </p>
        )}

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("diff")}
            className={`${styles.tabButton} ${activeTab === "diff" ? styles.active : ""}`}
          >
            View Diff
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`${styles.tabButton} ${activeTab === "edit" ? styles.active : ""}`}
          >
            Edit Patch
          </button>
        </div>
      </div>

      {/* Editor / Diff Area */}
      <div className={styles.diffArea} ref={diffContainerRef}>
        {activeTab === "diff" && (
          <div className={styles.diffTabContent}>
            {chunks ? (
              chunks.length > 0 ? (
                chunks.map((chunk) => (
                  <DiffChunk
                    key={chunk.key}
                    chunk={chunk}
                    defaultOpen={chunks.length <= 3}
                  />
                ))
              ) : (
                <Viewer diff={diff} />
              )
            ) : (
              <Viewer diff={diff} />
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div className={styles.editTabContent}>
            {!isJsonValid && (
              <div className={styles.invalidWarning}>
                <AlertTriangle size={16} /> You are editing the raw patch.
                Invalid JSON will block approval.
              </div>
            )}
            {isJsonValid && (
              <div className={styles.validWarning}>
                <AlertTriangle size={16} /> You are editing the raw patch.
                Invalid JSON will block approval.
              </div>
            )}
            <CodeMirror
              value={editedDsl}
              height="100%"
              extensions={[json(), linter(jsonParseLinter()), lintGutter()]}
              onChange={handleEditChange}
              className={styles.codeMirror}
            />
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className={styles.actionBar}>
        {/* Diff Nav */}
        {activeTab === "diff" && changeNodes.length > 0 && (
          <div className={styles.diffNav}>
            <button onClick={goToPrevChange} className={styles.navButton}>
              <ArrowUp size={14} />
            </button>
            <span>
              Change {currentChangeIndex + 1} of {changeNodes.length}
            </span>
            <button onClick={goToNextChange} className={styles.navButton}>
              <ArrowDown size={14} />
            </button>
          </div>
        )}

        {!hideActions && (
          <div className={styles.actionsContainer}>
            <button
              onClick={handleApprove}
              disabled={isApproving || !isJsonValid}
              className={`${styles.approveBtn} ${!isJsonValid || isApproving ? styles.disabled : ""}`}
            >
              <Check size={16} /> {isApproving ? "Applying..." : "✓ Apply Change"}
            </button>

            {!rejectReasonOpen ? (
              <button onClick={handleReject} className={styles.rejectBtn}>
                <X size={16} /> ✗ Reject
              </button>
            ) : (
              <div className={styles.rejectReasonContainer}>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={styles.rejectInput}
                  autoFocus
                />
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className={styles.rejectConfirmBtn}
                >
                  Confirm
                </button>
              </div>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className={styles.closeBtn}
            >
              ✕ Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
