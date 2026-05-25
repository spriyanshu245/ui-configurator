"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import JsonTextarea from "../../JsonTextArea/JsonTextArea";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface DisplayValuePanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const DisplayValuePanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: DisplayValuePanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const shouldShowDisplayValueFields = () => {
    if (propertyComponent.type === "input" && properties.disabled === true) {
      return true;
    }
    if (
      propertyComponent.type === "typograph" &&
      properties.fetchDisplayValueFromApi
    ) {
      return true;
    }
    return properties.columnInputType === "fetchDisplayValueFromApi";
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.FetchDisplayValueFromApi:
        return (
          <PropertyInput
            id="fetchDisplayValueFromApi"
            type="checkbox"
            label="Fetch Display Value From API"
            value={!!properties?.fetchDisplayValueFromApi}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.FetchDisplayValueFromApi,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.FetchDisplayValueApiUrl:
        if (!shouldShowDisplayValueFields()) return null;
        return (
          <PropertyInput
            id="fetchDisplayValueApiUrl"
            label="Display Value API URL"
            type="text"
            value={propertyComponent?.properties?.fetchDisplayValueApiUrl || ""}
            placeholder="Enter API URL here"
            handleChange={(e) =>
              setProperty(
                ComponentProperty.FetchDisplayValueApiUrl,
                e.target.value
              )
            }
          />
        );

      case ComponentProperty.FetchDisplayValueApiKey:
        if (!shouldShowDisplayValueFields()) return null;
        return (
          <PropertyInput
            id="fetchDisplayValueApiKey"
            label="Display Value API Key"
            type="text"
            value={propertyComponent?.properties?.fetchDisplayValueApiKey ?? ""}
            placeholder="Enter API Key here"
            handleChange={(e) =>
              setProperty(
                ComponentProperty.FetchDisplayValueApiKey,
                e.target.value
              )
            }
          />
        );

      case ComponentProperty.FetchDisplayValueApiHeaders:
        if (!shouldShowDisplayValueFields()) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Headers</p>
            <JsonTextarea
              id="fetchDisplayValueApiHeaders"
              data-testid="fetchDisplayValueApiHeaders"
              value={properties.fetchDisplayValueApiHeaders ?? ""}
              onChange={(newVal) =>
                setProperty(
                  ComponentProperty.FetchDisplayValueApiHeaders,
                  newVal
                )
              }
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.FetchDisplayValueApiHeaders,
                  JSON.stringify(parsedObject)
                );
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div id="displayValuePanel">
      <button
        id="displayValueToggleButton"
        data-testid="displayValueToggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.DisplayValuePanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.DisplayValuePanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Display Value</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.DisplayValuePanel) && (
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

export default DisplayValuePanel;
