import React, { useState } from "react";
import styles from "./RollbackPanel.module.scss";

export interface RollbackHistoryEntry {
  id: string;
  description?: string;
  createdAt: string;
  operation?: string;
}

export interface RollbackPanelProps {
  history: RollbackHistoryEntry[];
  micrositeId: string;
  pagePath: string;
  onRollback: (historyId: string) => void | Promise<void>;
}

export function RollbackPanel({
  history,
  micrositeId,
  pagePath,
  onRollback,
}: Readonly<RollbackPanelProps>) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [inFlightId, setInFlightId] = useState<string | null>(null);

  const isBusy = inFlightId !== null;

  const handleRollbackClick = (id: string) => {
    setConfirmingId(id);
  };

  const handleConfirm = async (id: string) => {
    setInFlightId(id);
    try {
      await onRollback(id);
    } finally {
      setInFlightId(null);
      setConfirmingId(null);
    }
  };

  const handleCancel = () => {
    setConfirmingId(null);
  };

  return (
    <div className={styles.container} data-microsite-id={micrositeId} data-page-path={pagePath}>
      <h3>Rollback History</h3>
      {history && history.length > 0 ? (
        <ul>
          {history.map((h) => (
            <li key={h.id}>
              <span>
                {h.description} - {new Date(h.createdAt).toLocaleString()}
              </span>

              {confirmingId === h.id ? (
                <span className={styles.confirmRow}>
                  <span>Confirm revert?</span>
                  <button
                    disabled={isBusy}
                    onClick={() => handleConfirm(h.id)}
                  >
                    {inFlightId === h.id ? "Reverting..." : "Yes, revert"}
                  </button>
                  <button disabled={isBusy} onClick={handleCancel}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  disabled={isBusy}
                  onClick={() => handleRollbackClick(h.id)}
                >
                  Rollback to here
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No history available.</p>
      )}
    </div>
  );
}
