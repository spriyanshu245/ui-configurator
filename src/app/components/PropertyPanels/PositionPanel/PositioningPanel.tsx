"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels, pinTo } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedStyles from "@/app/styles/shared.module.scss";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface PositioningPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const PositioningPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: PositioningPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.IsSticky:
        return (
          <PropertyInput
            id="isSticky"
            data-testid="isSticky"
            type="checkbox"
            label="Is Sticky"
            value={properties?.isSticky ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.IsSticky,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.PinTo:
        return (
          <>
            {properties?.isSticky && (
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>Pin To</p>
                  <select
                    id="pinTo"
                    data-testid="pinTo"
                    className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                    value={properties?.pinTo ?? "none"}
                    onChange={(e) =>
                      setProperty(ComponentProperty.PinTo, e.target.value)
                    }
                  >
                    <option value="none">Please select an option</option>
                    {pinTo.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
          </>
        );

      case ComponentProperty.Offset:
        return (
          <>
            {properties?.isSticky && (
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>Offset</p>
                  <input
                    id="offset"
                    data-testid="name"
                    className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                    type="text"
                    value={properties.offset ?? ""}
                    placeholder="E.g. 50px"
                    onChange={(e) =>
                      setProperty(ComponentProperty.Offset, e.target.value)
                    }
                  />
                </div>
              )}
          </>
        );
    }
  };

  return (
    <div id="propertyPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.PositioningPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.PositioningPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Positioning</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.PositioningPanel) && (
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

export default PositioningPanel;
