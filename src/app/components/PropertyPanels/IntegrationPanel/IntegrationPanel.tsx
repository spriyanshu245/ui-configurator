import { ChangeEvent } from "react";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import JsonTextarea from "../../JsonTextArea/JsonTextArea";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import {
  PropertyPanels,
  externalServices,
  requestBodyTypes,
} from "@/app/utils/constants";
import { renderOptions } from "@/app/utils/utils";

interface IntegrationPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const methodOptions = renderOptions(["GET", "POST", "PUT", "DELETE"]);

const IntegrationPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: IntegrationPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const selectedService = properties.selectedService ?? "";

  const renderJsonField = (
    id: string,
    label: string,
    value: string,
    propKey: ComponentProperty
  ) => (
    <div
      className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
    >
      <p className={sharedPropertiesStyles.propertyLabel}>{label}</p>
      <JsonTextarea
        id={id}
        value={value ?? ""}
        onChange={(newVal) => setProperty(propKey, newVal)}
        onValidJson={(parsedObject) =>
          setProperty(propKey, JSON.stringify(parsedObject))
        }
      />
    </div>
  );

  const renderMethodField = (
    id: string,
    label: string,
    value: string,
    propKey: ComponentProperty
  ) => (
    <PropertyInput
      id={id}
      type="select"
      label={label}
      placeholder="Select a method"
      options={methodOptions}
      value={value ?? "POST"}
      handleChange={(e) => setProperty(propKey, e.target.value)}
    />
  );

  const renderTextField = (
    id: string,
    label: string,
    value: string,
    propKey: ComponentProperty,
    placeholder?: string
  ) => (
    <PropertyInput
      id={id}
      type="text"
      label={label}
      value={value ?? ""}
      placeholder={placeholder}
      handleChange={(e) => setProperty(propKey, e.target.value)}
    />
  );

  const renderStoreData = () => (
    <PropertyInput
      id="storeDataInSession"
      type="checkbox"
      label="Store data in session"
      value={!!properties.storeDataInSession}
      handleChange={(e) =>
        setProperty(
          ComponentProperty.StoreDataInSession,
          (e as ChangeEvent<HTMLInputElement>).target.checked
        )
      }
    />
  );

  const renderRequestBodyType = () => (
    <PropertyInput
      id="requestBodyType"
      type="select"
      label="Request Body Type"
      options={requestBodyTypes}
      value={properties.requestBodyType ?? "flat"}
      handleChange={(e) =>
        setProperty(ComponentProperty.RequestBodyType, e.target.value)
      }
    />
  );

  const renderRequestBodySpecs = () => {
    if (properties.requestBodyType && properties.requestBodyType === "flat")
      return null;

    return (
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p
          className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
        >
          Request Body Specs
        </p>
        <JsonTextarea
          id="requestBodySpecs"
          data-testid="requestBodySpecs"
          value={properties.requestBodySpecs ?? ""}
          onChange={(newVal) =>
            setProperty(ComponentProperty.RequestBodySpecs, newVal)
          }
          onValidJson={(parsedObject) => {
            setProperty(
              ComponentProperty.RequestBodySpecs,
              JSON.stringify(parsedObject)
            );
          }}
        />
        <p className={sharedPropertiesStyles.propertyHelperText}>
          {`Example JSON Mapping:
          {
            "amount": "$amount",
            "age": "\${micrositeSlug.pageSlug.apikey.response.nestedPath}"
            }`}
        </p>
      </div>
    );
  };

  const renderKycFields = () => (
    <>
      {renderTextField(
        "initiateUrl",
        "Initiate URL",
        properties.initiateUrl,
        ComponentProperty.InitiateUrl,
        "Enter initiate URL"
      )}
      {renderTextField(
        "apiName",
        "API Name",
        properties.apiName,
        ComponentProperty.ApiName,
        "Enter API name"
      )}
      {renderMethodField(
        "initiateMethod",
        "Initiate Method",
        properties.initiateMethod,
        ComponentProperty.InitiateMethod
      )}
      {renderJsonField(
        "initiateHeaders",
        "Initiate Headers",
        properties.initiateHeaders,
        ComponentProperty.InitiateHeaders
      )}
      {properties.initiateMethod !== "GET" && renderRequestBodyType()}
      {properties.initiateMethod !== "GET" && renderRequestBodySpecs()}
      {renderTextField(
        "initiateResponseKeys",
        "Response Keys",
        properties.initiateResponseKeys,
        ComponentProperty.InitiateResponseKeys,
        "Enter response keys"
      )}
      {renderTextField(
        "submitUrl",
        "Submit URL",
        properties.submitUrl,
        ComponentProperty.SubmitUrl,
        "Enter submit URL"
      )}
      {renderTextField(
        "submitApiName",
        "Submit API Name",
        properties.submitApiName,
        ComponentProperty.SubmitApiName,
        "Enter submit API name"
      )}
      {renderMethodField(
        "submitMethod",
        "Submit Method",
        properties.submitMethod,
        ComponentProperty.SubmitMethod
      )}
      {renderJsonField(
        "submitHeaders",
        "Submit Headers",
        properties.submitHeaders,
        ComponentProperty.SubmitHeaders
      )}
      {properties.submitMethod !== "GET" && renderRequestBodyType()}
      {properties.submitMethod !== "GET" && renderRequestBodySpecs()}
      {renderStoreData()}
    </>
  );

  const renderAccountAggregatorFields = () => (
    <>
      {renderTextField(
        "initiateUrl",
        "Initiate URL",
        properties.initiateUrl,
        ComponentProperty.InitiateUrl,
        "Enter initiate URL"
      )}
      {renderTextField(
        "initiateApiName",
        "Initiate API Name",
        properties.initiateApiName,
        ComponentProperty.InitiateApiName,
        "Enter initiate API name"
      )}
      {renderMethodField(
        "initiateMethod",
        "Initiate Method",
        properties.initiateMethod,
        ComponentProperty.InitiateMethod
      )}
      {renderJsonField(
        "initiateHeaders",
        "Initiate Headers",
        properties.initiateHeaders,
        ComponentProperty.InitiateHeaders
      )}
      {properties.initiateMethod !== "GET" && renderRequestBodyType()}
      {properties.initiateMethod !== "GET" && renderRequestBodySpecs()}
      {renderTextField(
        "responseKeys",
        "Response Keys",
        properties.responseKeys,
        ComponentProperty.ResponseKeys,
        "Enter response keys"
      )}
      {renderStoreData()}
    </>
  );

  const renderOfflineKycFields = () => (
    <>
      {renderTextField(
        "submitUrl",
        "Submit URL",
        properties.submitUrl,
        ComponentProperty.SubmitUrl,
        "Enter submit URL"
      )}
      {renderTextField(
        "apiName",
        "API Name",
        properties.apiName,
        ComponentProperty.ApiName,
        "Enter API name"
      )}
      {renderMethodField(
        "submitMethod",
        "Method",
        properties.submitMethod,
        ComponentProperty.SubmitMethod
      )}
      {renderJsonField(
        "submitHeaders",
        "Headers",
        properties.submitHeaders,
        ComponentProperty.SubmitHeaders
      )}
      {properties.submitMethod !== "GET" && renderRequestBodyType()}
      {properties.submitMethod !== "GET" && renderRequestBodySpecs()}
      {renderStoreData()}
    </>
  );

  const renderServiceFields = () => {
    switch (selectedService) {
      case "kyc-verification":
        return renderKycFields();
      case "account-aggregator":
        return renderAccountAggregatorFields();
      case "offline-kyc-verification":
        return renderOfflineKycFields();
      default:
        return null;
    }
  };

  return (
    <div id="integrationPanel">
      <button
        id="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.IntegrationPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.IntegrationPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Integration</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.IntegrationPanel) && (
        <>
          <PropertyInput
            id="selectedService"
            type="select"
            label="External Service"
            options={externalServices}
            value={selectedService}
            placeholder="Select a service"
            handleChange={(e) =>
              setProperty(ComponentProperty.SelectedService, e.target.value)
            }
          />
          {renderServiceFields()}
        </>
      )}
    </div>
  );
};

export default IntegrationPanel;
