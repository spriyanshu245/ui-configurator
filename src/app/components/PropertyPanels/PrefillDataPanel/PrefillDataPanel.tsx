import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyPanels, requestBodyTypes } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { NameKeyId } from "@/app/types/types";

interface PrefillDataPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}
const PrefillDataPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: PrefillDataPanelProps) => {
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { properties } = propertyComponent;
  const objectOptions: NameKeyId[] =
    propertyComponent.properties?.nameKeyIds ?? [];

  const validateKeys = (parsedObject: any) => {
    if (typeof parsedObject !== "object" || Array.isArray(parsedObject)) {
      return;
    }
    const keys = Object.keys(parsedObject);
    const invalidKeys = keys
      .map((key) => parsedObject[key]?.split("$").pop())
      .filter(
        (extractedKey) =>
          extractedKey &&
          !objectOptions.find((item) => item.label === extractedKey),
      );

    if (invalidKeys.length > 0) {
      return invalidKeys;
    }
    setProperty(
      ComponentProperty.PrefillResponseBodySpecs,
      JSON.stringify(parsedObject),
    );
    return undefined;
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.PrefillApiUrl:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Prefill API URL
            </p>
            <input
              id="prefillApiUrl"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.prefillApiUrl || ""}
              placeholder="Enter Prefill API URL here"
              onChange={(e) =>
                setProperty(ComponentProperty.PrefillApiUrl, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.PrefillResponseBodySpecs:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
            >
              Response Body Specs
            </p>
            <JsonTextArea
              id="prefillResponseBodySpecs"
              value={properties.prefillResponseBodySpecs ?? ""}
              validateKeys={(e: string) => validateKeys(e)}
              onChange={(newVal) => {
                setProperty(ComponentProperty.PrefillResponseBodySpecs, newVal);
              }}
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.PrefillResponseBodySpecs,
                  JSON.stringify(parsedObject),
                );
              }}
            />
            <p className={sharedPropertiesStyles.propertyHelperText}>
              {`Example JSON Mapping:
{
    "amount": "$amount",
    "age": "\${micrositeSlug.pageSlug.apikey.response.nestedPath}"
}
    
Key Components:
- "amount": The key you want in the request body
- "$amount": The field path of the form input field
Dynamic Value Access:
- Use \${} to access values from API responses
- Format follows: "micrositeSlug.pageSlug.apikey.response.nestedPath"
  * "micrositeSlug": Microsite slug
  * "pageSlug": Page where API was called
  * "apiKey": Key to access API response configuration
  * "response": Accesses the API response
  * "nestedPath": Determines the attribute value location
Hardcoded Value Examples:
- { "amount": 5000 }
- { "name": "John Doe" }
Important: Always manually verify keys and values in the request body.`}
            </p>
          </div>
        );
      case ComponentProperty.PrefillApiHeaders:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Headers</p>
            <JsonTextArea
              id="preFillApiHeaders"
              data-testid="preFillApiHeaders"
              value={properties.preFillApiHeaders ?? ""}
              onChange={(newVal) =>
                setProperty(ComponentProperty.PrefillApiHeaders, newVal)
              }
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.PrefillApiHeaders,
                  JSON.stringify(parsedObject),
                );
              }}
            />
          </div>
        );

      case ComponentProperty.PrefillApiName:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Prefill API Name
            </p>
            <input
              id="prefillApiName"
              data-testid="prefillApiName"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.prefillApiName ?? ""}
              placeholder="Enter API Name here"
              onChange={(e) =>
                setProperty(ComponentProperty.PrefillApiName, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.StorePrefillInSession:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="storePrefillInSession"
                data-testid="storePrefillInSession"
                type="checkbox"
                checked={!!propertyComponent?.properties?.storePrefillInSession}
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.StorePrefillInSession,
                    e.target.checked,
                  );
                }}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Store data in session
              </span>
            </label>
          </div>
        );
      case ComponentProperty.ResponseBodyType:
        return (
          <PropertyInput
            id="responseBodyType"
            type="select"
            label="Response Body Type"
            options={requestBodyTypes}
            value={properties.responseBodyType ?? "flat"}
            handleChange={(e) =>
              setProperty(ComponentProperty.ResponseBodyType, e.target.value)
            }
          ></PropertyInput>
        );
      default:
        return null;
    }
  };
  return (
    <div id="prefillDataPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.PrefillDataPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.PrefillDataPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Prefill Action</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.PrefillDataPanel) && (
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

export default PrefillDataPanel;
