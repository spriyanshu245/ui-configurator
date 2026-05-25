import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import React from "react";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface RoutePlanPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const RoutePlanPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: RoutePlanPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.NamePathKey:
        return (
          <PropertyInput
            type="text"
            label="Name Path Key"
            placeholder="Enter the path key"
            id="namePathKey"
            value={properties?.namePathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.NamePathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.AddressPathKey:
        return (
          <PropertyInput
            type="text"
            label="Address Path key"
            placeholder="Enter the path key"
            id="addressPathKey"
            value={properties?.addressPathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.AddressPathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.LatitudePathKey:
        return (
          <PropertyInput
            type="text"
            label="Latitude Path Key"
            placeholder="Enter the path key"
            id="latitudePathKey"
            value={properties?.latitudePathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.LatitudePathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.LongitudePathKey:
        return (
          <PropertyInput
            type="text"
            label="Longitude Path key"
            placeholder="Enter the path key"
            id="longitudePathKey"
            value={properties?.longitudePathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.LongitudePathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.PathToArray:
        return (
          <PropertyInput
            type="text"
            label="Path to Array"
            placeholder="Enter the path key"
            id="pathToArray"
            value={properties?.pathToArray}
            handleChange={(e) =>
              setProperty(ComponentProperty.PathToArray, e.target.value)
            }
          />
        );
      case ComponentProperty.UpdateRouteOnLoad:
        return (
          <PropertyInput
            type="checkbox"
            id="updateRouteOnLoad"
            value={properties?.updateRouteOnLoad ?? false}
            label="Update Route On Load"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );
    }
    return null;
  };

  return (
    <div id="routePlanPanel">
      <button
        id="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.RoutePlanPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.RoutePlanPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Route Plan</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.RoutePlanPanel) && (
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

export default RoutePlanPanel;
