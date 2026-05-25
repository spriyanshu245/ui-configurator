import { useMemo, useState } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { componentPropertiesMap } from "@/app/data/componentPropertiesMap";
import { propertyPanelsMap } from "@/app/data/propertiesPanelMap";
import { ComponentProperty } from "@/app/data/componentProperties";
import { BaseComponent, DataTableColumn, GridData } from "@/app/types/types";
import { columnDataTypes, columnInputFieldTypes } from "@/app/utils/constants";
import { PropertiesContext } from "@/app/context/PropertiesContext";

interface InputTableColumnRowProps {
  id: number;
  column: DataTableColumn;
  propertyComponent: BaseComponent;
  setProperty: (prop: string, value: any) => void;
}

const ColumnRowV2 = ({
  id,
  column,
  propertyComponent,
  setProperty,
}: InputTableColumnRowProps) => {
  const { properties } = column;
  const colData =
    propertyComponent?.properties?.inputColumns ||
    propertyComponent?.properties?.tableColumns ||
    propertyComponent?.properties?.gridData ||
    [];
  const columnDataFieldTypes =
    propertyComponent?.type === "input-table"
      ? columnInputFieldTypes
      : columnDataTypes;

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

  const updateColumn = (updatedColumn: any) => {
    const updatedData = colData.map((c: DataTableColumn | GridData) =>
      c.id === updatedColumn.id ? updatedColumn : c
    );
    setProperty(
      propertyComponent.type === "table"
        ? ComponentProperty.TableColumns
        : ComponentProperty.GridData,
      updatedData
    );
  };

  const handleTypeChange = (id: string, type: string) => {
    const updatedData = colData.map((col: DataTableColumn | GridData) =>
      col.id === id
        ? {
            ...col,
            properties: {
              ...col.properties,
              columnInputType: type,
              isClickable: type=="multiple-actions"? false:col.properties.isClickable
            },
          }
        : col
    );
    setProperty(
      propertyComponent.type === "table"
        ? ComponentProperty.TableColumns
        : ComponentProperty.GridData,
      updatedData
    );
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
          id={`columnInputType-${id + 1}`}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.columnInputType ?? ""}
          onChange={(e) => handleTypeChange(column.id, e.target.value)}
        >
          <option value="">Select Input Type</option>
          {columnDataFieldTypes.map((fieldType) => (
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

export default ColumnRowV2;
