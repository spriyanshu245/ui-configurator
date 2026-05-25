"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import CloseIcon from "@/app/components/SVGIcons/Close";
import InlineLoaderIcon from "@/app/components/InternalComponents/InlineLoader/InlineLoader";
import OperationProgress from "@/app/components/OperationProgress/OperationProgress";
import { MicrositesV2 } from "@/app/types/internalTypes";
import {
  DeleteMicrositeOperation,
  DeleteMicrositeOperationStatus,
  DeleteMicrositeSummary,
  DeleteMicrositeWorkflowResult,
  executeDeleteMicrositeOperation,
  OperationProgress as OperationProgressState,
  planMicrositeDelete,
  summarizeDeleteMicrositeOperations,
} from "@/app/utils/micrositeOrchestration";
import styles from "./DeleteMicrositeModal.module.scss";

interface DeleteMicrositeModalProps {
  isOpen: boolean;
  workspaceCode: string;
  microsite: Pick<MicrositesV2, "code" | "name"> | null;
  onClose: () => void;
  onWorkflowComplete: (
    result: DeleteMicrositeWorkflowResult,
  ) => Promise<void> | void;
}

type DeleteMicrositeModalPhase =
  | "loading"
  | "confirm"
  | "running"
  | "paused"
  | "summary"
  | "error";

const statusLabel: Record<DeleteMicrositeOperationStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  succeeded: "Succeeded",
  failed: "Failed",
  skipped: "Skipped",
};

const DeleteMicrositeModal = ({
  isOpen,
  workspaceCode,
  microsite,
  onClose,
  onWorkflowComplete,
}: DeleteMicrositeModalProps) => {
  const [phase, setPhase] = useState<DeleteMicrositeModalPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Awaited<
    ReturnType<typeof planMicrositeDelete>
  > | null>(null);
  const [operations, setOperations] = useState<DeleteMicrositeOperation[]>([]);
  const [progress, setProgress] = useState<OperationProgressState | null>(null);
  const [summary, setSummary] = useState<DeleteMicrositeSummary | null>(null);
  const operationsRef = useRef<DeleteMicrositeOperation[]>([]);

  const setTrackedOperations = (
    updater:
      | DeleteMicrositeOperation[]
      | ((previous: DeleteMicrositeOperation[]) => DeleteMicrositeOperation[]),
  ) => {
    const next =
      typeof updater === "function" ? updater(operationsRef.current) : updater;
    operationsRef.current = next;
    setOperations(next);
  };

  useEffect(() => {
    if (!isOpen || !microsite?.code) {
      return;
    }

    let isActive = true;

    setPhase("loading");
    setLoadError(null);
    setPlan(null);
    setSummary(null);
    setProgress(null);
    setTrackedOperations([]);

    planMicrositeDelete({
      workspaceCode,
      micrositeCode: microsite.code,
    })
      .then((nextPlan) => {
        if (!isActive) {
          return;
        }

        setPlan(nextPlan);
        setTrackedOperations(nextPlan.operations);
        setPhase("confirm");
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load microsite delete preview.",
        );
        setPhase("error");
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, microsite?.code, workspaceCode]);

  const failedOperationIndex = useMemo(
    () => operations.findIndex((operation) => operation.status === "failed"),
    [operations],
  );

  const canDismiss = phase !== "running" && phase !== "paused";

  const updateOperation = (
    operationId: string,
    nextStatus: DeleteMicrositeOperationStatus,
    error?: string,
  ) => {
    setTrackedOperations((previous) =>
      previous.map((operation) =>
        operation.id === operationId
          ? {
              ...operation,
              status: nextStatus,
              error,
            }
          : operation,
      ),
    );
  };

  const finishWorkflow = async (
    finalOperations: DeleteMicrositeOperation[],
  ) => {
    const nextSummary = summarizeDeleteMicrositeOperations(finalOperations);
    setSummary(nextSummary);
    setPhase("summary");
    setProgress(null);
    await onWorkflowComplete({
      summary: nextSummary,
      operations: finalOperations,
    });
  };

  const runWorkflowFrom = async (startIndex: number) => {
    const totalOperations = operationsRef.current.length;
    setPhase("running");

    for (let index = startIndex; index < totalOperations; index += 1) {
      const currentOperation = operationsRef.current[index];

      if (
        currentOperation.status === "succeeded" ||
        currentOperation.status === "skipped"
      ) {
        continue;
      }

      setProgress({
        phase: `deleting-${currentOperation.type}`,
        label: currentOperation.label,
        current: index + 1,
        total: totalOperations,
        detail: currentOperation.detail,
      });
      updateOperation(currentOperation.id, "in_progress");

      try {
        await executeDeleteMicrositeOperation({
          ...currentOperation,
          status: "in_progress",
        });
        updateOperation(currentOperation.id, "succeeded");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Delete request failed.";
        updateOperation(currentOperation.id, "failed", errorMessage);
        setProgress({
          phase: "paused",
          label: currentOperation.label,
          current: index + 1,
          total: totalOperations,
          detail: errorMessage,
        });
        setPhase("paused");
        return;
      }
    }

    await finishWorkflow(operationsRef.current);
  };

  const handleRetry = async () => {
    if (failedOperationIndex === -1) {
      return;
    }

    const failedOperation = operationsRef.current[failedOperationIndex];
    updateOperation(failedOperation.id, "pending");
    await runWorkflowFrom(failedOperationIndex);
  };

  const handleContinue = async () => {
    if (failedOperationIndex === -1) {
      return;
    }

    const failedOperation = operationsRef.current[failedOperationIndex];
    updateOperation(failedOperation.id, "skipped");
    await runWorkflowFrom(failedOperationIndex + 1);
  };

  const handleOverlayClick = () => {
    if (canDismiss) {
      onClose();
    }
  };

  if (!isOpen || !microsite) {
    return null;
  }

  const summaryTitle =
    summary?.result === "success"
      ? "Microsite deletion complete"
      : "Microsite deletion completed with skips";

  const modalTitle: ReactNode =
    phase === "summary" ? (
      summaryTitle
    ) : (
      <>
        Delete <span className={styles.codePill}>{microsite.code}</span>{" "}
        permanently
      </>
    );

  const shouldShowOperationLog =
    phase === "paused" ||
    (phase === "summary" && summary?.result !== "success");
  const isSuccessSummary =
    phase === "summary" && summary?.result === "success";

  return (
    <div
      className={styles.overlay}
      data-testid="delete-microsite-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={styles.modal}
        data-testid="delete-microsite-modal"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{modalTitle}</h2>
            <p className={styles.description}>
              {phase === "summary"
                ? "Review the final outcome before closing this workflow."
                : `This action will permanently delete all versions of the microsite and all pages inside that microsite. This cannot be undone.`}
            </p>
          </div>
          {canDismiss && (
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close delete microsite modal"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div className={styles.body}>
          {phase === "loading" && (
            <div
              className={styles.loadingState}
              data-testid="delete-preview-loading"
            >
              <InlineLoaderIcon />
              <p>Loading delete preview...</p>
            </div>
          )}

          {phase === "error" && (
            <div
              className={styles.errorState}
              data-testid="delete-preview-error"
            >
              <p className={styles.errorText}>
                {loadError ?? "Failed to load delete preview."}
              </p>
            </div>
          )}

          {phase === "confirm" && plan && (
            <div data-testid="delete-preview-content">
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Microsite</span>
                  <strong>{plan.micrositeName}</strong>
                  <span className={styles.summaryMeta}>
                    {plan.micrositeCode}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Versions</span>
                  <strong>{plan.totalMicrositeVersions}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Pages</span>
                  <strong>{plan.totalUniquePageVersions}</strong>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Versions to delete</h3>
                <div className={styles.versionList}>
                  {plan.versions.map((version) => (
                    <div
                      key={version.version}
                      className={styles.versionItem}
                      data-testid={`delete-version-${version.version}`}
                    >
                      <div>
                        <strong>v{version.version}</strong>
                        <p className={styles.versionMeta}>
                          {version.pageCount} pages
                          {version.pageCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={`${styles.statusBadge} ${
                          version.published
                            ? styles.statusPublished
                            : styles.statusDraft
                        }`}
                      >
                        {version.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(phase === "running" || phase === "paused") && (
            <div data-testid="delete-progress-content">
              {progress && (
                <div className={styles.progressPanel}>
                  <OperationProgress progress={progress} />
                </div>
              )}
              {phase === "paused" && (
                <div
                  className={styles.pauseBanner}
                  data-testid="delete-paused-banner"
                >
                  Workflow paused after a hard failure. Retry the failed request
                  or continue by skipping it.
                </div>
              )}
              {shouldShowOperationLog && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Delete operations</h3>
                  <OperationStatusList operations={operations} />
                </div>
              )}
            </div>
          )}

          {phase === "summary" && summary && (
            <div data-testid="delete-summary-content">
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Result</span>
                  <strong>
                    {summary.result === "success"
                      ? "Success"
                      : "Partial success"}
                  </strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    Deleted microsite versions
                  </span>
                  <strong>{summary.deletedMicrositeVersions}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    Deleted page versions
                  </span>
                  <strong>{summary.deletedPageVersions}</strong>
                </div>
                {!isSuccessSummary && (
                  <>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Succeeded</span>
                      <strong>{summary.succeeded}</strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Skipped</span>
                      <strong>{summary.skipped}</strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Failed</span>
                      <strong>{summary.failed}</strong>
                    </div>
                  </>
                )}
              </div>

              <p className={styles.summaryCopy}>
                {summary.result === "success"
                  ? "All planned delete operations completed successfully."
                  : "Some delete operations were skipped. Review the final operation log below."}
              </p>

              {shouldShowOperationLog && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Final operation log</h3>
                  <OperationStatusList operations={operations} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {phase === "confirm" && (
            <>
              <button
                type="button"
                className={`${sharedStyles.button} ${sharedStyles.secondaryButton}`}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="delete-microsite-start"
                className={`${sharedStyles.button} ${styles.dangerButton}`}
                onClick={() => {
                  void runWorkflowFrom(0);
                }}
              >
                Delete permanently
              </button>
            </>
          )}

          {phase === "paused" && (
            <>
              <button
                type="button"
                data-testid="delete-microsite-continue"
                className={`${sharedStyles.button} ${sharedStyles.secondaryButton}`}
                onClick={() => {
                  void handleContinue();
                }}
              >
                Continue
              </button>
              <button
                type="button"
                data-testid="delete-microsite-retry"
                className={`${sharedStyles.button} ${styles.dangerButton}`}
                onClick={() => {
                  void handleRetry();
                }}
              >
                Retry failed delete
              </button>
            </>
          )}

          {(phase === "summary" || phase === "error") && (
            <button
              type="button"
              data-testid="delete-microsite-close"
              className={`${sharedStyles.button} ${sharedStyles.primaryButton}`}
              onClick={onClose}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OperationStatusList = ({
  operations,
}: {
  operations: DeleteMicrositeOperation[];
}) => (
  <div className={styles.operationList} data-testid="delete-operation-list">
    {operations.map((operation) => (
      <div
        key={operation.id}
        className={styles.operationRow}
        data-testid={`delete-operation-${operation.id}`}
      >
        <div className={styles.operationContent}>
          <strong>{operation.label}</strong>
          <span className={styles.operationDetail}>{operation.detail}</span>
          {operation.error && (
            <span className={styles.errorText}>{operation.error}</span>
          )}
        </div>
        <span
          className={`${styles.operationStatus} ${
            styles[`operationStatus${toStatusClassSuffix(operation.status)}`]
          }`}
        >
          {statusLabel[operation.status]}
        </span>
      </div>
    ))}
  </div>
);

const toStatusClassSuffix = (status: DeleteMicrositeOperationStatus) =>
  status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");

export default DeleteMicrositeModal;
