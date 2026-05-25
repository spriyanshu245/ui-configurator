"use client";

import sharedStyles from "@/app/styles/shared.module.scss";

interface FormPaneFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  cancelButtonTestId?: string;
  submitButtonTestId?: string;
}

const FormPaneFooter = ({
  onCancel,
  onSubmit,
  isSubmitting,
  isValid,
  submitLabel = "Create",
  submittingLabel = "Creating...",
  cancelLabel = "Cancel",
  cancelButtonTestId,
  submitButtonTestId,
}: FormPaneFooterProps) => {
  return (
    <div className={sharedStyles.paneFooterActions}>
      <button
        type="button"
        data-testid={cancelButtonTestId}
        className={`${sharedStyles.paneFooterButton} ${sharedStyles.paneFooterSecondary}`}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        data-testid={submitButtonTestId}
        className={`${sharedStyles.paneFooterButton} ${sharedStyles.paneFooterPrimary}`}
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
};

export default FormPaneFooter;
