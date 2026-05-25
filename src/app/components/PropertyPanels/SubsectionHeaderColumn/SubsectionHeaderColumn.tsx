"use client";
import React, { ChangeEvent, Fragment } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { ComponentProperty } from "@/app/data/componentProperties";
import DisplayValuePanel from "../DisplayValuePanel/DisplayValuePanel";
import { BaseComponent, SubsectionHeader } from "@/app/types/types";
import { columnDataTypes, CURRENCY, DATE_FORMAT } from "@/app/utils/constants";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface SubsectionHeaderColumnProps {
  id: number;
  column: SubsectionHeader;
  propertyComponent: BaseComponent;
  setProperty: (prop: string, value: any) => void;
}

const SubsectionHeaderColumn = ({
  id,
  column,
  propertyComponent,
  setProperty,
}: SubsectionHeaderColumnProps) => {
  const { properties } = column;
  const pillsData = propertyComponent.properties?.subsectionHeaders;

  const handleChange = (name: string, value: any) => {
    const updatedData = pillsData.map((col: SubsectionHeader) =>
      col.id === column.id
        ? {
            ...col,
            properties: {
              ...col.properties,
              [name]: value,
            },
          }
        : col
    );
    setProperty(ComponentProperty.SubsectionHeaders, updatedData);
  };

  return (
    <div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Label</p>
        <input
          id={`label-${id + 1}`}
          data-testid={`pill-label-input`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.label ?? ""}
          onChange={(e) => handleChange("label", e.target.value)}
        />
      </div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Value</p>
        <input
          id={`value-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          data-testid={`pill-value-input`}
          type="text"
          value={properties?.value ?? ""}
          placeholder="Enter Value"
          onChange={(e) => handleChange("value", e.target.value)}
        />
      </div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Column Span</p>
        <input
          id={`pill-colspan-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          data-testid={`pill-colspan-input`}
          type="text"
          value={properties?.colSpan ?? "1"}
          placeholder="Enter number"
          onChange={(e) => handleChange("colSpan", e.target.value)}
        />
      </div>

      <PropertyInput
        id={`pill-columnInputType`}
        type="select"
        value={properties?.columnInputType ?? ""}
        handleChange={(e) => handleChange("columnInputType", e.target.value)}
        options={columnDataTypes}
        label="Header Data Type"
      />

      {properties.columnInputType === "fetchDisplayValueFromApi" && (
        <DisplayValuePanel
          propertyKeys={[
            ComponentProperty.FetchDisplayValueApiUrl,
            ComponentProperty.FetchDisplayValueApiKey,
            ComponentProperty.FetchDisplayValueApiHeaders,
          ]}
          propertyComponent={{
            ...propertyComponent,
            properties: column.properties,
          }}
          setProperty={handleChange}
        />
      )}

      {properties.columnInputType === "number" && (
        <Fragment>
          <PropertyInput
            id="isCurrency"
            type="checkbox"
            value={!!properties?.isCurrency}
            handleChange={(e) =>
              handleChange(
                "isCurrency",
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
            label="Is Currency"
          />

          {properties?.isCurrency && (
            <PropertyInput
              name="currencyName"
              id="currencyName"
              type="select"
              value={properties?.currencyName ?? ""}
              handleChange={(e) => handleChange("currencyName", e.target.value)}
              options={CURRENCY}
              label="Currency Name"
            />
          )}
        </Fragment>
      )}
      {properties.columnInputType === "date" && (
        <PropertyInput
          name="format"
          id="format"
          type="select"
          value={properties?.format ?? ""}
          handleChange={(e) => handleChange("format", e.target.value)}
          options={DATE_FORMAT}
          label=" Date Format Type"
        />
      )}
    </div>
  );
};

export default SubsectionHeaderColumn;
