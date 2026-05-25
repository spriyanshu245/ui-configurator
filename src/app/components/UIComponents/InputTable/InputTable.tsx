import { InputTableComponent } from "@/app/types/types";
import React from "react";
import styles from "./InputTable.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface Props {
  component: InputTableComponent;
}

const InputTable = ({ component }: Props) => {
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup}`}
      key={component.id}
    >
      {component.properties.label && component.properties.showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div
        className={styles.inputTableContainer}
        style={
          component?.properties?.width && {
            width: `${component.properties.width}%`,
          }
        }
      >
        <table className={styles.inputTable}>
          <thead>
            <tr>
              {component.properties.inputColumns.map((ele) => (
                <th key={ele.id} style={{ minWidth: "100px" }}>
                  {ele?.properties?.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
};

export default InputTable;
