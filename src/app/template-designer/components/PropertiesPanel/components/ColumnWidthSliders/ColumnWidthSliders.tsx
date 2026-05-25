import styles from "../../PropertiesPanel.module.scss";
import Tooltip from "@/app/components/Tooltip/Tooltip";

interface ColumnWidthSlidersProps {
  columns: number;
  columnWidths: number[];
  columnLabels?: string[];
  onWidthChange: (index: number, value: number, columnWidths: number[]) => void;
}

const ColumnWidthSliders = ({
  columns,
  columnWidths,
  columnLabels,
  onWidthChange,
}: ColumnWidthSlidersProps) => {
  const normalizedWidths =
    columnWidths.length === columns
      ? columnWidths
      : Array.from({ length: columns }, () => Math.round(100 / columns));

  const total = normalizedWidths.reduce((sum, w) => sum + w, 0);

  return (
    <div className={styles.propertyRow}>
      <span className={styles.propertyLabel}>Column Widths</span>
      <div className={styles.columnWidthSliders}>
        {normalizedWidths.map((width, index) => {
          const label = columnLabels?.[index];
          return (
            <div
              key={`col-width-${columns}-${index}`}
              className={styles.sliderRow}
            >
              <Tooltip text={label ?? `Column ${index + 1}`}>
                <span className={styles.sliderLabel}>Col {index + 1}</span>
              </Tooltip>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={width}
                onChange={(e) =>
                  onWidthChange(index, Number(e.target.value), normalizedWidths)
                }
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{width}%</span>
            </div>
          );
        })}
        {total === 100 && <span className={styles.totalText}>Total: 100%</span>}
      </div>
    </div>
  );
};

export default ColumnWidthSliders;
