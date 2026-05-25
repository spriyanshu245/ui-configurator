"use client";
import React from "react";
import { ComponentProperty } from "../../../data/componentProperties";
import sharedPropertiesStyles from "../../../styles/properties-pane.module.scss";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { CURRENCY, PropertyPanels } from "../../../utils/constants";
import ChevronDownIcon from "../../../components/SVGIcons/ChevronDown";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface FieldRestrictionsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const FieldRestrictionsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: FieldRestrictionsPanelProps) => {
  const { properties } = propertyComponent;

  const { togglePanel, isPanelOpen } = usePropertyPane();
  const renderNumberInputProperty = (propertyKey: ComponentProperty) => {
    if (
      properties?.inputType !== "number" &&
      properties.columnInputType !== "number" &&
      propertyComponent.type !== "numeric-slider"
    ) {
      return null;
    }
    switch (propertyKey) {
      case ComponentProperty.AllowNegative:
        return (
          <PropertyInput
            id="allowNegative"
            type="checkbox"
            value={!!properties?.allowNegative}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.AllowNegative,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Allow Negative Number"
          />
        );
      case ComponentProperty.IsCurrency:
        return (
          <PropertyInput
            id="isCurrency"
            type="checkbox"
            value={!!properties?.isCurrency}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.IsCurrency,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Is Currency"
          />
        );
      case ComponentProperty.CurrencyName:
        return (
          properties?.isCurrency && (
            <PropertyInput
              id="currencyName"
              type="select"
              label="Currency Name"
              value={propertyComponent?.properties?.currencyName ?? ""}
              handleChange={(e) =>
                setProperty(ComponentProperty.CurrencyName, e.target.value)
              }
              options={CURRENCY}
              placeholder="Select Currency"
            />
          )
        );

      case ComponentProperty.DecimalPrecision:
        return (
          <PropertyInput
            id="decimal"
            type="number"
            min={0}
            max={10}
            label="Max Decimal Precision"
            value={properties?.decimalPrecision}
            placeholder="Enter decimal precision"
            handleChange={(e) => {
              setProperty(
                ComponentProperty.DecimalPrecision,
                e.target.value !== "" ? Number(e.target.value) : "",
              );
            }}
          />
        );

      case ComponentProperty.IsRowPrecision:
        return (
          <PropertyInput
            id="isRowPrecision"
            type="checkbox"
            value={!!properties?.isRowPrecision}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.IsRowPrecision,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Set Dynamic Decimal Precision"
          />
        );
      case ComponentProperty.RowDecimalPrecisionKey:
        return (
          properties?.isRowPrecision && (
            <PropertyInput
              id="rowDecimalPrecisionKey"
              type="text"
              value={properties?.rowDecimalPrecisionKey ?? ""}
              placeholder="Enter row decimal precision key"
              label="Decimal Precision Key"
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.RowDecimalPrecisionKey,
                  e.target.value,
                );
              }}
            />
          )
        );
      default:
        return null;
    }
  };
  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.AllowAutoFill:
        return (
          <PropertyInput
            id="allowAutoFill"
            data-testid="allowAutoFill"
            type="checkbox"
            label="allow auto-fill"
            value={!!properties?.allowAutoFill}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.AllowAutoFill,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              );
            }}
          />
        );

      case ComponentProperty.Disabled:
        return (
          <PropertyInput
            id="disabled"
            type="checkbox"
            value={!!properties?.disabled}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.Disabled,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Disabled Field"
          />
        );

      default:
        return renderNumberInputProperty(propertyKey);
    }
  };

  return (
    <div id="fieldRestrictionsPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.FieldRestrictionsPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.FieldRestrictionsPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Field Restrictions</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.FieldRestrictionsPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default FieldRestrictionsPanel;
