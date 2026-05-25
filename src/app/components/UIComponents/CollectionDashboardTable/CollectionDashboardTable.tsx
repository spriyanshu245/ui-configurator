import { CollectionDashboardTableComponent } from "@/app/types/types";
import styles from "./CollectionDashboardTable.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import { Fragment } from "react";

interface CollectionDashboardTableProps {
  readonly component: CollectionDashboardTableComponent;
}

const PREVIEW_BUCKETS = ["0-Current", "1-30 Days", "31-60 Days", "61-90 Days", "91+ Days"];

const CollectionDashboardTable = ({ component }: CollectionDashboardTableProps) => {
  return (
    <div id={component.id} className={styles.container}>
      {component.properties.showLabel && component.properties.label && (
        <h3 className={sharedStyles.formGroupLabel}>{component.properties.label}</h3>
      )}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.alignLeft}>State</th>
              <th rowSpan={2} className={styles.alignLeft}>Branch Name</th>
              {PREVIEW_BUCKETS.map((bucket) => (
                <th key={bucket} colSpan={2} className={styles.groupHeader}>
                  {bucket}
                </th>
              ))}
            </tr>
            <tr>
              {PREVIEW_BUCKETS.map((bucket) => (
                <Fragment key={`${bucket}-count`}>
                  <th key={`${bucket}-count`}>No Of Cases</th>
                  <th key={`${bucket}-pos`}>POS</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={2} className={styles.stateCell}>State A</td>
              <td className={styles.branchCell}>Branch 1</td>
              {PREVIEW_BUCKETS.map((bucket) => (
                <Fragment key={`${bucket}-c`}>
                  <td key={`${bucket}-c`} className={styles.numericCell}>—</td>
                  <td key={`${bucket}-p`} className={styles.numericCell}>—</td>
                </Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.branchCell}>Branch 2</td>
              {PREVIEW_BUCKETS.map((bucket) => (
                <Fragment key={`${bucket}-c`}>
                  <td key={`${bucket}-c`} className={styles.numericCell}>—</td>
                  <td key={`${bucket}-p`} className={styles.numericCell}>—</td>
                </Fragment>
              ))}
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className={styles.totalLabelCell}>Total (Sum)</td>
              {PREVIEW_BUCKETS.map((bucket) => (
                <Fragment key={`${bucket}-tc`}>
                  <td key={`${bucket}-tc`} className={styles.numericCell}>—</td>
                  <td key={`${bucket}-tp`} className={styles.numericCell}>—</td>
                </Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CollectionDashboardTable;
