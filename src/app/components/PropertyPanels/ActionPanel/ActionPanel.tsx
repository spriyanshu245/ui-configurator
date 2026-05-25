"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import {
  actionTypes,
  POSITIONS,
  PropertyPanels,
  requestBodyTypes,
  ROUTING_TYPE,
  externalServices,
  DATA_TYPE_CONFIG,
} from "@/app/utils/constants";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import { useFindForm } from "@/app/hooks/useFindForm";
import JsonTextarea from "../../JsonTextArea/JsonTextArea";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";
import {
  ConditionalRoute,
  DataTableColumn,
  GridData,
  IRequestData,
  Microsite,
  MultiActionCtaAction,
  UserTask,
} from "@/app/types/types";
import { useMicrosite } from "@/app/context/MicrositeContext";
import ConditonalRouting from "./ConditonalRouting";
import {
  getComponents,
  renderNameKeyOptions,
  generateRandomId,
  renderOptions,
} from "@/app/utils/utils";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getRecordVersions,
  getAllRecords,
} from "../../../utils/dataTableUtils";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import ActionTypePanel from "./ActionTypePanel";
import MultiActionTypePanel from "./MultiActionTypePanel";

interface ActionPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
  component: any;
}

const ActionPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
  component,
}: ActionPanelProps) => {
  const [selectedPageDsl, setSelectedPageDsl] = useState<
    UserTask | undefined
  >();
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { parentForm } = useParentFormProperties(propertyComponent);
  const { formNames } = useFindForm();
  const { microsite, activePageCode } = useMicrosite();
  const { formsNamekeys, userTask, getPageDSL } = useUserTask();
  const conditionalRoutings = properties?.conditionalRoutes ?? [];
  const [microsites, setMicrosites] = useState<Microsite[]>([]);
  const [versions, setVersions] = useState<Microsite[]>([]);

  const dataConfig = DATA_TYPE_CONFIG["microsites"];
  const params = useParams();
  const workspaceCode = params.workspaceCode;

  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const getMicrosites = async () => {
    try {
      const requestData: IRequestData = {
        endpoint: dataConfig.endpoint,
        method: "GET",
        headers: { "workspace-code": workspaceCode as string },
      };
      let response: Microsite[] = await getAllRecords(requestData);

      if (response && Array.isArray(response)) {
        let filtered = response?.filter(
          (res) => res.code !== params.micrositeUrlSlug
        );
        setMicrosites(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };

  const getMicrositeVersions = async (code: string) => {
    try {
      const response: Microsite[] = await getRecordVersions(
        code,
        dataConfig,
        workspaceCode as string
      );
      if (response && Array.isArray(response)) {
        setVersions(response);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };

  useEffect(() => {
    if (properties.routingType === "Microsite") {
      getMicrosites();
    }
  }, [properties]);

  const filteredPages = useMemo(
    () => microsite.pages.filter((page) => page.pageCode !== activePageCode),
    [activePageCode, microsite]
  );

  useEffect(() => {
    if (
      properties.columnInputType === "multiple-actions" &&
      (!Array.isArray(properties.multipleActions) ||
        properties.multipleActions.length === 0)
    ) {
      setProperty(ComponentProperty.MultipleActions, [
        {
          id: generateRandomId(),
          properties: {
            tableColumnActionTypes: "",
            label: "",
          },
        },
      ]);
    }
  }, [properties.columnInputType]);

  useEffect(() => {
    if (
      propertyComponent.type === "multi-action-cta" &&
      (!Array.isArray(properties.actions) || properties.actions.length === 0)
    ) {
      setProperty(ComponentProperty.Actions, [
        {
          id: generateRandomId(),
        },
      ]);
    }
  }, [propertyComponent.type]);

  const multiActionData = properties.multipleActions || [];
  const multiActionCtaData: MultiActionCtaAction[] = properties.actions ?? [];

  const handleAddCol = () => {
    const newColumn = {
      id: generateRandomId(),
      properties: {
        tableColumnActionTypes: "",
        label: "",
      },
    };

    setProperty(ComponentProperty.MultipleActions, [
      ...multiActionData,
      newColumn,
    ]);
  };

  const handleAddAction = () => {
    const newAction: MultiActionCtaAction = {
      id: generateRandomId(),
    };
    setProperty(ComponentProperty.Actions, [...multiActionCtaData, newAction]);
  };

  const [draggedActionId, setDraggedActionId] = useState<number | null>(null);

  const pageList = useMemo(
    () =>
      filteredPages.map((p) => ({
        value: p.pageCode.slice(p.pageCode.indexOf("_") + 1),
        label: p.pageCode,
      })),
    [filteredPages]
  );

  const selectedPage = useMemo(
    () => pageList.find((page) => page.value === properties.routePage),
    [pageList, properties.routePage]
  );

  useEffect(() => {
    const fetchPage = async () => {
      const response = await getPageDSL(selectedPage?.label ?? "");
      setSelectedPageDsl(response);
    };
    fetchPage();
  }, [selectedPage]);

  let components = getComponents(userTask);

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
    setProperty(ComponentProperty.ConditionalRoutes, updatedData);
  };

  const deleteCondition = (index: number) => {
    const updatedData = conditionalRoutings.filter(
      (_: any, idx: number) => idx !== index
    );
    setProperty(ComponentProperty.ConditionalRoutes, updatedData);
  };

  const handleRouteChange = (
    name: string,
    value: ConditionalRoute["condition"] | string,
    index: number
  ) => {
    let updatedObj = [...conditionalRoutings];
    updatedObj[index] = { ...updatedObj[index], [name]: value };
    setProperty(ComponentProperty.ConditionalRoutes, updatedObj);
  };

  const handleMicrositeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let value = e.target.value;
    setProperty(ComponentProperty.RouteMicrosite, value);
  };

  useEffect(() => {
    if (
      properties.routingType === "Microsite" &&
      properties.routeMicrosite &&
      microsites.length > 0
    ) {
      getMicrositeVersions(properties.routeMicrosite);
    }
  }, [properties.routeMicrosite, microsites]);

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.SelectedService:
        return (
          <PropertyInput
            id="selectedService"
            type="select"
            label="External Service"
            options={externalServices}
            value={properties.selectedService ?? ""}
            placeholder="Select a service"
            handleChange={(e) =>
              setProperty(ComponentProperty.SelectedService, e.target.value)
            }
          />
        );
      case ComponentProperty.Method:
        if (
          properties.visibleOnApiSuccess ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit" &&
            properties.actionType !== "download") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
          return null;
        return (
          <PropertyInput
            type="select"
            placeholder="Select a method"
            label="Method"
            options={renderOptions(["GET", "POST", "PUT", "DELETE"])}
            id="method"
            value={properties.method}
            handleChange={(e) =>
              setProperty(ComponentProperty.Method, e.target.value)
            }
          />
        );

      case ComponentProperty.ApiUrl:
        if (
          properties.visibleOnApiSuccess ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit" &&
            properties.actionType !== "download") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
          return null;
        return (
          <PropertyInput
            id="apiUrl"
            label="API URL"
            type="text"
            value={propertyComponent?.properties?.apiUrl || ""}
            placeholder="Enter API URL here"
            handleChange={(e) =>
              setProperty(ComponentProperty.ApiUrl, e.target.value)
            }
          />
        );

      case ComponentProperty.ApiKey:
        if (
          propertyComponent.type === "table-column" &&
          properties.columnInputType !== "api-action"
        )
          return null;
        return (
          <PropertyInput
            id="apiKey"
            label="API Key"
            type="text"
            value={propertyComponent?.properties?.apiKey ?? ""}
            placeholder="Enter API Key here"
            handleChange={(e) =>
              setProperty(ComponentProperty.ApiKey, e.target.value)
            }
          />
        );

      case ComponentProperty.ApiName:
        if (
          properties.visibleOnApiSuccess ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit" &&
            properties.actionType !== "download") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
          return null;
        return (
          <PropertyInput
            id="apiName"
            label="API Name"
            type="text"
            value={propertyComponent?.properties?.apiName ?? ""}
            placeholder="Enter API Name here"
            handleChange={(e) =>
              setProperty(ComponentProperty.ApiName, e.target.value)
            }
          />
        );

      case ComponentProperty.ApiValue:
        return (
          <PropertyInput
            type="text"
            placeholder="Enter API Value here"
            label="API Value"
            id="apiValue"
            value={propertyComponent?.properties?.apiValue ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.ApiValue, e.target.value)
            }
          />
        );

      case ComponentProperty.VisibleOnApiSuccess:
        return (
          <ToggleSwitch
            id="visibleOnApiSuccess"
            size="small"
            isToggled={!!properties?.visibleOnApiSuccess}
            label="Visible On Form Success"
            onToggle={(e) =>
              setProperty(
                ComponentProperty.VisibleOnApiSuccess,
                !properties.visibleOnApiSuccess
              )
            }
          />
        );

      case ComponentProperty.LinkedForm:
        if (
          (propertyComponent.type === "table" &&
            !properties.visibleOnApiSuccess) ||
          (propertyComponent.type === "button-v2" &&
            (propertyComponent.category === "form" ||
              (propertyComponent.category === "component" &&
                properties.actionType === "routing")))
        )
          return null;
        return (
          <PropertyInput
            type="select"
            placeholder="Select Linked Form"
            label="Linked Form"
            options={renderOptions(formNames)}
            id="linkedForm"
            value={propertyComponent?.properties?.linkedForm}
            handleChange={(e) =>
              setProperty(ComponentProperty.LinkedForm, e.target.value)
            }
          />
        );

      case ComponentProperty.EnableComponentLinking:
        return (
          <PropertyInput
            id="enableComponentLinking"
            data-testid="enableComponentLinking"
            type="checkbox"
            label="Enable Component Linking"
            value={properties?.enableComponentLinking ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.EnableComponentLinking,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.LinkToComponent:
        return (
          <>
            {properties.enableComponentLinking && (
              <PropertyInput
                id="linkToComponent"
                type="select"
                label="Link to Component"
                options={
                  propertyComponent?.properties?.linkedForm
                    ? renderNameKeyOptions(
                        formsNamekeys[propertyComponent?.properties?.linkedForm]
                      )
                    : renderNameKeyOptions(
                        formsNamekeys[parentForm?.properties.name ?? ""]
                      )
                }
                value={properties.linkToComponent}
                handleChange={(e) =>
                  setProperty(ComponentProperty.LinkToComponent, e.target.value)
                }
              />
            )}
          </>
        );

      case ComponentProperty.ApiHeaders:
        if (
          properties.visibleOnApiSuccess ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit" &&
            properties.actionType !== "download") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Headers</p>
            <JsonTextarea
              id="apiHeaders"
              data-testid="apiHeaders"
              value={properties.apiHeaders ?? ""}
              onChange={(newVal) =>
                setProperty(ComponentProperty.ApiHeaders, newVal)
              }
              onValidJson={(parsedObject) => {
                setProperty(
                  ComponentProperty.ApiHeaders,
                  JSON.stringify(parsedObject)
                );
              }}
            />
          </div>
        );
      case ComponentProperty.RequestBodyType:
        if (
          properties.visibleOnApiSuccess ||
          properties.method === "GET" ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
          return null;
        return (
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

      case ComponentProperty.RequestBodySpecs:
        if (
          (properties.requestBodyType &&
            properties.requestBodyType == "flat") ||
          properties.visibleOnApiSuccess ||
          properties.method === "GET" ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "api-action")
        )
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

      case ComponentProperty.SubmitOnChange:
        return (
          <PropertyInput
            id="submitOnChange"
            type="checkbox"
            label="Submit on Change"
            value={!!properties?.submitOnChange}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SubmitOnChange,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.ButtonPosition:
        return (
          <PropertyInput
            id="buttonPosition"
            type="select"
            label="Button Position"
            options={POSITIONS}
            value={properties.buttonPosition ?? ""}
            handleChange={(e) => setProperty("buttonPosition", e.target.value)}
          />
        );

      case ComponentProperty.ClearFormDataOnAction:
        if (
          propertyComponent.type === "button-v2" &&
          properties.actionType !== "submit"
        )
          return null;
        return (
          <PropertyInput
            id="clearFormDataOnAction"
            type="checkbox"
            label="Clear FormData on Action"
            value={!!properties?.clearFormDataOnAction}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ClearFormDataOnAction,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.SessionKeys:
        if (
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit" &&
            properties.actionType !== "routing") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable))
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Clear session on submit
            </p>
            <textarea
              id="sessionKeys"
              data-testid="sessionKeys"
              placeholder="Enter session keys (comma-separated)"
              value={properties?.sessionKeys ?? ""}
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              onChange={(e) =>
                setProperty(ComponentProperty.SessionKeys, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.RouteOnActionSuccess:
        if (
          propertyComponent.type === "button-v2" &&
          properties.actionType !== "submit"
        )
          return null;
        return (
          <PropertyInput
            id="routeOnActionSuccess"
            type="checkbox"
            label="Route on Action Success"
            value={!!properties?.routeOnActionSuccess}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.RouteOnActionSuccess,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.PersistPopupOnSuccess:
        return (
          <PropertyInput
            id="persistPopupOnSuccess"
            type="checkbox"
            label="Persist popup on success"
            value={properties?.persistPopupOnSuccess ?? false}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.PersistPopupOnSuccess,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );
      case ComponentProperty.SaveFormResponseOnSuccess:
        if (
          propertyComponent.type === "button-v2" &&
          properties.actionType !== "submit"
        )
          return null;
        return (
          <PropertyInput
            id="saveFormResponseOnSuccess"
            type="checkbox"
            label="Save Form Response On Success"
            value={properties?.saveFormResponseOnSuccess ?? true}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SaveFormResponseOnSuccess,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );
      case ComponentProperty.RoutingType:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <PropertyInput
            id="routingType"
            type="select"
            label="Routing Type"
            placeholder="Select a routing type"
            options={ROUTING_TYPE}
            value={properties.routingType}
            handleChange={(e) =>
              setProperty(ComponentProperty.RoutingType, e.target.value)
            }
          />
        );

      case ComponentProperty.ExternalURL:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "External" ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <PropertyInput
            id="externalURL"
            type="text"
            label="External URL"
            placeholder="Enter URL"
            value={properties?.externalURL}
            handleChange={(e) =>
              setProperty(ComponentProperty.ExternalURL, e.target.value)
            }
          />
        );

      case ComponentProperty.RouteMicrosite:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Microsite" ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Microsite</p>
            <select
              id="routeMicrosite"
              data-testid="routeMicrosite"
              className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
              value={properties.routeMicrosite}
              onChange={handleMicrositeChange}
            >
              <option value="">Select</option>
              {microsites?.map((microsite: any) => (
                <option key={microsite.code} value={microsite.code}>
                  {microsite.name}
                </option>
              ))}
            </select>
          </div>
        );

      case ComponentProperty.RouteMicrositeVersion:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Microsite" ||
          !properties.routeMicrosite ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Version</p>
            <select
              id="routeMicrositeVersion"
              data-testid="routeMicrositeVersion"
              className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
              value={properties.routeMicrositeVersion}
              onChange={(e) =>
                setProperty(
                  ComponentProperty.RouteMicrositeVersion,
                  e.target.value
                )
              }
            >
              <option value="">Select</option>
              {versions?.map((v: any) => (
                <option key={v.version} value={v.version}>
                  {v.version}
                </option>
              ))}
            </select>
          </div>
        );

      case ComponentProperty.NavigateWithoutDataTransfer:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Internal" ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <PropertyInput
            id="navigateWithoutDataTransfer"
            type="checkbox"
            label="Navigate without Data Transfer"
            value={!!properties?.navigateWithoutDataTransfer}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.NavigateWithoutDataTransfer,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
            className={sharedPropertiesStyles.conditionalCheckBox}
          />
        );

      case ComponentProperty.IsConditional:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Internal" ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable)
        )
          return null;
        return (
          <div>
            <ToggleSwitch
              id="isConditional"
              data-testid="isConditional"
              size="small"
              isToggled={!!properties.isConditional}
              label="Is Conditional"
              onToggle={() =>
                setProperty(
                  ComponentProperty.IsConditional,
                  !properties.isConditional
                )
              }
            />
          </div>
        );

      case ComponentProperty.RoutePage:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Internal" ||
          properties.isConditional ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable)) ||
          (propertyComponent.type === "stack" && !properties.isClickable) ||
          (propertyComponent.type === "repeatable-sub-section" &&
            !properties.isClickable) ||
          properties?.isDynamicRouting
        )
          return null;
        return (
          <PropertyInput
            id="routePage"
            type="select"
            label="Page"
            placeholder="Select a page"
            value={properties.routePage}
            handleChange={(e) =>
              setProperty(ComponentProperty.RoutePage, e.target.value)
            }
            options={pageList}
          />
        );

      case ComponentProperty.IsDynamicRouting:
        return (
          (propertyComponent.type === "button-v2" ||
            propertyComponent.type === "multi-action-submit") &&
          properties.routeOnActionSuccess && (
            <PropertyInput
              id="isDynamicRouting"
              type="checkbox"
              label="Is dynamic page routing"
              value={!!properties?.isDynamicRouting}
              handleChange={(e) =>
                setProperty(
                  ComponentProperty.IsDynamicRouting,
                  (e as ChangeEvent<HTMLInputElement>).target.checked
                )
              }
              className={sharedPropertiesStyles.conditionalCheckBox}
            />
          )
        );

      case ComponentProperty.RouteKey:
        return (
          properties?.isDynamicRouting &&
          (propertyComponent.type === "button-v2" ||
            propertyComponent.type === "multi-action-submit") &&
          properties.routeOnActionSuccess && (
            <PropertyInput
              id="routeKey"
              type="text"
              label="Page Route Key"
              placeholder="Enter page code route "
              value={properties.routeKey}
              handleChange={(e) =>
                setProperty(ComponentProperty.RouteKey, e.target.value)
              }
            />
          )
        );
      case ComponentProperty.OnCloseAction:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Internal" ||
          properties.isConditional ||
          !selectedPageDsl?.properties?.showAsPopup ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable))
        )
          return null;
        return (
          <PropertyInput
            id="onCloseAction"
            type="select"
            label="Action on Popup Close"
            placeholder="Select"
            value={properties.onCloseAction}
            options={renderOptions(components)}
            handleChange={(e) =>
              setProperty(ComponentProperty.OnCloseAction, e.target.value)
            }
          />
        );

      case ComponentProperty.ConditionalRoutes:
        if (
          (propertyComponent.type === "form" &&
            !properties.routeOnActionSuccess) ||
          (propertyComponent.type === "button-v2" &&
            !properties.routeOnActionSuccess &&
            properties.actionType !== "routing") ||
          properties?.routingType !== "Internal" ||
          !properties.isConditional ||
          (propertyComponent.type === "table-column" &&
            properties.columnInputType !== "routing-action" &&
            (properties.columnInputType === "api-action" ||
              !properties.isClickable))
        )
          return null;
        return (
          <ConditonalRouting
            properties={properties}
            deleteCondition={deleteCondition}
            handleAddConditionalRoute={handleAddConditionalRoute}
            handleRouteChange={handleRouteChange}
          />
        );

      case ComponentProperty.StoreDataInSession:
        if (
          properties.visibleOnApiSuccess ||
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit")
        )
          return null;
        return (
          <PropertyInput
            id="storeDataInSession"
            type="checkbox"
            label="Store data in session"
            value={!!propertyComponent?.properties?.storeDataInSession}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.StoreDataInSession,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.ActionType:
        if (propertyComponent.type !== "button-v2") return null;
        return (
          <PropertyInput
            id="actionType"
            type="select"
            label="Action Type"
            options={actionTypes}
            value={properties.actionType}
            handleChange={(e) =>
              setProperty(ComponentProperty.ActionType, e.target.value)
            }
          />
        );

      case ComponentProperty.ReferenceIdPath:
        if (properties.actionType !== "file-preview-action") return null;
        return (
          <PropertyInput
            id="referenceIdPath"
            type="text"
            label="Reference Id"
            placeholder="Enter reference Id path"
            value={properties.referenceIdPath}
            handleChange={(e) =>
              setProperty(ComponentProperty.ReferenceIdPath, e.target.value)
            }
          />
        );

      case ComponentProperty.IsClickable:
        if (
          propertyComponent.type === "table-column" &&
          (properties.columnInputType === "api-action" ||
            properties.columnInputType === "routing-action" ||
            properties.columnInputType === "multiple-actions")
        )
          return null;
        return (
          <PropertyInput
            id="isClickable"
            label="Is Clickable"
            type="checkbox"
            value={!!properties?.isClickable}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.IsClickable,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.MultipleActions:
        if (properties.columnInputType !== "multiple-actions") return null;
        return (
          <div className={sharedStyle.draggableRows}>
            {multiActionData.map(
              (col: GridData | DataTableColumn, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={col.id}
                  colData={multiActionData}
                  column={col}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={setProperty}
                  property={ComponentProperty.MultipleActions}
                >
                  <ActionTypePanel
                    id={index}
                    column={col as unknown as DataTableColumn}
                    propertyComponent={propertyComponent}
                    setProperty={setProperty}
                    parentComponentName={component.properties.name}
                  />
                </ExpandableColumn>
              )
            )}
            <AddExpandableColumn handleAddCol={handleAddCol} label="Action" />
          </div>
        );

      case ComponentProperty.ShowConfirmation:
        if (
          propertyComponent.type === "table-column" &&
          properties.columnInputType !== "api-action"
        )
          return null;
        return (
          <PropertyInput
            id="showConfirmation"
            type="checkbox"
            label=" Show Confirmation"
            value={!!properties?.showConfirmation}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ShowConfirmation,
                (e as ChangeEvent<HTMLInputElement>).target.checked
              )
            }
          />
        );

      case ComponentProperty.Actions:
        if (propertyComponent.type !== "multi-action-cta") return null;
        return (
          <div className={sharedStyle.draggableRows}>
            {multiActionCtaData.map(
              (action: MultiActionCtaAction, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={action.id}
                  colData={multiActionCtaData}
                  column={action}
                  draggedItemId={draggedActionId}
                  setDraggedItemId={setDraggedActionId}
                  setProperty={setProperty}
                  property={ComponentProperty.Actions}
                >
                  <MultiActionTypePanel
                    id={index}
                    action={action}
                    propertyComponent={propertyComponent}
                    setProperty={setProperty}
                  />
                </ExpandableColumn>
              )
            )}
            <AddExpandableColumn
              handleAddCol={handleAddAction}
              label="Action"
            />
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div id="actionPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.ActionPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.ActionPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Action</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.ActionPanel) && (
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

export default ActionPanel;
