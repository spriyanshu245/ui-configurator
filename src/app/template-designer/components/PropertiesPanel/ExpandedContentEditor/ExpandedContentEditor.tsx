"use client";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./ExpandedContentEditor.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import TransliterationInput from "@/app/template-designer/components/TransliterationInput/TransliterationInput";
import CloseIcon from "@/app/components/SVGIcons/Close";
import MarkdownGuideContent from "@/app/template-designer/components/MarkdownGuideContent/MarkdownGuideContent";

interface ExpandedContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}

const ExpandedContentEditor = ({
  isOpen,
  onClose,
  value,
  onChange,
}: ExpandedContentEditorProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      const textarea = document.getElementById(
        "expanded-content"
      ) as HTMLTextAreaElement;
      textarea?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.overlayBackdrop}
        onClick={onClose}
        aria-label="Close expanded editor"
      />
      <dialog
        className={styles.modal}
        open
        aria-label="Expanded content editor"
      >
        <div className={styles.guideSection}>
          <div className={styles.guideHeader}>
            <h3>Markdown & HTML Guide</h3>
          </div>
          <div className={styles.guideContent}>
            <MarkdownGuideContent />
          </div>
        </div>

        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <h3>Content Editor</h3>
            <button
              className={styles.closeButton}
              onClick={onClose}
              title="Close editor (Esc)"
              aria-label="Close editor"
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.editorContent}>
            <div className={styles.textareaWrapper}>
              <TransliterationInput
                id="expanded-content"
                className={styles.expandedTextarea}
                value={value}
                onChange={onChange}
                rows={20}
                placeholder="Enter block content here. Use Markdown syntax for formatting."
              />
            </div>
            <div className={styles.editorFooter}>
              <button
                type="button"
                className={`${sharedStyles.button} ${sharedStyles.primaryButton}`}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>,
    document.body
  );
};

export default ExpandedContentEditor;
