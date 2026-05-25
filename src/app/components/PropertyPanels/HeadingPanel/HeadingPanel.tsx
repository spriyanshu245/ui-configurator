"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import { maxHeadingLevels, PropertyPanels } from "@/app/utils/constants";
import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";

interface HeadingPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const HeadingPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: HeadingPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const headingLevels = Array.from(
    { length: maxHeadingLevels },
    (_, i) => i + 1
  );

  const handleHeadingLevelChange = (level: number) => {
    setProperty(ComponentProperty.Level, level);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    if (propertyKey === ComponentProperty.Level) {
      return (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>Heading Level</p>
          <div
            className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
          >
            {headingLevels.map((level) => (
              <button
                id={`headingLevel-${level}`}
                key={level}
                className={`${sharedPropertiesStyles.option} ${
                  properties?.level === level
                    ? sharedPropertiesStyles.active
                    : ""
                }`}
                onClick={() => handleHeadingLevelChange(level)}
              >
                H{level}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="headingPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.HeadingPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.HeadingPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Heading</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.HeadingPanel) && (
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

export default HeadingPanel;
