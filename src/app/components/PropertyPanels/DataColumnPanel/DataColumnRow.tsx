import React, { Fragment } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { ComponentProperty } from "@/app/data/componentProperties";
import styles from "./DataColumnPanel.module.scss";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";
import { useMicrosite } from "@/app/context/MicrositeContext";
import DragDropFileUpload from "../../UtilityComponents/DragDropFileUpload/DragDropFileUpload";
import { getColData, getColumnDataPropertyName } from "./DataColumnPanel";
import DisplayValuePanel from "../DisplayValuePanel/DisplayValuePanel";
import {
  DataTableColumn,
  BaseComponent,
  FilterDetails,
  ConditionalRoute,
  GridData,
} from "@/app/types/types";
import {
  columnDataTypes,
  filterTypes,
  CURRENCY,
  DATE_FORMAT,
  textAlignTypes,
  InputKeyFormat,
} from "@/app/utils/constants";
import ConditonalRouting from "../ActionPanel/ConditonalRouting";
import { getComponents } from "@/app/utils/utils";
import { propertyIcons } from "@/app/data/propertyIcons";
import Slider from "../../UIComponents/Slider/Slider";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { useUserTask } from "@/app/context/UserTaskContext";

interface DataColumnRowProps {
  id: number;
  column: DataTableColumn | GridData;
  propertyComponent: BaseComponent;
  setProperty: (prop: string, value: any) => void;
}

interface HandleChangeArgs {
  name: string;
  value: string | boolean | FilterDetails;
  filterDetails?: FilterDetails;
}

const DataColumnRow = ({
  id,
  column,
  propertyComponent,
  setProperty,
}: DataColumnRowProps) => {
  const { properties } = column;
  const { type } = propertyComponent;
  const colData = getColData(type, propertyComponent.properties);
  const columnDataPropertyName = getColumnDataPropertyName(type);
  const { microsite, activePageCode } = useMicrosite();
  const { userTask } = useUserTask();
  let conditionalRoutings = column.properties?.conditionalRoutes ?? [];

  const handleFilterDetails = ({
    name,
    value,
    filterDetails,
  }: HandleChangeArgs) => {
    let newFilterDetails = { ...(filterDetails ?? {}), [name]: value };
    handleChange("filterDetails", newFilterDetails as FilterDetails);
  };
  const pageList = microsite.pages
    .filter((page) => page.pageCode !== activePageCode)
    .map((page) => {
      const splitValue = page.pageCode.slice(page.pageCode.indexOf("_") + 1);
      return {
        name: splitValue,
        slug: splitValue,
        isPopup: userTask?.properties?.showAsPopup ?? false,
      };
    });

  const selectedPage = pageList.find(
    (page) => page.slug === properties.routePage
  );
  const isInvalidWidth =
    colData.reduce((acc, obj) => acc + (obj.properties.columnWidth ?? 0), 0) >
    100;
  const components = getComponents(userTask?.components);
  const prefixSuffixOptions = [
    { label: "Prefix", value: "prefix" },
    { label: "Suffix", value: "suffix" },
    { label: "Prefix and Suffix", value: "prefix-suffix" },
  ];

  const handleChange = (name: string, value: any) => {
    const updatedData = colData.map((col: DataTableColumn | GridData) =>
      col.id === column.id
        ? {
            ...col,
            properties: {
              ...col.properties,
              [name]: value,
              ...(name === "method" &&
                value === "DELETE" && { requestBodySpecs: "" }),
            },
          }
        : col
    );
    setProperty(columnDataPropertyName, updatedData);
  };

  const handleAddConditionalRoute = () => {
    let updatedData = [...conditionalRoutings];
    const conditionalRoute: ConditionalRoute = {
      condition: {
        leftOperand: "",
        operator: "",
        rightOperand: "",
      },
      route: "",
    };
    updatedData?.push(conditionalRoute);
    handleChange("conditionalRoutes", updatedData);
  };

  const deleteCondition = (index: number) => {
    const updatedData = conditionalRoutings.filter(
      (_: any, idx: number) => idx !== index
    );
    handleChange("conditionalRoutes", updatedData);
  };

  const handleRouteChange = (
    name: string,
    value: ConditionalRoute["condition"] | string,
    index: number
  ) => {
    let updatedObj = [...conditionalRoutings];
    updatedObj[index] = { ...updatedObj[index], [name]: value };
    handleChange("conditionalRoutes", updatedObj);
  };

  const handlePrefixSuffixChange = (prefixSuffix: string) => {
    return (
      <>
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>
            {
              prefixSuffixOptions.find((item) => item.value === prefixSuffix)
                ?.label
            }{" "}
            type
          </p>
          <select
            id={`${prefixSuffix}Type-${id + 1}`}
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            value={properties?.[`${prefixSuffix}Type`] ?? ""}
            onChange={(e) =>
              handleChange(`${prefixSuffix}Type`, e.target.value)
            }
          >
            <option value="text">Text</option>
            <option value="icon">Icon</option>
          </select>
        </div>
        {properties?.[`${prefixSuffix}Type`] === "text" && (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Text</p>
            <input
              id={`${prefixSuffix}Text-${id + 1}`}
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.[`${prefixSuffix}Text`] ?? ""}
              placeholder="Enter Text"
              onChange={(e) =>
                handleChange(`${prefixSuffix}Text`, e.target.value)
              }
            />
          </div>
        )}
        {properties?.[`${prefixSuffix}Type`] === "icon" && (
          <>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>
                Icon Upload Type
              </p>
              <select
                id={`${prefixSuffix}IconUploadType-${id + 1}`}
                data-testid="iconUploadType"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                value={properties?.[`${prefixSuffix}IconUploadType`] ?? ""}
                onChange={(e) =>
                  handleChange(`${prefixSuffix}IconUploadType`, e.target.value)
                }
              >
                <option value="url">URL</option>
                <option value="file-upload">File Upload</option>
              </select>
            </div>
            {properties?.[`${prefixSuffix}IconUploadType`] === "url" && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>Icon URL</p>
                <input
                  id={`${prefixSuffix}IconUrl-${id + 1}`}
                  data-testid="iconUrl"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="text"
                  value={properties?.[`${prefixSuffix}IconUrl`] ?? ""}
                  placeholder="Enter icon URL"
                  onChange={(e) =>
                    handleChange(`${prefixSuffix}IconUrl`, e.target.value)
                  }
                />
              </div>
            )}
            {properties?.[`${prefixSuffix}IconUploadType`] ===
              "file-upload" && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Image Upload
                </p>
                <DragDropFileUpload
                  id={`${prefixSuffix}IconUpload-${id + 1}`}
                  componentId={propertyComponent.id}
                  propertyKey={`${prefixSuffix}IconUrl`}
                  fileTypes={["svg", "png", "jpg", "jpeg"]}
                  maxSize={2 * 1024 * 1024}
                  buttonClassName={styles.buttonStyle}
                  handleChange={handleChange}
                />
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Label</p>
        <input
          id={`label-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          type="text"
          value={properties?.label || ""}
          placeholder="Enter Label"
          onChange={(e) => handleChange("label", e.target.value)}
        />
      </div>
      {type === "data-grid" && (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>Value</p>
          <input
            id={`value-${id + 1}`}
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            type="text"
            value={properties?.value || ""}
            placeholder="Enter Value"
            onChange={(e) => handleChange("value", e.target.value)}
          />
        </div>
      )}
      {type === "table" && (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>Key</p>
          <input
            id={`key-${id + 1}`}
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            type="text"
            value={properties?.name || ""}
            placeholder="Enter Key"
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
      )}
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Column Data Type</p>
        <select
          id={`columnInputType-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.columnInputType ?? ""}
          onChange={(e) => handleChange("columnInputType", e.target.value)}
        >
          <option value="">Select Data Type</option>
          {columnDataTypes.map((fieldType) => (
            <option key={fieldType.value} value={fieldType.value}>
              {fieldType.label}
            </option>
          ))}
        </select>
      </div>

      {properties.columnInputType === "fetchDisplayValueFromApi" && (
        <DisplayValuePanel
          propertyKeys={[
            ComponentProperty.FetchDisplayValueApiUrl,
            ComponentProperty.FetchDisplayValueApiKey,
            ComponentProperty.FetchDisplayValueApiHeaders,
          ]}
          propertyComponent={{
            ...propertyComponent,
            properties: column.properties,
          }}
          setProperty={handleChange}
        />
      )}

      {properties.columnInputType === "number" && (
        <>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isCurrency"
                type="checkbox"
                checked={!!properties?.isCurrency}
                onChange={(e) => handleChange("isCurrency", e.target.checked)}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Currency
              </span>
            </label>
            {properties?.isCurrency && (
              <>
                <p
                  className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt5}`}
                >
                  Currency Name
                </p>
                <select
                  name="currencyName"
                  id="currencyName"
                  data-testid="currencyName"
                  value={properties?.currencyName ?? ""}
                  onChange={(e) => handleChange("currencyName", e.target.value)}
                  className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
                >
                  {CURRENCY.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <PropertyInput
            id="decimal"
            type="number"
            min={0}
            max={10}
            label="Max Decimal Precision"
            value={properties?.decimalPrecision}
            placeholder="Enter decimal precision"
            handleChange={(e) => {
              handleChange(
                "decimalPrecision",
                e.target.value !== "" ? Number(e.target.value) : ""
              );
            }}
          />
        </>
      )}
      {properties.columnInputType === "date" && (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>
            Date Format Type
          </p>
          <select
            name="format"
            id={`format-${id + 1}`}
            data-testid="format"
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            value={properties?.format ?? ""}
            onChange={(e) => handleChange("format", e.target.value)}
          >
            {DATE_FORMAT.map((dateType) => (
              <option key={dateType.value} value={dateType.value}>
                {dateType.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {properties.columnInputType !== "api-action" && (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>
            Prefix / Suffix
          </p>
          <select
            id={`prefixSuffix-${id + 1}`}
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            value={properties?.prefixSuffix ?? ""}
            onChange={(e) => handleChange("prefixSuffix", e.target.value)}
          >
            <option value="">None</option>
            {prefixSuffixOptions.map((fieldType) => (
              <option key={fieldType.value} value={fieldType.value}>
                {fieldType.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {properties.prefixSuffix &&
        properties?.prefixSuffix !== "" &&
        (properties?.prefixSuffix === "prefix-suffix" ? (
          <>
            {handlePrefixSuffixChange("prefix")}
            {handlePrefixSuffixChange("suffix")}
          </>
        ) : (
          <>{handlePrefixSuffixChange(properties?.prefixSuffix)}</>
        ))}

      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Align</p>
        <div
          className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
        >
          {textAlignTypes.map((alignment) => (
            <button
              data-testid={alignment}
              id={alignment}
              key={alignment}
              className={`${sharedPropertiesStyles.option} ${
                properties?.columnAlign === alignment
                  ? sharedPropertiesStyles.active
                  : ""
              }`}
              onClick={() => handleChange("columnAlign", alignment)}
            >
              <div
                className={sharedPropertiesStyles.iconContainer}
                dangerouslySetInnerHTML={{
                  __html: propertyIcons
                    .filter(
                      (icon) =>
                        icon.property === "textAlign" &&
                        icon.value === alignment
                    )
                    .map((icon) => icon.svgCode),
                }}
              ></div>
            </button>
          ))}
        </div>
      </div>
      {type === "table" && properties.columnInputType !== "api-action" && (
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p className={sharedPropertiesStyles.propertyLabel}>Width</p>
          <Slider
            id="columnWidth"
            min={0}
            max={100}
            step={5}
            value={properties?.columnWidth ?? 100}
            valueSuffix="%"
            onChange={(value) => handleChange("columnWidth", value)}
          />
          {isInvalidWidth && (
            <span className={sharedPropertiesStyles.errorMessage}>
              Total width cannot exceed 100%.
            </span>
          )}
        </div>
      )}
      {type === "table" && properties.columnInputType === "api-action" && (
        <>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Action button type
            </p>
            <select
              data-testid="buttonActionType"
              id={"buttonActionType"}
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties?.buttonActionType ?? "text"}
              onChange={(e) => handleChange("buttonActionType", e.target.value)}
            >
              <option value="text">Text</option>
              <option value="icon">Icon</option>
            </select>
          </div>
          {properties?.buttonActionType === "text" && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Text</p>
              <input
                data-testid="buttonActionText"
                id="buttonActionText"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                type="text"
                value={properties?.buttonActionText ?? ""}
                placeholder="Enter Text"
                onChange={(e) =>
                  handleChange("buttonActionText", e.target.value)
                }
              />
            </div>
          )}
          {properties?.buttonActionType === "icon" && (
            <>
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Icon Upload Type
                </p>
                <select
                  id="buttonIconUploadType"
                  data-testid="buttonIconUploadType"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  value={properties?.iconUploadType ?? ""}
                  onChange={(e) =>
                    handleChange("iconUploadType", e.target.value)
                  }
                >
                  <option value="url">URL</option>
                  <option value="file-upload">File Upload</option>
                </select>
              </div>
              {properties?.iconUploadType === "url" && (
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>
                    Icon URL
                  </p>
                  <input
                    id="buttonIconUrl"
                    data-testid="buttonIconUrl"
                    className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                    type="text"
                    value={properties?.iconUrl ?? ""}
                    placeholder="Enter icon URL"
                    onChange={(e) => handleChange("iconUrl", e.target.value)}
                  />
                </div>
              )}
              {properties?.iconUploadType === "file-upload" && (
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>
                    Image Upload
                  </p>
                  <DragDropFileUpload
                    id=""
                    componentId={propertyComponent.id}
                    propertyKey={`iconUrl`}
                    fileTypes={["svg", "png", "jpg", "jpeg"]}
                    maxSize={2 * 1024 * 1024}
                    buttonClassName={styles.buttonStyle}
                    handleChange={handleChange}
                  />
                </div>
              )}
            </>
          )}
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showConfirmation"
                data-testid="showConfirmation"
                type="checkbox"
                checked={!!properties?.showConfirmation}
                onChange={(e) =>
                  handleChange("showConfirmation", e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Confirmation
              </span>
            </label>
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API Name</p>
            <input
              id="apiName"
              data-testid="apiName"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.apiName ?? ""}
              placeholder="Enter API Name here"
              onChange={(e) => handleChange("apiName", e.target.value)}
            />
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Method</p>
            <select
              id="method"
              data-testid="method"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.method}
              onChange={(e) => handleChange("method", e.target.value)}
            >
              <option value="">Select a method</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API URL</p>
            <input
              id="apiUrl"
              data-testid="apiUrl"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.apiUrl ?? ""}
              placeholder="Enter API URL here"
              onChange={(e) => handleChange("apiUrl", e.target.value)}
            />
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>API Key</p>
            <input
              id="apiKey"
              data-testid="apiKey"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.apiKey ?? ""}
              placeholder="Enter API Key here"
              onChange={(e) => handleChange("apiKey", e.target.value)}
            />
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Headers</p>
            <JsonTextArea
              id="apiHeaders"
              data-testid="apiHeaders"
              value={properties.apiHeaders ?? ""}
              onChange={(newVal) => handleChange("apiHeaders", newVal)}
              onValidJson={(parsedObject) => {
                handleChange("apiHeaders", JSON.stringify(parsedObject));
              }}
            />
          </div>
          {properties.method !== "DELETE" && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p
                className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
              >
                Request Body Specs
              </p>
              <JsonTextArea
                id="requestBodySpecs"
                data-testid="requestBodySpecs"
                value={properties.requestBodySpecs ?? ""}
                onChange={(newVal) => handleChange("requestBodySpecs", newVal)}
                onValidJson={(parsedObject) => {
                  handleChange(
                    "requestBodySpecs",
                    JSON.stringify(parsedObject)
                  );
                }}
              />
            </div>
          )}
        </>
      )}
      {type === "table" && properties.columnInputType !== "api-action" && (
        <>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="enableFilter"
                type="checkbox"
                checked={!!properties?.enableFilter}
                onChange={(e) => handleChange("enableFilter", e.target.checked)}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Enable Filter
              </span>
            </label>
          </div>
          {!!properties?.enableFilter && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>
                Filter Type
              </p>
              <select
                id="filterType"
                data-testid="filterType"
                className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5} ${styles.filterProperties}`}
                value={properties?.filterDetails?.filterType}
                onChange={(e) =>
                  handleFilterDetails({
                    name: "filterType",
                    value: e.target.value,
                    filterDetails: properties?.filterDetails,
                  })
                }
              >
                <option value="">Select a value</option>
                {filterTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={sharedPropertiesStyles.propertyLabel}>
                Placeholder
              </p>
              <input
                id="filterPlaceholder"
                className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5} ${styles.filterProperties}`}
                type="text"
                value={properties?.filterDetails?.placeholder ?? ""}
                placeholder="Enter placeholder here"
                onChange={(e) =>
                  handleFilterDetails({
                    name: ComponentProperty.Placeholder,
                    value: e.target.value,
                    filterDetails: properties?.filterDetails,
                  })
                }
              />

              {properties?.filterDetails?.filterType == "exactMatch" && (
                <React.Fragment>
                  <p
                    className={sharedPropertiesStyles.propertyLabel}
                    data-testid="apiUrl"
                  >
                    API URL
                  </p>
                  <input
                    id="filterApiUrl"
                    data-testid="filterApiUrl"
                    className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5} ${styles.filterProperties}`}
                    type="text"
                    value={properties?.filterDetails?.apiUrl ?? ""}
                    placeholder="Enter API URL here"
                    onChange={(e) =>
                      handleFilterDetails({
                        name: ComponentProperty.ApiUrl,
                        value: e.target.value,
                        filterDetails: properties?.filterDetails,
                      })
                    }
                  />
                  <p className={sharedPropertiesStyles.propertyLabel}>
                    API Key
                  </p>
                  <input
                    id="filterApiKey"
                    data-testid="filterApiKey"
                    className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5} ${styles.filterProperties}`}
                    type="text"
                    value={properties?.filterDetails?.apiKey || ""}
                    placeholder="Enter API Key here"
                    onChange={(e) =>
                      handleFilterDetails({
                        name: ComponentProperty.ApiKey,
                        value: e.target.value,
                        filterDetails: properties?.filterDetails,
                      })
                    }
                  />
                </React.Fragment>
              )}
              {properties?.filterDetails?.filterType == "dateRange" && (
                <React.Fragment>
                  <p className={sharedPropertiesStyles.propertyLabel}>
                    minimum number
                  </p>
                  <input
                    id="dateRangeMinValue"
                    data-testid="dateRangeMinValue"
                    className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5} ${styles.filterProperties}`}
                    type="number"
                    value={properties?.filterDetails?.minValue ?? ""}
                    placeholder="Enter minimum value here"
                    onChange={(e) =>
                      handleFilterDetails({
                        name: "minValue",
                        value: e.target.value,
                        filterDetails: properties?.filterDetails,
                      })
                    }
                  />

                  <p className={sharedPropertiesStyles.propertyLabel}>
                    maximum number
                  </p>
                  <input
                    id="dateRangeMaxValue"
                    data-testid="dateRangeMaxValue"
                    className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
                    type="number"
                    value={properties?.filterDetails?.maxValue ?? ""}
                    placeholder="Enter maximum value here"
                    onChange={(e) =>
                      handleFilterDetails({
                        name: "maxValue",
                        value: e.target.value,
                        filterDetails: properties?.filterDetails,
                      })
                    }
                  />
                </React.Fragment>
              )}
            </div>
          )}
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="enableSorting"
                type="checkbox"
                checked={!!properties?.enableSorting}
                onChange={(e) =>
                  handleChange("enableSorting", e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Enable Sorting
              </span>
            </label>
          </div>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isClickable"
                data-testid="isClickable"
                type="checkbox"
                checked={!!properties?.isClickable}
                onChange={(e) => handleChange("isClickable", e.target.checked)}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Clickable
              </span>
            </label>
          </div>
          {!!properties?.isClickable && (
            <div className={styles.clickable}>
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Routing Type
                </p>
                <select
                  id="routingType"
                  data-testid="routingType"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  value={properties.routingType}
                  onChange={(e) => handleChange("routingType", e.target.value)}
                >
                  <option value="">Select a routing type</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="SamePage">SamePage</option>
                </select>
              </div>
              {properties.routingType === "Internal" && (
                <div>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                  >
                    <label className={sharedPropertiesStyles.checkBoxCenter}>
                      <input
                        id="navigateWithoutDataTransfer"
                        data-testid="navigateWithoutDataTransfer"
                        type="checkbox"
                        checked={!!properties?.navigateWithoutDataTransfer}
                        onChange={(e) =>
                          handleChange(
                            "navigateWithoutDataTransfer",
                            e.target.checked
                          )
                        }
                        className={sharedPropertiesStyles.conditionalCheckBox}
                      />
                      <span className={sharedPropertiesStyles.propertyLabel}>
                        Navigate without data transfer
                      </span>
                    </label>
                  </div>
                  <ToggleSwitch
                    id="isConditional"
                    size="small"
                    isToggled={!!properties.isConditional}
                    label="Is Conditional"
                    onToggle={() =>
                      handleChange("isConditional", !properties.isConditional)
                    }
                  />
                  {!properties.isConditional && (
                    <>
                      <div
                        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column} ${styles.columns}`}
                      >
                        <p className={sharedPropertiesStyles.propertyLabel}>
                          Page
                        </p>
                        <select
                          id="routePage"
                          data-testid="routePage"
                          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                          value={properties.routePage}
                          onChange={(e) =>
                            handleChange("routePage", e.target.value)
                          }
                        >
                          <option value="">Select a page</option>
                          {pageList?.map((page, index) => (
                            <option
                              key={`${page?.slug}-${index}`}
                              value={page?.slug}
                            >
                              {page?.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedPage && selectedPage.isPopup && (
                        <div
                          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column} ${styles.columns}`}
                        >
                          <p className={sharedPropertiesStyles.propertyLabel}>
                            Action on popup close
                          </p>
                          <select
                            id="onCloseAction"
                            data-testid="onCloseAction"
                            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                            value={properties.onCloseAction}
                            onChange={(e) =>
                              handleChange("onCloseAction", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {components?.map((comp, index) => (
                              <option key={`${comp}-${index}`} value={comp}>
                                {comp}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  {properties.isConditional && (
                    <ConditonalRouting
                      properties={properties}
                      deleteCondition={deleteCondition}
                      handleAddConditionalRoute={handleAddConditionalRoute}
                      handleRouteChange={handleRouteChange}
                    />
                  )}
                </div>
              )}
              {properties.routingType === "External" && (
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>
                    External URL
                  </p>
                  <input
                    id="columnUrl"
                    data-testid="columnUrl"
                    className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
                    placeholder="Enter URL"
                    value={properties?.externalURL}
                    onChange={(e) =>
                      handleChange("externalURL", e.target.value)
                    }
                  ></input>
                </div>
              )}
              {properties.routingType !== "Internal" && (
                <React.Fragment>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                  >
                    <p className={sharedPropertiesStyles.propertyLabel}>
                      Session Data key
                    </p>
                    <input
                      id={`name-${column?.id}`}
                      data-testid={`name-${column?.id}`}
                      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                      type="text"
                      value={properties?.dataTransfer?.name ?? ""}
                      placeholder="Enter Name here"
                      onChange={(e) => {
                        e.preventDefault();
                        const value = e.target.value.replace(
                          InputKeyFormat,
                          ""
                        );
                        let data = JSON.parse(
                          JSON.stringify(properties?.dataTransfer ?? {})
                        );
                        data["name"] = value;
                        handleChange("dataTransfer", data);
                      }}
                    />
                  </div>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                  >
                    <p
                      className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
                    >
                      Body
                    </p>
                    <JsonTextArea
                      id={`body-${column?.id}`}
                      data-testid={`body-${column?.id}`}
                      value={properties?.dataTransfer?.body ?? "{}"}
                      onChange={(newVal) =>
                        handleChange("dataTransfer", newVal)
                      }
                      onValidJson={(parsedObject) => {
                        let data = JSON.parse(
                          JSON.stringify(properties?.dataTransfer ?? {})
                        );
                        data["body"] = JSON.stringify(parsedObject);
                        handleChange("dataTransfer", data);
                      }}
                    />
                  </div>
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                  >
                    <p className={sharedPropertiesStyles.propertyLabel}>
                      Clear session on click
                    </p>
                    <textarea
                      id={`sessionKeys-${id + 1}`}
                      data-testid={`sessionKeys-${id + 1}`}
                      placeholder="Enter session keys (comma-separated)"
                      value={properties?.sessionKeys ?? ""}
                      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                      onChange={(e) =>
                        handleChange("sessionKeys", e.target.value)
                      }
                    />
                  </div>
                </React.Fragment>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataColumnRow;
