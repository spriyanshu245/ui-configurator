import { useState } from "react";
import styles from "../../PropertiesPanel.module.scss";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import StyleEditor from "../../StyleEditor";

interface ColumnStylesEditorProps {
  columns: number;
  columnStyles: string[];
  onColumnStyleChange: (columnIndex: number, styleValue: string) => void;
}

const ColumnStylesEditor = ({
  columns,
  columnStyles,
  onColumnStyleChange,
}: ColumnStylesEditorProps) => {
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);

  return (
    <div className={styles.columnStylesSection}>
      <span className={styles.propertyLabel}>Column Styles</span>
      <div className={styles.columnStylesList}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={`col-style-${index}`} className={styles.columnStyleItem}>
            <button
              type="button"
              className={`${styles.columnStyleHeader} ${
                expandedColumn === index ? styles.expanded : ""
              }`}
              onClick={() =>
                setExpandedColumn(expandedColumn === index ? null : index)
              }
            >
              <span>Column {index + 1}</span>
              <span
                className={`${styles.columnStyleChevron} ${
                  expandedColumn === index ? styles.rotated : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>
            {expandedColumn === index && (
              <div className={styles.columnStyleEditor}>
                <StyleEditor
                  value={columnStyles[index] ?? ""}
                  onChange={(value) => onColumnStyleChange(index, value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnStylesEditor;
