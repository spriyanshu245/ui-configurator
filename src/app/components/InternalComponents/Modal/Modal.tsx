import React from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";
import InternalIcons from "@/app/utils/InternalIcons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitText: string;
  backDrop: () => void;
  cancelText?: string;
  type?: "success" | "warning";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitText,
  cancelText,
  backDrop,
  type = "success",
}) => {
  if (!isOpen) return null;

  const onModalClose = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const onConfirm = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit();
  };

  const buttonStyles: Record<string, string> = {
    success: styles.successButton,
    warning: styles.warningButton,
  };

  const modalContent = (
    <div
      data-testid="modal-overlay"
      className={styles.overlay}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        backDrop();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Enter" || e.key === " ") {
          backDrop();
        }
      }}
    >
      <div className={styles.modal} data-testid="modal">
        <div className={styles.close}>{InternalIcons("close")}</div>
        <div className={styles.info}>
          <h2 className={styles.heading}>{title}</h2>
          <p className={styles.paragraph}>{description}</p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={onModalClose}
            className={cancelText ? styles.button : styles.hideButton}
          >
            {cancelText}
          </button>
          <button
            data-testid={"submit-button"}
            onClick={onConfirm}
            className={`${styles.button} ${buttonStyles[type]}`}
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
};

export default Modal;
