import { useMemo, useState } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { componentPropertiesMap } from "@/app/data/componentPropertiesMap";
import { propertyPanelsMap } from "@/app/data/propertiesPanelMap";
import { ComponentProperty } from "@/app/data/componentProperties";
import { BaseComponent, MultiActionCtaAction } from "@/app/types/types";
import { multiActionCtaActionTypes } from "@/app/utils/constants";
import { PropertiesContext } from "@/app/context/PropertiesContext";

interface MultiActionTypePanelProps {
  id: number;
  action: MultiActionCtaAction;
  propertyComponent: BaseComponent;
  setProperty: (prop: string, value: unknown) => void;
}

const MultiActionTypePanel = ({
  id,
  action,
  propertyComponent,
  setProperty,
}: MultiActionTypePanelProps) => {
  const actionsData: MultiActionCtaAction[] =
    propertyComponent?.properties?.actions ?? [];

  const effectiveType = action.actionType
    ? `multi-action-${action.actionType}`
    : "";

  const relevantProps = effectiveType
    ? (componentPropertiesMap[effectiveType] ?? [])
    : [];

  const panelGroups = new Map<React.ComponentType<any>, ComponentProperty[]>();
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});

  const localValue = useMemo(
    () => ({
      isPanelOpen: (panel: string | number) => {
        const name = typeof panel === "string" ? panel : String(panel);
        return !!openPanels[name];
      },
      togglePanel: (panel: string | number) => {
        const name = typeof panel === "string" ? panel : String(panel);
        setOpenPanels((prev) => ({ ...prev, [name]: !prev[name] }));
      },
      isPropertyPaneVisible: true,
      propertyComponentId: null,
      propertyPageCode: null,
      resetActiveComponent: () => {},
      resetActivePage: () => {},
      setActiveComponent: () => {},
      togglePropertyPane: () => {},
      setActivePage: () => {},
    }),
    [openPanels],
  );

  relevantProps.forEach((propKey) => {
    const PanelComponent = propertyPanelsMap[propKey];
    if (!PanelComponent) return;
    if (!panelGroups.has(PanelComponent)) {
      panelGroups.set(PanelComponent, []);
    }
    panelGroups.get(PanelComponent)?.push(propKey);
  });

  const updateAction = (updatedAction: MultiActionCtaAction) => {
    const updatedData = actionsData.map((a) =>
      a.id === updatedAction.id ? updatedAction : a,
    );
    setProperty(ComponentProperty.Actions, updatedData);
  };

  const handleTypeChange = (actionId: string, type: string) => {
    const updatedData = actionsData.map((a) =>
      a.id === actionId
        ? {
            ...a,
            actionType: type,
          }
        : a,
    );
    setProperty(ComponentProperty.Actions, updatedData);
  };

  const actionProperties = { ...action } as Record<string, unknown>;
  delete actionProperties.id;
  delete actionProperties.actionType;

  const panelAction: BaseComponent = {
    id: action.id,
    type: effectiveType,
    category: "",
    properties: actionProperties,
  };

  return (
    <>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Action Type</p>
        <select
          id={`selectedActionType-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={action.actionType ?? ""}
          onChange={(e) => handleTypeChange(action.id, e.target.value)}
        >
          <option value="">Select Action Type</option>
          {multiActionCtaActionTypes.map((fieldType) => (
            <option key={fieldType.value} value={fieldType.value}>
              {fieldType.label}
            </option>
          ))}
        </select>
      </div>
      <PropertiesContext.Provider value={localValue}>
        {Array.from(panelGroups.entries()).map(([PanelComponent, propKeys]) => (
          <div key={PanelComponent.name}>
            <PanelComponent
              propertyKeys={propKeys}
              propertyComponent={panelAction}
              component={propertyComponent}
              setProperty={(propKey: string, value: unknown) => {
                const newProps = { ...actionProperties, [propKey]: value };
                const updatedAction: MultiActionCtaAction = {
                  id: action.id,
                  actionType: action.actionType,
                  ...newProps,
                };
                updateAction(updatedAction);
              }}
              setProperties={(propsObj: Record<string, unknown>) => {
                const newProps = { ...actionProperties, ...propsObj };
                const updatedAction: MultiActionCtaAction = {
                  id: action.id,
                  actionType: action.actionType,
                  ...newProps,
                };
                updateAction(updatedAction);
              }}
            />
            <hr className={sharedPropertiesStyles.panelSeparator} />
          </div>
        ))}
      </PropertiesContext.Provider>
    </>
  );
};

export default MultiActionTypePanel;
