import React from "react";
import sharedStyles from "../../../../app/styles/shared.module.scss";
import sharedPropertiesStyles from "../../../../app/styles/properties-pane.module.scss";
import { InputGridHeader } from "../../../types/types";
import { ComponentProperty } from "../../../../app/data/componentProperties";

interface InputGridColumnRowProps {
  headers: InputGridHeader[];
  header: InputGridHeader;
  headerType: string;
  index: number;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
}
const InputGridColumnRow = ({
  headers,
  header,
  headerType,
  index,
  setProperty,
}: InputGridColumnRowProps) => {
  const handleColRowChange = (id: string, value: string) => {
    const updatedHeaders = headers.map((head: InputGridHeader) =>
      head.id === id
        ? {
            ...head,
            text: value,
          }
        : head
    );
    headerType === "row"
      ? setProperty(ComponentProperty.RowHeaders, updatedHeaders)
      : setProperty(ComponentProperty.ColumnHeaders, updatedHeaders);
  };
  return (
    <div
      className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
    >
      <p className={sharedPropertiesStyles.propertyLabel}>
        {headerType === "row" ? "Row" : "Column"} Header
      </p>
      <input
        id={`${headerType == "row" ? "row" : "column"}Header-${index + 1}`}
        className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
        value={header.text}
        placeholder={`Enter ${
          headerType == "row" ? "row" : "column"
        } header value here`}
        onChange={(e) => handleColRowChange(header.id, e.target.value)}
      />
    </div>
  );
};

export default InputGridColumnRow;
