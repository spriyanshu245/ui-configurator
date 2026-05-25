"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { ComponentProperty } from "@/app/data/componentProperties";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";

interface ConstantsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const ConstantsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: ConstantsPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    if (propertyKey === ComponentProperty.ConstantsBodySpecs) {
      return (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p
            className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
          >
            Constant Body Specs
          </p>
          <JsonTextArea
            id="requestBodySpecs"
            data-testid="requestBodySpecs"
            value={properties.constantsBodySpecs ?? ""}
            onChange={(newVal) =>
              setProperty(ComponentProperty.ConstantsBodySpecs, newVal)
            }
            onValidJson={(parsedObject) => {
              setProperty(
                ComponentProperty.ConstantsBodySpecs,
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
    <div id="constantsPanel">
      <button
        id="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.ConstantsPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.ConstantsPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Constants</h3>
        <ChevronDownIcon />
      </button>
      {isPanelOpen && isPanelOpen(PropertyPanels.ConstantsPanel) && (
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

export default ConstantsPanel;
