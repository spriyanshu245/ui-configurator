"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedStyles from "@/app/styles/shared.module.scss";

interface FooterPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const FooterPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: FooterPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.CalculatedColumn:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="calculatedColumn"
                type="checkbox"
                data-testid="calculatedColumn"
                checked={!!propertyComponent?.properties?.calculatedColumn}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.CalculatedColumn,
                    e.target.checked
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Calculated
              </span>
            </label>
          </div>
        );
      case ComponentProperty.FooterLabel:
        if (properties.calculatedColumn) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Label</p>
            <input
              id="footerLabel"
              data-testid="footerLabel"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.footerLabel ?? ""}
              placeholder="Enter label here"
              onChange={(e) =>
                setProperty(ComponentProperty.FooterLabel, e.target.value)
              }
            />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div id="footerPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.FooterPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.FooterPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Footer</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.FooterPanel) && (
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

export default FooterPanel;
