import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import React, { ChangeEvent } from "react";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface MapsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const MapsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: MapsPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.EncodedPolylinePathKey:
        if (!properties.showRoute) return null;
        return (
          <PropertyInput
            type="text"
            label="Polyline Path Key"
            placeholder="Enter the path key"
            id="encodedPolylinePathKey"
            value={properties?.encodedPolylinePathKey}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.EncodedPolylinePathKey,
                e.target.value,
              )
            }
          />
        );
      case ComponentProperty.LocationsPathKey:
        return (
          <PropertyInput
            type="text"
            label="Location Path key"
            placeholder="Enter the path key"
            id="locationsPathKey"
            value={properties?.locationsPathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.LocationsPathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.ShowOrder:
        return (
          <PropertyInput
            id="showOrder"
            type="checkbox"
            label="Show order"
            value={!!properties?.showOrder}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ShowOrder,
                (e as ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
          />
        );

      case ComponentProperty.ShowRoute:
        return (
          <PropertyInput
            id="showRoute"
            type="checkbox"
            label="Show Route"
            value={!!properties?.showRoute}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ShowRoute,
                (e as ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
          />
        );
    }
    return null;
  };

  return (
    <div id="paymentPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.MapsPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.MapsPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Maps</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.MapsPanel) && (
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

export default MapsPanel;
