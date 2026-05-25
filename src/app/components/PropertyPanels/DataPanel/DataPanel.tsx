"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { OptionsRenderer } from "@/app/components/OptionsRenderer/OptionsRenderer";
import { BaseComponent, NameKeyId, Options } from "@/app/types/types";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import MultiSelect from "../../MultiSelect/MultiSelect";

interface DataPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
  setProperties: (propeties: { [key: string]: any }) => void;
  component?: BaseComponent;
}

const DataPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
  setProperties,
  component,
}: DataPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  
  const { parentForm } = useParentFormProperties(
    component ?? propertyComponent
  );
  const [dropdownItems, setDropdownItems] = useState<NameKeyId[]>([]);

  const getNamkeyList = () => {
    const nameKeyIds: NameKeyId[] = component
      ? component.properties?.nameKeyIds
      : parentForm?.properties.nameKeyIds;
    return nameKeyIds?.filter(
      (item) => item.id !== propertyComponent?.properties?.name
    );
  };

  useEffect(() => {
    const list = getNamkeyList() ?? [];
    setDropdownItems(list);
  }, [JSON.stringify(parentForm?.components), propertyComponent.id]);

  const setPropertyOptions = (options: Options, key: string) => {
    setProperty(ComponentProperty.Options, options);
  };

  const defaultValueType = () => {
    if (propertyComponent.type === "input") {
      return "text";
    } else if (propertyComponent.type === "input-table-column") {
      if (properties?.inputType === "number") {
        return "number";
      } else {
        return "text";
      }
    } else {
      return "text";
    }
  };

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleLabelCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.ShowSingleOption, e.target.checked);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.LocationOnLoad:
        return (
          <PropertyInput
            label="Set location on Load"
            id="locationOnLoad"
            type="checkbox"
            value={!!properties?.locationOnLoad}
            handleChange={(e) =>
              setProperties({
                [ComponentProperty.LocationOnLoad]: (
                  e as React.ChangeEvent<HTMLInputElement>
                ).target.checked,
              })
            }
          />
        );

      case ComponentProperty.IsMultiSelect:
        if (properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isMultiSelect"
                data-testid="isMultiSelect"
                type="checkbox"
                checked={properties?.isMultiSelect}
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.IsMultiSelect,
                    e.target.checked
                  );
                }}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Multi Select
              </span>
            </label>
          </div>
        );

      case ComponentProperty.AllowAutoFill:
        return (
          <PropertyInput
            id="allowAutoFill"
            data-testid="allowAutoFill"
            type="checkbox"
            label="allow auto-fill"
            value={properties?.allowAutoFill ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.AllowAutoFill,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.IsFetchingFromApi:
        if (properties.fetchFromSession === true) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isFetchingFromApi"
                data-testid="isFetchingFromApi"
                type="checkbox"
                checked={properties?.isFetchingFromApi}
                onChange={(e) =>
                  setProperties({
                    [ComponentProperty.IsFetchingFromApi]: e.target.checked,
                    [ComponentProperty.DefaultValue]: "",
                  })
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Fetch From API
              </span>
            </label>
          </div>
        );

      case ComponentProperty.FetchFromSession:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="fetchFromSession"
                data-testid="fetchFromSession"
                type="checkbox"
                checked={properties?.fetchFromSession}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.FetchFromSession,
                    e.target.checked
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Fetch From Session
              </span>
            </label>
          </div>
        );

      case ComponentProperty.FetchFromRoot:
        if (properties.IsFetchingFromApi === true) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="fetchFromRoot"
                data-testid="fetchFromRoot"
                type="checkbox"
                checked={properties?.fetchFromRoot ?? false}
                onChange={(e) =>
                  setProperty(ComponentProperty.FetchFromRoot, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Fetch From Root
              </span>
            </label>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyHelperText}>
                Enabling this option will allow you to fetch list data from Form
                Prefill Response.
              </p>
              <p className={sharedPropertiesStyles.propertyHelperText}>
                On submit, only this component's list data is sent; data from
                other fields is ignored.
              </p>
            </div>
          </div>
        );

      case ComponentProperty.SessionPath:
        if (!properties.fetchFromSession) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Session Path</p>
            <input
              id="sessionPath"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties.sessionPath ?? ""}
              placeholder="Enter session path here"
              onChange={(e) =>
                setProperty(ComponentProperty.SessionPath, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.IsTodaysDate:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isTodaysDate"
                data-testid="isTodaysDate"
                type="checkbox"
                checked={properties?.isTodaysDate}
                onChange={(e) =>
                  setProperty(ComponentProperty.IsTodaysDate, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Today's Date
              </span>
            </label>
          </div>
        );

      case ComponentProperty.OptionsApiDependentOn:
        if (
          !properties.isFetchingFromApi &&
          propertyComponent.type === "select"
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Dependent On</p>
            <MultiSelect
              placeholder="Select a field"
              options={dropdownItems}
              id="optionsApiDependentOn"
              dataTestId="optionsApiDependentOn"
              value={
                Array.isArray(properties?.optionsApiDependentOn)
                  ? properties.optionsApiDependentOn
                  : []
              }
              onChange={(selectedOptions) => {
                setProperty(
                  ComponentProperty.OptionsApiDependentOn,
                  selectedOptions
                );
              }}
              onRemoveValue={(value) => {
                const currentValues = Array.isArray(
                  properties?.optionsApiDependentOn
                )
                  ? properties.optionsApiDependentOn
                  : [];
                const updatedValues = currentValues.filter(
                  (option: any) => option !== value
                );
                setProperty(
                  ComponentProperty.OptionsApiDependentOn,
                  updatedValues
                );
              }}
            />
          </div>
        );

      case ComponentProperty.OptionsApiUrl:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API URL</p>
            <input
              id="optionsApiUrl"
              data-testid="optionsApiUrl"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.optionsApiUrl ?? ""}
              placeholder="Enter API URL here"
              onChange={(e) =>
                setProperty(ComponentProperty.OptionsApiUrl, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiName:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API Name</p>
            <input
              id="optionsApiName"
              data-testid="optionsApiName"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.optionsApiName ?? ""}
              placeholder="Enter API Name here"
              onChange={(e) =>
                setProperty(ComponentProperty.OptionsApiName, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiKeyForOptions:
        if (!properties.isFetchingFromApi && propertyComponent.type !== "input")
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Key for Data</p>
            <input
              id="optionsApiKeyForOptions"
              data-testid="optionsApiKeyForOptions"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={
                propertyComponent?.properties?.optionsApiKeyForOptions ?? ""
              }
              placeholder="Enter Key for Data here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.OptionsApiKeyForOptions,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiKeyForLabel:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              API Key for Label
            </p>
            <input
              id="optionsApiKeyForLabel"
              data-testid="optionsApiKeyForLabel"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.optionsApiKeyForLabel ?? ""}
              placeholder="Enter API Key for Label here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.OptionsApiKeyForLabel,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiKeyForValue:
        if (!properties.isFetchingFromApi) return null;
        if (
          propertyComponent.type === "multi-select" &&
          (!properties.responseDataStructure ||
            properties.responseDataStructure === "array")
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              API Key for Value
            </p>
            <input
              id="optionsApiKeyForValue"
              data-testid="optionsApiKeyForValue"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.optionsApiKeyForValue ?? ""}
              placeholder="Enter API Key for Value here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.OptionsApiKeyForValue,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiKeyForMetadata:
        if (
          propertyComponent.type !== "select" &&
          !properties.isFetchingFromApi
        )
          return null;
        return (
          <PropertyInput
            label="API Key for Metadata"
            id="optionsApiKeyForMetadata"
            type="text"
            value={properties?.optionsApiKeyForMetadata ?? ""}
            placeholder="Enter API Key for Metadata here"
            handleChange={(e) =>
              setProperty(
                ComponentProperty.OptionsApiKeyForMetadata,
                e.target.value
              )
            }
          />
        );

      case ComponentProperty.EnableSearch:
        return (
          <PropertyInput
            label="Enable Search"
            id="enableSearch"
            type="checkbox"
            value={properties?.enableSearch}
            handleChange={(e) =>
              setProperties({
                [ComponentProperty.EnableSearch]: (
                  e as React.ChangeEvent<HTMLInputElement>
                ).target.checked,
              })
            }
          />
        );

      case ComponentProperty.OptionsApiKeyForTitle:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              API Key for Title
            </p>
            <input
              id="optionsApiKeyForTitle"
              data-testid="optionsApiKeyForTitle"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.optionsApiKeyForTitle ?? ""}
              placeholder="Enter API Key for Title here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.OptionsApiKeyForTitle,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.ResponseDataStructure:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Response Data Structure
            </p>
            <select
              id="responseDataStructure"
              data-testid="responseDataStructure"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.responseDataStructure}
              onChange={(e) =>
                setProperty(
                  ComponentProperty.ResponseDataStructure,
                  e.target.value
                )
              }
            >
              <option value="">Select</option>
              <option value="array">Array of objects</option>
              <option value="string">Comma separated string</option>
            </select>
          </div>
        );

      case ComponentProperty.OptionsApiKeyForKeywords:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              API Key for Pills
            </p>
            <MultiSelect
              placeholder="Add Pills"
              options={[]}
              id="optionsApiKeyForKeywords"
              dataTestId="optionsApiKeyForKeywords"
              value={
                Array.isArray(properties?.optionsApiKeyForKeywords)
                  ? properties.optionsApiKeyForKeywords
                  : []
              }
              onChange={(selectedOptions) => {
                setProperty(
                  ComponentProperty.OptionsApiKeyForKeywords,
                  selectedOptions
                );
              }}
              onRemoveValue={(value) => {
                const currentValues = Array.isArray(
                  properties?.optionsApiKeyForKeywords
                )
                  ? properties.optionsApiKeyForKeywords
                  : [];
                const updatedValues = currentValues.filter(
                  (option: any) => option !== value
                );
                setProperty(
                  ComponentProperty.OptionsApiKeyForKeywords,
                  updatedValues
                );
              }}
            />
          </div>
        );

      case ComponentProperty.OptionsApiKeyForSequence:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              API Key for Sequence
            </p>
            <input
              id="optionsApiKeyForSequence"
              data-testid="optionsApiKeyForSequence"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={
                propertyComponent?.properties?.optionsApiKeyForSequence ?? ""
              }
              placeholder="Enter API Key for Sequence here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.OptionsApiKeyForSequence,
                  e.target.value
                )
              }
            />
          </div>
        );

      case ComponentProperty.OptionsApiHeaders:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API Headers</p>
            <JsonTextArea
              id="optionsApiHeaders"
              data-testid="optionsApiHeaders"
              value={properties.optionsApiHeaders ?? ""}
              onChange={(newVal) =>
                setProperty(ComponentProperty.OptionsApiHeaders, newVal)
              }
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.OptionsApiHeaders,
                  JSON.stringify(parsedObject)
                );
              }}
            />
          </div>
        );

      case ComponentProperty.OptionHelperText:
        return (
          properties?.showSingleOption &&
          properties?.showOptionHelperText && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <input
                id="optionHelperText"
                data-testid="optionHelperText"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                type="text"
                value={properties?.optionHelperText || ""}
                placeholder="Enter helper text here"
                onChange={(e) =>
                  setProperty("optionHelperText", e.target.value)
                }
              />
            </div>
          )
        );

      case ComponentProperty.Options:
        if (properties.isFetchingFromApi) return null;
        return (
          <>
            {properties?.showSingleOption ? (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>Option</p>
                <input
                  id="optionLabel"
                  data-testid="optionLabel"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="text"
                  value={properties?.option || ""}
                  placeholder="Enter label here"
                  onChange={(e) => setProperty("option", e.target.value)}
                />
              </div>
            ) : (
              <OptionsRenderer
                setOptions={setPropertyOptions}
                property={"options"}
                type={propertyComponent.type}
                options={propertyComponent.properties.options}
                id="options"
              />
            )}
          </>
        );

      case ComponentProperty.ShowOptionHelperText:
        return (
          properties?.showSingleOption && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <label className={sharedPropertiesStyles.checkBoxCenter}>
                <input
                  id="showOptionHelperText"
                  type="checkbox"
                  checked={!!properties?.showOptionHelperText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setProperty(
                      ComponentProperty.ShowOptionHelperText,
                      e.target.checked
                    );
                  }}
                  className={sharedPropertiesStyles.conditionalCheckBox}
                />
                <span className={sharedPropertiesStyles.propertyLabel}>
                  Show Option Helper Text
                </span>
              </label>
            </div>
          )
        );

      case ComponentProperty.ShowSingleOption:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showSingleOption"
                type="checkbox"
                checked={!!properties?.showSingleOption}
                onChange={handleLabelCheck}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Single Option
              </span>
            </label>
          </div>
        );

      case ComponentProperty.DefaultValue:
        if (properties.fetchFromSession === true) return null;
        return (
          <PropertyInput
            type={defaultValueType()}
            value={
              propertyComponent.type === "date" && properties.isTodaysDate
                ? formatDateToDDMMYYYY(new Date())
                : properties.defaultValue ?? ""
            }
            placeholder={
              propertyComponent.type === "date"
                ? "DD/MM/YYYY"
                : "Enter default value here"
            }
            handleChange={(e) =>
              setProperty(ComponentProperty.DefaultValue, e.target.value)
            }
            id="default-value"
            label="Default Value"
          />
        );

      case ComponentProperty.IsdCode:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>ISD code</p>
            <input
              id="isdCode"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties.isdCode ?? ""}
              placeholder="Enter ISD code here"
              onChange={(e) =>
                setProperty(ComponentProperty.IsdCode, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.PhoneNumber:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Contact Number
            </p>
            <input
              id="phoneNumber"
              className={`${sharedPropertiesStyles.textArea} ${sharedPropertiesStyles.mt5}`}
              type="number"
              value={properties.phoneNumber ?? ""}
              maxLength={10}
              placeholder="Enter contact number here"
              onChange={(e) =>
                setProperty(
                  ComponentProperty.PhoneNumber,
                  e.target.value.slice(0, 10)
                )
              }
            />
          </div>
        );

      case ComponentProperty.StoreInputApiInSession:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="storeInputApiInSession"
                data-testid="storeInputApiInSession"
                type="checkbox"
                checked={
                  !!propertyComponent?.properties?.storeInputApiInSession
                }
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.StoreInputApiInSession,
                    e.target.checked
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

      case ComponentProperty.StoreSelectedInSession:
        if (!properties.isFetchingFromApi) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="storeSelectedInSession"
                data-testid="storeSelectedInSession"
                type="checkbox"
                checked={
                  !!propertyComponent?.properties?.storeSelectedInSession
                }
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.StoreSelectedInSession,
                    e.target.checked
                  );
                }}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Store selected option in session
              </span>
            </label>
          </div>
        );

      case ComponentProperty.Keys:
        if (
          propertyComponent.type === "multi-select" &&
          (!properties.responseDataStructure ||
            properties.responseDataStructure === "string")
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Request Body Keys
            </p>
            <MultiSelect
              placeholder="Add Request Body Keys"
              options={[]}
              id="requestBodyKeys"
              dataTestId="requestBodyKeys"
              value={Array.isArray(properties?.keys) ? properties.keys : []}
              onChange={(selectedOptions) => {
                setProperty(ComponentProperty.Keys, selectedOptions);
              }}
              onRemoveValue={(value) => {
                const currentValues = Array.isArray(properties?.keys)
                  ? properties.keys
                  : [];
                const updatedValues = currentValues.filter(
                  (option: any) => option !== value
                );
                setProperty(ComponentProperty.Keys, updatedValues);
              }}
            />
          </div>
        );

      case ComponentProperty.EnableCalendar:
        return (
          <PropertyInput
            id="enableCalendar"
            type="checkbox"
            label="Show Calendar"
            value={!!properties?.enableCalendar}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.EnableCalendar,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );
      case ComponentProperty.EnableImageCapture:
        return (
          <PropertyInput
            id="enableImageCapture"
            type="checkbox"
            label="Enable Image Capture"
            value={!!properties?.enableImageCapture}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.EnableImageCapture,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.IsUploadAllowed:
        return (
          <PropertyInput
            id="isUploadAllowed"
            type="text"
            label="Is Upload Allowed"
            placeholder="Enter pathkey"
            value={properties.isUploadAllowed}
            handleChange={(e) => {
              setProperty(ComponentProperty.IsUploadAllowed, e.target.value);
            }}
          />
        );

      case ComponentProperty.IsPhotoAllowed:
        return (
          <PropertyInput
            id="isPhotoAllowed"
            type="text"
            label="Is Photo Allowed"
            placeholder="Enter pathkey"
            value={properties.isPhotoAllowed}
            handleChange={(e) => {
              setProperty(ComponentProperty.IsPhotoAllowed, e.target.value);
            }}
          />
        );

      case ComponentProperty.IsWatermarkAllowed:
        return (
          <PropertyInput
            label="Is Watermark Allowed"
            placeholder="Enter pathkey"
            type={"text"}
            id={"isWatermarkAllowed"}
            value={properties.isWatermarkAllowed}
            handleChange={(e) => {
              setProperty(ComponentProperty.IsWatermarkAllowed, e.target.value);
            }}
          />
        );
      
      case ComponentProperty.IsLocationAllowed:
        return (
          <PropertyInput
            label="Is Location Allowed"
            type={"text"}
            id={"isLocationAllowed"}
            placeholder="Enter pathkey"
            value={properties?.isLocationAllowed}
            handleChange={(e) => {
              setProperty(ComponentProperty.IsLocationAllowed, e.target.value);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div id="dataPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.DataPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.DataPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Data</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.DataPanel) && (
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

export default DataPanel;
