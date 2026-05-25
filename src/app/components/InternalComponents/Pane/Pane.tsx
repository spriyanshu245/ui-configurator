"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import styles from "./pane.module.scss";
import CloseIcon from "../../SVGIcons/Close";

interface PaneProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  minWidth?: number;
  paneFooter?: ReactNode;
  showCloseIcon?: boolean;
  position?: "right" | "center";
  width?: number;
  dismissible?: boolean;
}

const Pane = ({
  isOpen,
  onClose,
  title,
  children,
  minWidth,
  paneFooter,
  showCloseIcon = true,
  position = "right",
  width,
  dismissible = true,
}: PaneProps) => {
  const [isActive, setIsActive] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsActive(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  const paneStyles = {
    minWidth: minWidth ? `${minWidth}px` : "auto",
    maxWidth: minWidth ? `${minWidth}px` : "auto",
    width: position === "center" && width ? `${width}px` : "auto",
  };

  const hideAndClose = () => {
    if (!dismissible) return;
    setIsActive(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isActive ? styles.active : ""}`}
        onClick={hideAndClose}
      />
      <div
        ref={paneRef}
        className={`${styles.pane} ${isActive ? styles.open : ""} ${
          position === "center" ? styles.centered : ""
        }`}
        style={paneStyles}
        data-testid="pane"
      >
        {(title !== "" || showCloseIcon) && (
          <div className={styles.paneHeader}>
            <h2>{title}</h2>
            {showCloseIcon && dismissible && (
              <button className={styles.closeButton} onClick={hideAndClose}>
                <CloseIcon />
              </button>
            )}
          </div>
        )}
        <div className={styles.paneContent}>{children}</div>
        {paneFooter && <div className={styles.paneFooter}>{paneFooter}</div>}
      </div>
    </>
  );
};

export default Pane;
