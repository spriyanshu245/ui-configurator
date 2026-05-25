import { MouseEvent as ReactMouseEvent, KeyboardEvent } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";

interface DeleteConfirmCellProps {
  isDeleting: boolean;
  onConfirm: (
    e: ReactMouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onCancel: (
    e: ReactMouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => void;
}

const DeleteConfirmCell = ({
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmCellProps) => (
  <div className={sharedStyles.deleteConfirmContainer}>
    <span className={sharedStyles.confirmText}>Delete?</span>
    <div className={sharedStyles.confirmActions}>
      <button
        data-testid="confirm-button-yes"
        type="button"
        className={sharedStyles.confirmButton}
        disabled={isDeleting}
        onClick={onConfirm}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onConfirm(e);
          }
        }}
      >
        {isDeleting ? "..." : "Yes"}
      </button>
      <button
        data-testid="confirm-button-cancel"
        type="button"
        className={sharedStyles.cancelButton}
        disabled={isDeleting}
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCancel(e);
          }
        }}
      >
        Cancel
      </button>
    </div>
  </div>
);

export default DeleteConfirmCell;
