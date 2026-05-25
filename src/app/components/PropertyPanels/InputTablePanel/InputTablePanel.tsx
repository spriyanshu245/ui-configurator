"use client";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import { InputTableColumn } from "../../../../app/types/types";
import React, { useState } from "react";
import ChevronDownIcon from "../../../../app/components/SVGIcons/ChevronDown";
import { usePropertyPane } from "../../../../app/context/PropertiesContext";
import { PropertyPanels } from "../../../../app/utils/constants";
import { generateRandomId } from "../../../../app/utils/utils";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import styles from "./InputTablePanel.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import sharedStyles from "../../../../app/styles/shared.module.scss";
import sharedPropertiesStyles from "../../../../app/styles/properties-pane.module.scss";
import dynamic from "next/dynamic";

const InputTableColumnRow = dynamic(() => import("./InputTableColumnRow"), {
  ssr: false,
});

interface InputTablePanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const InputTablePanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: InputTablePanelProps) => {
  const colData = propertyComponent.properties.inputColumns ?? [];
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const handleAddCol = () => {
    const newColumn: InputTableColumn = {
      id: generateRandomId(),
      type: "input-table-column",
      properties: {
        label: "Column-" + (colData.length + 1),
        columnDataType: "input",
        columnInputType: "text",
        name: "",
        showLabel: true,
      },
    };

    const updatedData = [...colData, newColumn];

    setProperty(ComponentProperty.InputColumns, updatedData);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.InputColumns:
        return (
          <div className={styles.columns}>
            <div className={styles.columnHeader}>Columns</div>
            <div className={sharedStyle.draggableRows}>
              {colData.map((col: InputTableColumn, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={col.id}
                  colData={colData}
                  column={col}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={setProperty}
                  property={ComponentProperty.InputColumns}
                >
                  <InputTableColumnRow
                    id={index}
                    setProperty={setProperty}
                    propertyComponent={propertyComponent}
                    column={col}
                  />
                </ExpandableColumn>
              ))}
              <AddExpandableColumn handleAddCol={handleAddCol} />
            </div>
          </div>
        );

      case ComponentProperty.MinimumTableRow:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Minimum Rows</p>
            <input
              id="minimumTableRow"
              data-testid="minimumTableRow"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent.properties?.minimumTableRow ?? ""}
              placeholder="Enter Minimum Row"
              onChange={(e) => {
                setProperty(ComponentProperty.MinimumTableRow, e.target.value);
              }}
            />
          </div>
        );

      case ComponentProperty.MaximumTableRow:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Maximum Rows</p>
            <input
              id="maximumTableRow"
              data-testid="maximumTableRow"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent.properties?.maximumTableRow ?? ""}
              placeholder="Enter Maximum Row"
              onChange={(e) => {
                setProperty(ComponentProperty.MaximumTableRow, e.target.value);
              }}
            />
          </div>
        );

      case ComponentProperty.FixedRows:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="fixedRows"
                type="checkbox"
                data-testid="fixedRows"
                checked={!!propertyComponent?.properties?.fixedRows}
                onChange={(e) =>
                  setProperty(ComponentProperty.FixedRows, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Fixed rows
              </span>
            </label>
          </div>
        );
      case ComponentProperty.ShowInputFooterRow:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showInputFooterRow"
                type="checkbox"
                data-testid="showInputFooterRow"
                checked={!!propertyComponent?.properties?.showInputFooterRow}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.ShowInputFooterRow,
                    e.target.checked
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show footer row
              </span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="inputTablePanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.InputTablePanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.InputTablePanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Input Table</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.InputTablePanel) && (
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

export default InputTablePanel;
