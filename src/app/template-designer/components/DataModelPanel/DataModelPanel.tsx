"use client";
import { useState, ChangeEvent } from "react";
import styles from "./DataModelPanel.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import ChevronRightIcon from "@/app/components/SVGIcons/ChevronRight";

const DataModelPanel = () => {
  const { dataModelJson, setDataModelJson } = useTemplateDesigner();
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDataModelJson(value);

    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      setError(null);
    } catch {
      setError("Invalid JSON");
    }
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={styles.dataModelPanel}>
      <button className={styles.header} onClick={toggleExpanded}>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.expanded : ""}`}
        >
          <ChevronRightIcon />
        </span>
        <span className={styles.title}>Data Model</span>
      </button>
      {isExpanded && (
        <div className={styles.content}>
          <textarea
            className={`${styles.jsonTextarea} ${error ? styles.hasError : ""}`}
            value={dataModelJson}
            onChange={handleChange}
            placeholder="Enter JSON data model"
            spellCheck={false}
          />
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      )}
    </div>
  );
};

export default DataModelPanel;
