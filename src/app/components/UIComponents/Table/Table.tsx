"use client";
import { DataTableColumn, TableComponent } from "@/app/types/types";
import styles from "./Table.module.scss";

interface TableProps {
  component?: TableComponent;
}

const Table = ({ component }: TableProps) => {
  const tableColumns = component?.properties.tableColumns;

  return (
    <div className={`${styles.tableContainer}`} key={component?.id}>
      {component?.properties.label && component?.properties.showLabel && (
        <label
          data-testid="label"
          htmlFor={component.id}
          className={styles.tableLabel}
        >
          {component.properties.label}
        </label>
      )}
      <table className={component?.properties?.hideBorders ? styles.noBorderTable : styles.table}>
        <thead>
          <tr>
            {tableColumns &&
              tableColumns.length > 0 &&
              tableColumns.map((ele: DataTableColumn) => (
                <th key={ele.id}>{ele.properties.label}</th>
              ))}
          </tr>
        </thead>
      </table>
    </div>
  );
};

export default Table;
