"use client";
import React from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import {
  DefaultButtonIconSize,
  DefaultButtonIconUploadType,
  PropertyPanels,
} from "@/app/utils/constants";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import DragDropFileUpload from "@/app/components/UtilityComponents/DragDropFileUpload/DragDropFileUpload";
import Slider from "../../UIComponents/Slider/Slider";

interface IconPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const IconPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: IconPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const handleIsIconButtonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.isIconButton, e.target.checked);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.IconUploadType:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Icon Upload Type
            </p>
            <select
              id="iconUploadType"
              data-testid="iconUploadType"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.iconUploadType || DefaultButtonIconUploadType}
              onChange={(e) =>
                setProperty(ComponentProperty.IconUploadType, e.target.value)
              }
            >
              <option value="">Select</option>
              <option value="url">URL</option>
              <option value="file-upload">File Upload</option>
            </select>
          </div>
        );

      case ComponentProperty.IconUrl:
        if (properties.iconUploadType == "url") {
          return (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Icon URL</p>
              <input
                id="iconUrl"
                data-testid="iconUrl"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                type="text"
                value={properties.iconUrl || ""}
                placeholder="Enter icon URL"
                onChange={(e) =>
                  setProperty(ComponentProperty.IconUrl, e.target.value)
                }
              />
            </div>
          );
        } else if (
          (properties.iconUploadType || DefaultButtonIconUploadType) ==
          "file-upload"
        ) {
          return (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p
                className={sharedPropertiesStyles.propertyLabel}
                data-testid="imageUpload"
              >
                Image Upload
              </p>
              <DragDropFileUpload
                id="iconUpload"
                componentId={propertyComponent.id}
                propertyKey={ComponentProperty.IconUrl}
                fileTypes={["svg", "png", "jpg", "jpeg"]}
                maxSize={2 * 1024 * 1024} // 2MB
              />
            </div>
          );
        }
        return null;

      case ComponentProperty.IconSize:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Icon Size (px)
            </p>
            <Slider
              id="iconSize"
              min={2}
              max={100}
              step={2}
              value={properties.iconSize || DefaultButtonIconSize}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.IconSize, value)
              }
            />
          </div>
        );

      case ComponentProperty.IconPosition:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Icon Position
            </p>
            <select
              id="iconPosition"
              data-testid="iconPosition"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.iconPosition || ""}
              onChange={(e) => setProperty("iconPosition", e.target.value)}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              {propertyComponent.type !== "input" &&
                propertyComponent.type !== "input-table-column" && (
                  <option value="above">Above</option>
                )}
            </select>
          </div>
        );

      case ComponentProperty.IconSpacing:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Icon Spacing (px)
            </p>
            <Slider
              id="iconSpacing"
              min={0}
              max={40}
              step={1}
              value={properties.iconSpacing || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.IconSpacing, value)
              }
            />
          </div>
        );

      case ComponentProperty.IconBackgroundColor:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Icon Background Color
            </p>
            <input
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              data-testid="iconBackgroundColor"
              value={properties.iconBackgroundColor || ""}
              placeholder="e.g., red, #ff0000"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.IconBackgroundColor,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.isIconButton:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="is-icon-button-checkbox"
                type="checkbox"
                checked={!!properties?.isIconButton}
                onChange={handleIsIconButtonChange}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Icon Button?
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div id="iconPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.IconPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.IconPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Icon</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.IconPanel) && (
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

export default IconPanel;
