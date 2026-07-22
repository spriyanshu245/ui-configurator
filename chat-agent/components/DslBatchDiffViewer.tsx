import React, { useState } from "react";
import { DslDiffViewer } from "./DslDiffViewer";
import { Check, X, ChevronDown, ChevronRight, FileText } from "lucide-react";
import styles from "./DslBatchDiffViewer.module.scss";

type BatchOperation = {
  pagePath: string;
  description?: string;
  previewHint?: string;
  affectedComponents?: string[];
  currentDsl: unknown;
  patchedDsl: unknown;
  status?: string;
};

type BatchProposal = {
  id: string;
  batchDescription?: string;
  navigateTo?: string | null;
  operations: BatchOperation[];
};

interface DslBatchDiffViewerProps {
  batch: BatchProposal;
  toolCallId?: string;
  onApproveBatch: (batchId: string, toolCallId?: string) => void | Promise<void>;
  onRejectBatch: (batchId: string, reason?: string) => void | Promise<void>;
}

export function DslBatchDiffViewer({
  batch,
  toolCallId,
  onApproveBatch,
  onRejectBatch,
}: DslBatchDiffViewerProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    () => new Set(batch.operations.length === 1 ? [batch.operations[0].pagePath] : []),
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const togglePage = (pagePath: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pagePath)) next.delete(pagePath);
      else next.add(pagePath);
      return next;
    });
  };

  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      await onApproveBatch(batch.id, toolCallId);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectAll = async () => {
    if (!rejectReasonOpen) {
      setRejectReasonOpen(true);
      return;
    }
    setIsRejecting(true);
    try {
      await onRejectBatch(batch.id, rejectReason || "User rejected batch");
    } finally {
      setIsRejecting(false);
      setRejectReasonOpen(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.headerTitle}>
          Proposed Batch Change ({batch.operations.length}{" "}
          {batch.operations.length === 1 ? "page" : "pages"})
        </h4>
        {batch.batchDescription && (
          <p className={styles.description}>{batch.batchDescription}</p>
        )}
        {batch.navigateTo && (
          <p className={styles.navigateHint}>
            <em>After approval, you'll be taken to: {batch.navigateTo}</em>
          </p>
        )}
        <p className={styles.allOrNothingNote}>
          All-or-nothing: approving applies every page below together. If any
          page fails to save, all previously applied pages are automatically
          reverted.
        </p>
      </div>

      <div className={styles.pagesList}>
        {batch.operations.map((op) => {
          const isExpanded = expandedPages.has(op.pagePath);
          return (
            <div key={op.pagePath} className={styles.pageSection}>
              <button
                type="button"
                className={styles.pageSectionHeader}
                onClick={() => togglePage(op.pagePath)}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <FileText size={14} />
                <span className={styles.pagePath}>{op.pagePath}</span>
                {op.description && (
                  <span className={styles.pageDescription}>
                    {op.description}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className={styles.pageSectionBody}>
                  <DslDiffViewer
                    currentDsl={op.currentDsl}
                    patchedDsl={op.patchedDsl}
                    description={op.description}
                    previewHint={op.previewHint}
                    hideActions
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actionBar}>
        <button
          onClick={handleApproveAll}
          disabled={isApproving || isRejecting}
          className={`${styles.approveBtn} ${isApproving ? styles.disabled : ""}`}
        >
          <Check size={16} />{" "}
          {isApproving ? "Applying all pages..." : "✓ Approve All"}
        </button>

        {!rejectReasonOpen ? (
          <button
            onClick={handleRejectAll}
            disabled={isApproving}
            className={styles.rejectBtn}
          >
            <X size={16} /> ✗ Reject All
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
              onClick={handleRejectAll}
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
    </div>
  );
}
