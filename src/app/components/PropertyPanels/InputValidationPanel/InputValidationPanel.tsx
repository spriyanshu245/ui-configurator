"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import DateRenderer from "../../UIComponents/DatePicker/DateRenderer";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { ChangeEvent, Fragment } from "react";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";

interface InputValidationPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
  setProperties: (properties: { [key: string]: any }) => void;
}

const InputValidationPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
  setProperties,
}: InputValidationPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.Required:
        return (
          <PropertyInput
            id="requiredField"
            type="checkbox"
            value={properties?.required ?? false}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.Required,
                (e as ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Required Field"
          />
        );

      case ComponentProperty.MinDate:
        return (
          <Fragment>
            <PropertyInput
              id="minDate"
              type="checkbox"
              value={properties?.isMinDateAvailable ?? false}
              handleChange={(e) => {
                const value = (e as ChangeEvent<HTMLInputElement>).target
                  .checked;
                setProperties({
                  [ComponentProperty.IsMinDateAvailable]: value,
                  [ComponentProperty.IsMinTodayDate]: value,
                  [ComponentProperty.MinDate]: "",
                });
              }}
              label="Minimum date"
            />
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              {properties.isMinDateAvailable && (
                <>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${
                      sharedPropertiesStyles.noMb
                    } ${sharedStyles.mt10} ${sharedStyles.ml10} ${
                      !properties.isMinTodayDate ? sharedStyles.mb10 : ""
                    }`}
                  >
                    <label className={sharedPropertiesStyles.checkBoxCenter}>
                      <input
                        id="todayDate"
                        type="radio"
                        name="minimum date"
                        checked={properties?.isMinTodayDate}
                        onChange={(e) => {
                          setProperties({
                            [ComponentProperty.IsMinTodayDate]:
                              e.target.checked,
                            [ComponentProperty.MinDate]: "",
                          });
                        }}
                        className={sharedPropertiesStyles.conditionalCheckBox}
                      />
                      <span className={sharedPropertiesStyles.propertyLabel}>
                        Today's Date
                      </span>
                    </label>
                    <label
                      className={`${sharedPropertiesStyles.checkBoxCenter} ${sharedStyles.ml20}`}
                    >
                      <input
                        id="customDate"
                        type="radio"
                        name="minimum date"
                        checked={!properties?.isMinTodayDate}
                        onChange={(e) =>
                          setProperty(
                            ComponentProperty.IsMinTodayDate,
                            !e.target.checked,
                          )
                        }
                        className={sharedPropertiesStyles.conditionalCheckBox}
                      />
                      <span className={sharedPropertiesStyles.propertyLabel}>
                        Custom Date
                      </span>
                    </label>
                  </div>
                  {!properties.isMinTodayDate && (
                    <DateRenderer
                      properties={properties}
                      setProperty={setProperty}
                      field={ComponentProperty.MinDate}
                    />
                  )}
                </>
              )}
            </div>
          </Fragment>
        );

      case ComponentProperty.MaxDate:
        return (
          <Fragment>
            <PropertyInput
              id="maxDate"
              type="checkbox"
              value={properties?.isMaxDateAvailable ?? false}
              handleChange={(e) => {
                const value = (e as ChangeEvent<HTMLInputElement>).target
                  .checked;
                setProperties({
                  [ComponentProperty.IsMaxDateAvailable]: value,
                  [ComponentProperty.IsMaxTodayDate]: value,
                  [ComponentProperty.MaxDate]: "",
                });
              }}
              label="Maximum date"
            />
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              {properties.isMaxDateAvailable && (
                <>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${
                      sharedPropertiesStyles.noMb
                    } ${sharedStyles.mt10} ${sharedStyles.ml10} ${
                      !properties.isMaxTodayDate ? sharedStyles.mb10 : ""
                    }`}
                  >
                    <label className={sharedPropertiesStyles.checkBoxCenter}>
                      <input
                        id="todayDate"
                        type="radio"
                        name="maximum date"
                        checked={properties?.isMaxTodayDate}
                        onChange={(e) => {
                          setProperties({
                            [ComponentProperty.IsMaxTodayDate]:
                              e.target.checked,
                            [ComponentProperty.MaxDate]: "",
                          });
                        }}
                        className={sharedPropertiesStyles.conditionalCheckBox}
                      />
                      <span className={sharedPropertiesStyles.propertyLabel}>
                        Today's Date
                      </span>
                    </label>
                    <label
                      className={`${sharedPropertiesStyles.checkBoxCenter} ${sharedStyles.ml20}`}
                    >
                      <input
                        id="customDate"
                        type="radio"
                        name="maximum date"
                        checked={!properties?.isMaxTodayDate}
                        onChange={(e) =>
                          setProperty(
                            ComponentProperty.IsMaxTodayDate,
                            !e.target.checked,
                          )
                        }
                        className={sharedPropertiesStyles.conditionalCheckBox}
                      />
                      <span className={sharedPropertiesStyles.propertyLabel}>
                        Custom Date
                      </span>
                    </label>
                  </div>
                  {!properties.isMaxTodayDate && (
                    <DateRenderer
                      properties={properties}
                      setProperty={setProperty}
                      field={ComponentProperty.MaxDate}
                    />
                  )}
                </>
              )}
            </div>
          </Fragment>
        );

      case ComponentProperty.MinLength:
        if (
          properties?.inputType != "text" &&
          properties?.inputType != "password" &&
          properties?.inputType != "number" &&
          properties?.contactType != "Mobile Number" &&
          properties?.contactType != "Telephone Number"
        )
          return null;
        return (
          <PropertyInput
            id="minLength"
            type="number"
            value={properties.minLength ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.MinLength, e.target.value)
            }
            label="Min Length"
            placeholder="Enter min length"
          />
        );

      case ComponentProperty.MaxLength:
        if (
          properties?.inputType != "text" &&
          properties?.inputType != "password" &&
          properties?.inputType != "number" &&
          properties?.contactType != "Mobile Number" &&
          properties?.contactType != "Telephone Number"
        )
          return null;
        return (
          <PropertyInput
            id="maxLength"
            type="number"
            value={properties.maxLength ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.MaxLength, e.target.value)
            }
            label="Max Length"
            placeholder="Enter max length"
          />
        );

      case ComponentProperty.MinValue:
        if (properties?.inputType !== "number") return null;
        return (
          <PropertyInput
            id="minValue"
            type="number"
            value={properties.minValue ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.MinValue, e.target.value)
            }
            label="Min Value"
            placeholder="Enter min value"
          />
        );

      case ComponentProperty.MaxValue:
        if (properties?.inputType !== "number") return null;
        return (
          <PropertyInput
            id="maxValue"
            type="number"
            value={properties.maxValue ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.MaxValue, e.target.value)
            }
            label="Max Value"
            placeholder="Enter max value"
          />
        );

      case ComponentProperty.Pattern:
        return (
          <PropertyInput
            id="pattern"
            type="text"
            value={properties.pattern ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.Pattern, e.target.value)
            }
            label="Pattern"
            placeholder="Enter pattern"
          />
        );

      case ComponentProperty.Expression:
        if (properties?.inputType !== "number") return null;
        return (
          <>
            <div
              className={`${sharedPropertiesStyles.panelHeading} ${sharedStyles.mt15} ${sharedStyles.mb5}`}
            >
              <h3>Expression</h3>
            </div>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Expression</p>
              <textarea
                id="expression"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                placeholder="Add validation expression"
                rows={5}
                value={properties.expression ?? ""}
                onChange={(e) =>
                  setProperty(ComponentProperty.Expression, e.target.value)
                }
              />
            </div>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Message</p>
              <input
                id="validationMessage"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                type="text"
                placeholder="Add validation message"
                value={properties.validationMessage ?? ""}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.ValidationMessage,
                    e.target.value,
                  )
                }
              />
            </div>
          </>
        );

      case ComponentProperty.EnableApiValidation:
        return (
          <PropertyInput
            id="enableApiValidation"
            type="checkbox"
            value={properties?.enableApiValidation ?? false}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.EnableApiValidation,
                (e as ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
            label="Enable Api Validation"
          />
        );

      case ComponentProperty.ValidationApiUrl:
        if (!properties?.enableApiValidation) return null;
        return (
          <PropertyInput
            id="validationApiUrl"
            type="text"
            value={properties?.validationApiUrl ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.ValidationApiUrl, e.target.value)
            }
            label="Validation Api Url"
            placeholder="Enter API Url"
          />
        );

      case ComponentProperty.ValidationApiHeaders:
        if (!properties?.enableApiValidation) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Headers</p>
            <JsonTextArea
              id="validationApiHeaders"
              data-testid="validationApiHeaders"
              value={properties.validationApiHeaders ?? ""}
              onChange={(newVal) =>
                setProperty(ComponentProperty.ValidationApiHeaders, newVal)
              }
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.ValidationApiHeaders,
                  JSON.stringify(parsedObject),
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
    <div id="inputValidationPanel">
      <button
        id="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.InputValidationPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.InputValidationPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Validations</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.InputValidationPanel) && (
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

export default InputValidationPanel;
