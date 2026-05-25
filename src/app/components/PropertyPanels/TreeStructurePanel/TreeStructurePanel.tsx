"use client";
import React from "react";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import sharedPropertiesStyles from "../../../../app/styles/properties-pane.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { BEHAVIOR_TYPE, PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { TreeStructureComponent } from "@/app/types/types";

interface TreeStructurePanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: TreeStructureComponent;
  setProperty: (prop: string, value: any) => void;
}

const TreeStructurePanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: TreeStructurePanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const handlePropertyChange = (property: ComponentProperty, value: string) => {
    setProperty(property, value);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.BehaviorType:
        return (
          <PropertyInput
            type="select"
            label="Behavior Type"
            id={`${propertyComponent.id}-behaviorType`}
            value={properties?.behaviorType}
            handleChange={(e) =>
              handlePropertyChange(
                ComponentProperty.BehaviorType,
                e.target.value
              )
            }
            options={BEHAVIOR_TYPE}
          />
        );
      case ComponentProperty.SessionKey:
        if (
          propertyComponent.type === "tree-structure" &&
          properties.behaviorType !== "navigation"
        ) {
          return null;
        }
        return (
          <PropertyInput
            type="text"
            label="Session key"
            placeholder="Enter the session key identifier"
            id={`${propertyComponent.id}-sessionKey`}
            value={properties?.sessionKey}
            handleChange={(e) =>
              handlePropertyChange(ComponentProperty.SessionKey, e.target.value)
            }
          />
        );
      case ComponentProperty.PathKeyToArray:
        return (
          <PropertyInput
            type="text"
            label="Path key to Array"
            placeholder="Enter the key fqdn"
            id={`${propertyComponent.id}-pathKeyToArray`}
            value={properties?.pathKeyToArray}
            handleChange={(e) =>
              handlePropertyChange(
                ComponentProperty.PathKeyToArray,
                e.target.value
              )
            }
          />
        );
      case ComponentProperty.ChildrenPathKey:
        return (
          <PropertyInput
            type="text"
            label="Children Path to Array"
            placeholder="Enter the key fqdn"
            id={`${propertyComponent.id}-childrenPathKey`}
            value={properties?.childrenPathKey}
            handleChange={(e) =>
              handlePropertyChange(
                ComponentProperty.ChildrenPathKey,
                e.target.value
              )
            }
          />
        );
      case ComponentProperty.LabelKey:
        return (
          <PropertyInput
            type="text"
            label="Label key"
            placeholder="Enter the key"
            id={`${propertyComponent.id}-labelKey`}
            value={properties?.labelKey}
            handleChange={(e) =>
              handlePropertyChange(ComponentProperty.LabelKey, e.target.value)
            }
          />
        );
      case ComponentProperty.ValueKey:
        return (
          <PropertyInput
            type="text"
            label="Value key"
            placeholder="Enter the key"
            id={`${propertyComponent.id}-valueKey`}
            value={properties?.valueKey}
            handleChange={(e) =>
              handlePropertyChange(ComponentProperty.ValueKey, e.target.value)
            }
          />
        );

      case ComponentProperty.ParamValueKey:
        if (properties.behaviorType !== "navigation") {
          return null;
        }
        return (
          <PropertyInput
            type="text"
            label="Param value key"
            placeholder="Enter the param value key"
            id={`${propertyComponent.id}-paramValueKey`}
            value={properties?.paramValueKey}
            handleChange={(e) =>
              handlePropertyChange(
                ComponentProperty.ParamValueKey,
                e.target.value
              )
            }
          />
        );

      case ComponentProperty.OnSelectApiUrl:
        if (properties.behaviorType !== "navigation") {
          return null;
        }
        return (
          <PropertyInput
            type="text"
            label="On select API URL"
            placeholder="Enter the API URL"
            id={`${propertyComponent.id}-onSelectApiUrl`}
            value={properties?.onSelectApiUrl}
            handleChange={(e) =>
              handlePropertyChange(
                ComponentProperty.OnSelectApiUrl,
                e.target.value
              )
            }
          />
        );
    }
  };

  return (
    propertyKeys &&
    propertyKeys.length > 0 && (
      <div id="textPanel">
        <button
          id="toggleButton"
          onClick={() =>
            togglePanel ? togglePanel(PropertyPanels.TreeStructurePanel) : null
          }
          className={`${sharedPropertiesStyles.panelHeading} ${
            isPanelOpen?.(PropertyPanels.TreeStructurePanel)
              ? sharedPropertiesStyles.isOpen
              : ""
          }`}
        >
          <h3 data-testid="treeStructurePanelHeading">
            Structure Configuration
          </h3>
          <ChevronDownIcon />
        </button>

        {isPanelOpen && isPanelOpen(PropertyPanels.TreeStructurePanel) && (
          <>
            {propertyKeys.map((propKey) => (
              <div key={`${propKey}-${propertyComponent.id}`}>
                {renderProperty(propKey)}
              </div>
            ))}
          </>
        )}
      </div>
    )
  );
};

export default TreeStructurePanel;
