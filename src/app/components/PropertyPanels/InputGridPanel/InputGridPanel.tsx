"use client";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import {
  BaseComponent,
  InputGridHeader,
  InputGridRow,
} from "../../../types/types";
import React, { useState } from "react";
import ChevronDownIcon from "../../../../app/components/SVGIcons/ChevronDown";
import { usePropertyPane } from "../../../../app/context/PropertiesContext";
import { PropertyPanels } from "../../../../app/utils/constants";
import { generateRandomId } from "../../../../app/utils/utils";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import styles from "./InputGridPanel.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import sharedStyles from "../../../../app/styles/shared.module.scss";
import sharedPropertiesStyles from "../../../../app/styles/properties-pane.module.scss";
import InputGridColumnRow from "./InputGridColumnRow";

interface InputGridPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
  setProperties: (
    propeties: { [key: string]: any },
    isProperty?: boolean
  ) => void;
}

const InputGridPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
  setProperties,
}: InputGridPanelProps) => {
  const colHeaders = propertyComponent.properties.columnHeaders ?? [];
  const components = propertyComponent.components ?? [];

  const { togglePanel, isPanelOpen } = usePropertyPane();
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const createEmptyGridRow = (): InputGridRow => {
    return {
      id: generateRandomId(),
      type: "input-grid-row",
      category: "form",
      properties: {
        name: "Input Grid Row-" + (components.length + 1),
        label: "Input Grid Row-" + (components.length + 1),
      },
      components: colHeaders.map(() => ({
        id: generateRandomId(),
        type: "input-grid-column",
        category: "form",
      })),
    };
  };
  const handleAddRow = () => {
    const newGridRow = createEmptyGridRow();

    const updatedComponents = [...components, newGridRow];

    setProperty("components", updatedComponents, true);
  };

  const handleRowChange = (id: string, value: string) => {
    const updatedComponents = components?.map((component: InputGridRow) =>
      component.id === id
        ? {
            ...component,
            properties: {
              ...component.properties,
              label: value,
            },
          }
        : component
    );
    setProperty("components", updatedComponents, true);
  };

  const handleAddCol = () => {
    const newColumn: InputGridHeader = {
      id: generateRandomId(),
      text: "Column-" + (colHeaders.length + 1),
      showHelperText: false,
      helperText: "Column-" + (colHeaders.length + 1),
    };

    const updatedData = [...colHeaders, newColumn];
    const updatedComponents = components.map((row: InputGridRow) => {
      return {
        ...row,
        components: [
          ...(row.components as BaseComponent[]),
          {
            id: generateRandomId(),
            type: "input-grid-column",
            category: "component",
          },
        ],
      };
    });
    setProperties(
      {
        properties: {
          ...(propertyComponent?.properties ?? {}),
          [ComponentProperty.ColumnHeaders]: updatedData,
        },
        components: [...updatedComponents],
      },
      true
    );
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.ColumnHeaders:
        return (
          <div className={styles.columns}>
            <div className={styles.columnHeader}>Grid Columns</div>
            <div className={sharedStyle.draggableRows}>
              {colHeaders.map((col: InputGridHeader, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={col.id}
                  colData={colHeaders}
                  column={col}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={setProperty}
                  setProperties={setProperties}
                  property={ComponentProperty.ColumnHeaders}
                  propertyComponent={propertyComponent}
                  label={col.text}
                >
                  <InputGridColumnRow
                    headers={colHeaders}
                    header={col}
                    headerType="column"
                    index={index}
                    setProperty={setProperty}
                  />
                </ExpandableColumn>
              ))}
              <AddExpandableColumn handleAddCol={handleAddCol} />
            </div>
          </div>
        );

      case ComponentProperty.RowHeaders:
        return (
          <div className={styles.columns}>
            <div className={styles.columnHeader}>Grid Rows</div>
            <div className={sharedStyle.draggableRows}>
              {components.map((component: InputGridRow, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={component.id}
                  colData={components}
                  column={component}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={setProperty}
                  property="components"
                  isRow={true}
                >
                  <div
                    className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                  >
                    <p className={sharedPropertiesStyles.propertyLabel}>
                      Grid Row
                    </p>
                    <input
                      id={`row-${index + 1}`}
                      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                      value={component?.properties?.label}
                      placeholder={`Enter row value here`}
                      onChange={(e) =>
                        handleRowChange(component.id, e.target.value)
                      }
                    />
                  </div>
                </ExpandableColumn>
              ))}
              <AddExpandableColumn handleAddCol={handleAddRow} label="Row" />
            </div>
          </div>
        );
      case ComponentProperty.IsLastRowFooter:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id={`isLastRowFooter`}
                data-testid="isLastRowFooter"
                type="checkbox"
                checked={!!propertyComponent?.properties?.isLastRowFooter}
                className={sharedPropertiesStyles.conditionalCheckBox}
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.IsLastRowFooter,
                    e.target.checked
                  );
                }}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Enable footer in last row
              </span>
            </label>
          </div>
        );
      case ComponentProperty.HideInputGridHeader:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id={`hideInputGridHeader`}
                data-testid="hideInputGridHeader"
                type="checkbox"
                checked={!!propertyComponent?.properties?.hideInputGridHeader}
                className={sharedPropertiesStyles.conditionalCheckBox}
                onChange={(e) => {
                  setProperty(
                    ComponentProperty.HideInputGridHeader,
                    e.target.checked
                  );
                }}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Hide Header
              </span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="inputGridPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.InputGridPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.InputGridPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Input Grid</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.InputGridPanel) && (
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

export default InputGridPanel;
