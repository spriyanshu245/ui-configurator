"use client";
import { useEffect, useRef } from "react";
import styles from "./MarkdownGuidePanel.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import ArrowLeftIcon from "@/app/components/SVGIcons/ArrowLeft";
import MarkdownGuideContent from "@/app/template-designer/components/MarkdownGuideContent/MarkdownGuideContent";

const MarkdownGuidePanel = () => {
  const { isMarkdownGuideOpen, setIsMarkdownGuideOpen } = useTemplateDesigner();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMarkdownGuideOpen) {
        setIsMarkdownGuideOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMarkdownGuideOpen, setIsMarkdownGuideOpen]);

  useEffect(() => {
    if (isMarkdownGuideOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isMarkdownGuideOpen]);

  const handleClose = () => {
    setIsMarkdownGuideOpen(false);
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.guidePanel} ${
        isMarkdownGuideOpen ? styles.open : ""
      }`}
      tabIndex={-1}
      aria-hidden={!isMarkdownGuideOpen}
    >
      <div className={styles.header}>
        <h3>Markdown & HTML Guide</h3>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          title="Close guide"
          aria-label="Close guide"
        >
          <ArrowLeftIcon />
        </button>
      </div>

      <div className={styles.content}>
        <MarkdownGuideContent />
      </div>
    </div>
  );
};

export default MarkdownGuidePanel;
