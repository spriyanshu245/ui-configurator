import { useMemo, useState } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { componentPropertiesMap } from "@/app/data/componentPropertiesMap";
import { propertyPanelsMap } from "@/app/data/propertiesPanelMap";
import { ComponentProperty } from "@/app/data/componentProperties";
import { InputTableColumn, BaseComponent } from "@/app/types/types";
import { displayColumnTypes, inputColumnTypes } from "@/app/utils/constants";
import { PropertiesContext } from "@/app/context/PropertiesContext";

interface InputTableColumnRowProps {
  id: number;
  column: InputTableColumn;
  propertyComponent: BaseComponent;
  setProperty: (prop: string, value: any) => void;
}

export const InputTableColumnRow = ({
  id,
  column,
  propertyComponent,
  setProperty,
}: InputTableColumnRowProps) => {
  const { properties } = column;
  const colData = propertyComponent?.properties?.inputColumns || [];

  const relevantProps = componentPropertiesMap[column.type] || [];
  const panelGroups = new Map<React.ComponentType<any>, ComponentProperty[]>();
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});

  const dateOnlyProperties = new Set<ComponentProperty>([
    ComponentProperty.DateSeparator,
    ComponentProperty.Format,
  ]);
  const optionsProperty = new Set<ComponentProperty>([
    ComponentProperty.Options,
  ]);

  const localValue = useMemo(
    () => ({
      isPanelOpen: (panel: any) => {
        const name = typeof panel === "string" ? panel : String(panel);
        return !!openPanels[name];
      },
      togglePanel: (panel: any) => {
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
    [openPanels]
  );

  relevantProps.forEach((propKey) => {
    const PanelComponent = propertyPanelsMap[propKey];
    if (!PanelComponent) return;

    if (propKey === ComponentProperty.ColumnInputType) {
      return;
    }

    if (
      !["date"].includes(properties?.columnInputType ?? "") &&
      dateOnlyProperties.has(propKey)
    ) {
      return;
    }
    if (
      !["select", "checkbox-group"].includes(
        properties?.columnInputType ?? ""
      ) &&
      optionsProperty.has(propKey)
    ) {
      return;
    }

    if (!panelGroups.has(PanelComponent)) {
      panelGroups.set(PanelComponent, []);
    }
    panelGroups.get(PanelComponent)?.push(propKey);
  });

  const updateColumn = (updatedColumn: InputTableColumn) => {
    const updatedData = colData.map((c: InputTableColumn) =>
      c.id === updatedColumn.id ? updatedColumn : c
    );
    setProperty(ComponentProperty.InputColumns, updatedData);
  };

  const handleColumnPropertyChange = (
    id: string,
    propertyKey: string,
    value: string
  ) => {
    const updatedData = colData.map((col: InputTableColumn) =>
      col.id === id
        ? {
            ...col,
            properties: {
              ...col.properties,
              [propertyKey]: value,
            },
          }
        : col
    );
    setProperty(ComponentProperty.InputColumns, updatedData);
  };

  const handleDataTypeChange = (id: string, type: string) => {
    handleColumnPropertyChange(id, "columnDataType", type);
  };

  const handleTypeChange = (id: string, type: string) => {
    handleColumnPropertyChange(id, "columnInputType", type);
  };

  const mergedProps = { ...properties };
  if (properties?.columnInputType) {
    mergedProps.inputType = properties.columnInputType;
  }

  const panelColumn = {
    ...column,
    properties: mergedProps,
  };

  return (
    <>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Column Data Type</p>
        <select
          id={`columnDataType-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.columnDataType || ""}
          onChange={(e) => handleDataTypeChange(column.id, e.target.value)}
        >
          <option value="input">Input</option>
          <option value="display">Display</option>
        </select>
      </div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>
          Column{" "}
          {properties?.columnDataType === "display" ? "Display" : "Input"} Type
        </p>
        <select
          id={`columnInputType-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.columnInputType || ""}
          onChange={(e) => handleTypeChange(column.id, e.target.value)}
        >
          <option value="">
            Select{" "}
            {properties?.columnDataType === "display" ? "Display" : "Input"}{" "}
            Type
          </option>
          {properties?.columnDataType === "display"
            ? displayColumnTypes.map((fieldType) => (
                <option key={fieldType.value} value={fieldType.value}>
                  {fieldType.label}
                </option>
              ))
            : inputColumnTypes.map((fieldType) => (
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
              propertyComponent={panelColumn}
              component={propertyComponent}
              setProperty={(propKey: string, value: any) => {
                const newProps = { ...mergedProps, [propKey]: value };
                if (propKey === ComponentProperty.InputType) {
                  newProps.columnInputType = value;
                }
                const updatedCol = { ...column, properties: newProps };
                updateColumn(updatedCol);
              }}
              setProperties={(propsObj: { [key: string]: any }) => {
                const newProps = { ...mergedProps, ...propsObj };
                if (propsObj.hasOwnProperty(ComponentProperty.InputType)) {
                  newProps.columnInputType = propsObj.inputType;
                }
                const updatedCol = { ...column, properties: newProps };
                updateColumn(updatedCol);
              }}
            />
            <hr className={sharedPropertiesStyles.panelSeparator} />
          </div>
        ))}
      </PropertiesContext.Provider>
    </>
  );
};

export default InputTableColumnRow;
