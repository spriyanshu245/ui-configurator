"use client";
import { GridData, DataGridComponent } from "@/app/types/types";
import styles from "./DataGrid.module.scss";

interface TableProps {
  component?: DataGridComponent;
}

const DataGrid = ({ component }: TableProps) => {
  const gridData = component?.properties.gridData;

  return (
    <div
      key={component?.id}
      style={{ width: `${component?.properties.width}%` }}
    >
      {component?.properties.label && component?.properties.showLabel && (
        <label htmlFor={component.id} className={styles.gridLabel}>
          {component.properties.label}
        </label>
      )}
      <div
        className={styles.gridContainer}
        style={{
          gridTemplateColumns: `repeat(${component?.properties.columns}, minmax(0, 1fr))`,
          columnGap: `${component?.properties.columnGap}px`,
        }}
      >
        {gridData &&
          gridData.length > 0 &&
          gridData.map((ele: GridData) => (
            <div
              key={ele.id}
              className={`${styles.gridItem} ${
                styles[component?.properties.fieldLayout]
              }`}
              style={{
                display: "flex",
                flexDirection: component?.properties
                  .fieldLayout as React.CSSProperties["flexDirection"],
              }}
            >
              <div className={styles.label}>{ele.properties.label}</div>
              <div className={styles.value}>{ele.properties.value}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DataGrid;
