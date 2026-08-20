import React, { useState } from "react";
import { FilePlus2 } from "lucide-react";
import styles from "./CreatePageCard.module.scss";

interface CreatePageCardProps {
  micrositeId: string;
  suggestedName: string;
  purpose?: string | null;
  toolCallId?: string;
  onCreate: (
    micrositeId: string,
    name: string,
    isPopup: boolean,
    toolCallId?: string,
  ) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Small in-chat input card for creating a page: the agent pre-fills a suggested
 * name (editable) and the user ticks "Open as popup" before submitting. The page
 * code is derived server-side from the name (read-only), matching the app's own
 * Add-Page flow.
 */
export function CreatePageCard({
  micrositeId,
  suggestedName,
  purpose,
  toolCallId,
  onCreate,
  onCancel,
}: CreatePageCardProps) {
  const [name, setName] = useState(suggestedName ?? "");
  const [isPopup, setIsPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate(micrositeId, name.trim(), isPopup, toolCallId);
      setDismissed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDismissed(true);
    onCancel();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <FilePlus2 size={15} />
        <span>Create a new page</span>
      </div>
      {purpose && <p className={styles.purpose}>{purpose}</p>}

      <label className={styles.label} htmlFor="create-page-name">
        Page name
      </label>
      <input
        id="create-page-name"
        className={styles.nameInput}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Customer Update Banks"
        autoFocus
        disabled={submitting}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
      />
      <p className={styles.hint}>
        The page code is derived from the name automatically.
      </p>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={isPopup}
          onChange={(e) => setIsPopup(e.target.checked)}
          disabled={submitting}
        />
        <span>Open as popup</span>
        {isPopup && (
          <span className={styles.popupHint}>
            right-aligned · 40% · closes on backdrop
          </span>
        )}
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={!canSubmit}
        >
          {submitting ? "Creating…" : "Create page"}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
