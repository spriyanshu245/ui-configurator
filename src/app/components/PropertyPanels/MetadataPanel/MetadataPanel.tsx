"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { ComponentProperty } from "@/app/data/componentProperties";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";

interface MetadataPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const MetadataPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: MetadataPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    if (propertyKey === ComponentProperty.Metadata) {
      return (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p
            className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
          >
            Metadata
          </p>
          <JsonTextArea
            id="requestBodySpecs"
            data-testid="requestBodySpecs"
            value={properties.metadata ?? ""}
            onChange={(newVal) =>
              setProperty(ComponentProperty.Metadata, newVal)
            }
            onValidJson={(parsedObject) => {
              setProperty(
                ComponentProperty.Metadata,
                JSON.stringify(parsedObject)
              );
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div id="metadataPanel">
      <button
        id="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.MetadataPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.MetadataPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Metadata</h3>
        <ChevronDownIcon />
      </button>
      {isPanelOpen && isPanelOpen(PropertyPanels.MetadataPanel) && (
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

export default MetadataPanel;
