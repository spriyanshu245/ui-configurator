"use client";
import React, { useState, useMemo, useEffect } from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import { generateRandomId } from "@/app/utils/utils";
import styles from "./DataColumnPanel.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import {
  DataGridComponent,
  DataTableColumn,
  GridData,
  NameKeyId,
  TableComponent,
} from "@/app/types/types";
import DataColumnRow from "./DataColumnRow";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import dynamic from "next/dynamic";
import PropertyInput from "../../PropertyInputs/PropertyInput";

const ColumnRowV2 = dynamic(() => import("./ColumnRowV2"), {
  ssr: false,
});

interface Options {
  label: string;
  value: string;
}

interface DataColumnPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: TableComponent | DataGridComponent;
  setProperty: (prop: string, value: any) => void;
}
export const getColumnDataPropertyName = (type: string): string => {
  switch (type) {
    case "data-grid":
      return ComponentProperty.GridData;
    case "table":
      return ComponentProperty.TableColumns;
    default:
      return "";
  }
};

export const getColData = (type: string, properties: any): any[] => {
  switch (type) {
    case "data-grid":
      return properties.gridData || [];
    case "table":
      return properties.tableColumns || [];
    default:
      return [];
  }
};

const DataColumnPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: DataColumnPanelProps) => {
  const { properties, type } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const columnDataPropertyName = getColumnDataPropertyName(type);
  const colData = getColData(type, properties);
  const [tableElements, setTableElements] = useState<NameKeyId[]>([]);

  const getNamkeyList = () => {
    return (properties?.nameKeyIds as NameKeyId[])?.filter(
      (item) => item.id !== propertyComponent?.properties?.name,
    );
  };

  useEffect(() => {
    const list: NameKeyId[] = getNamkeyList() || [];
    setTableElements(list);
  }, [propertyComponent]);

  const panelTitle = useMemo(() => {
    switch (type) {
      case "data-grid":
        return "Data Grid";
      case "table":
        return "Data Table";
      default:
        return "Table Panel";
    }
  }, [type]);

  const handleAddCol = () => {
    let newColumn;

    switch (type) {
      case "data-grid":
        newColumn = {
          id: generateRandomId(),
          properties: {
            label: "Label-" + (colData.length + 1),
            value: "Value-" + (colData.length + 1),
            currencyName: "en-IN",
            prefixType: "text",
            suffixType: "text",
            decimalPrecision: 0,
            prefixIconUploadType: "url",
            suffixIconUploadType: "url",
            format: "en-GB",
          },
        };
        break;

      case "table":
        newColumn = {
          id: generateRandomId(),
          type: "table-column",
          properties: {
            label: "Column " + (colData.length + 1),
            showLabel: true,
            columnInputType: "text",
            name: "",
            currencyName: "en-IN",
            prefixType: "text",
            suffixType: "text",
            prefixIconUploadType: "url",
            suffixIconUploadType: "url",
            isInternal: false,
            columnAlign: "left",
            columnWidth: 0,
            format: "en-GB",
          },
        };
        break;
    }

    const updatedData = [...colData, newColumn];
    setProperty(columnDataPropertyName, updatedData);
  };

  const columnOptions = useMemo(() => {
    let options: Options[] = [];
    if (colData && colData.length > 0) {
      options = colData.map((column: DataTableColumn) => ({
        label: column.properties.label,
        value: column.properties.name,
      }));
    }
    return options;
  }, [colData]);

  const columnOptionsByIdOptions = useMemo(() => {
    if (!colData || colData.length === 0) return [];
    return colData.map((column: DataTableColumn) => ({
      label: column.properties.label,
      value: column.id,
    }));
  }, [colData]);

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.SortByField:
        if (!properties.defaultSort) return null;
        return (
          <PropertyInput
            type="select"
            id="sortByField"
            label="Sort by Field"
            value={properties?.sortByField ?? ""}
            options={[{ label: "Select a field", value: "" }, ...columnOptions]}
            handleChange={(e: any) => setProperty(propertyKey, e.target.value)}
          />
        );

      case ComponentProperty.CardTitleColumn:
      case ComponentProperty.CardSubtitleColumn:
      case ComponentProperty.CardStatusColumn: {
        if (!properties?.mobileCardViewEnabled) return null;
        const cardColumnLabels: Record<string, string> = {
          [ComponentProperty.CardTitleColumn]: "Card Title Column",
          [ComponentProperty.CardSubtitleColumn]: "Card Subtitle Column",
          [ComponentProperty.CardStatusColumn]: "Card Status Column",
        };
        return (
          <PropertyInput
            type="select"
            id={propertyKey}
            label={cardColumnLabels[propertyKey]}
            value={properties?.[propertyKey] ?? ""}
            options={[
              { label: "None", value: "" },
              ...columnOptionsByIdOptions,
            ]}
            handleChange={(e) => setProperty(propertyKey, e.target.value)}
          />
        );
      }

      case ComponentProperty.TableColumns:
      case ComponentProperty.GridData:
        if (properties.isFetchingFromApi === true) return null;
        return (
          <div className={styles.columns}>
            {(propertyComponent.type === "table" ||
              propertyComponent.type === "data-grid") && (
              <div className={styles.columnHeader}>Columns</div>
            )}
            <div className={sharedStyle.draggableRows}>
              {colData.map((col: GridData | DataTableColumn, index: number) => (
                <ExpandableColumn
                  id={index}
                  key={col.id}
                  colData={colData}
                  column={col}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={setProperty}
                  property={columnDataPropertyName}
                >
                  {type !== "table" ? (
                    <DataColumnRow
                      id={index}
                      setProperty={setProperty}
                      propertyComponent={propertyComponent}
                      column={col}
                    />
                  ) : (
                    <ColumnRowV2
                      id={index}
                      setProperty={setProperty}
                      propertyComponent={propertyComponent}
                      column={col as unknown as DataTableColumn}
                    />
                  )}
                </ExpandableColumn>
              ))}
              <AddExpandableColumn handleAddCol={handleAddCol} />
            </div>
          </div>
        );

      case ComponentProperty.HideHeaderRow:
        return (
          <PropertyInput
            type="checkbox"
            id="hideHeaderRow"
            value={properties?.hideHeaderRow ?? false}
            label="Hide header row"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.SelectableRow:
        if (propertyComponent?.category !== "form") return null;
        return (
          <PropertyInput
            type="checkbox"
            id="selectableRow"
            value={properties?.selectableRow ?? false}
            label="Selectable row"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.AutoSelectSingleRow:
        if (
          propertyComponent?.category !== "form" ||
          !propertyComponent?.properties.selectableRow
        )
          return null;
        return (
          <PropertyInput
            type="checkbox"
            id="autoSelectSingleRow"
            value={properties?.autoSelectSingleRow ?? false}
            label="Auto Select Single Row"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.SingleSelectRow:
        if (
          propertyComponent?.category !== "form" ||
          !propertyComponent?.properties.selectableRow
        )
          return null;
        return (
          <PropertyInput
            type="checkbox"
            id="singleSelectRow"
            value={properties?.singleSelectRow ?? false}
            label="Single Select Row"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.MetaData:
        if (
          propertyComponent?.category !== "form" ||
          !properties?.selectableRow
        )
          return null;
        return (
          <PropertyInput
            type="textarea"
            id="metaData"
            label="Meta Data"
            placeholder="Add comma separated meta data"
            value={properties.metaData ?? ""}
            handleChange={(e: any) => setProperty(propertyKey, e.target.value)}
          />
        );

      case ComponentProperty.PrimaryKey:
        if (
          propertyComponent?.category !== "form" ||
          !properties?.selectableRow
        )
          return null;
        return (
          <PropertyInput
            type="select"
            id="primaryKey"
            label="Select primary key"
            value={properties?.primaryKey ?? ""}
            options={[
              { label: "None", value: "" },
              ...tableElements.map(({ id, label }) => ({ label, value: id })),
            ]}
            handleChange={(e: any) => setProperty(propertyKey, e.target.value)}
          />
        );

      case ComponentProperty.HideBorders:
        return (
          <PropertyInput
            type="checkbox"
            id="hideBorders"
            value={properties?.hideBorders ?? false}
            label="Hide borders"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.PathToTableData:
        return (
          <PropertyInput
            type="text"
            id="pathToTableData"
            label="Path to table data"
            placeholder="Enter path to table data"
            value={properties?.pathToTableData ?? ""}
            handleChange={(e: any) => setProperty(propertyKey, e.target.value)}
          />
        );

      case ComponentProperty.ShowFooterRow:
        return (
          <PropertyInput
            type="checkbox"
            id="showFooterRow"
            value={properties?.showFooterRow ?? false}
            label="Show footer row"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.FooterKey:
        if (!properties?.showFooterRow) return null;
        return (
          <PropertyInput
            type="text"
            id="footerKey"
            label="Footer key"
            placeholder="Enter footer key"
            value={properties?.footerKey ?? ""}
            handleChange={(e: any) => setProperty(propertyKey, e.target.value)}
          />
        );

      case ComponentProperty.EnableSorting:
        return (
          <PropertyInput
            type="checkbox"
            id="enableSorting"
            value={properties?.enableSorting ?? false}
            label="Enable Sorting"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.EnablePagination:
        return (
          <PropertyInput
            id="enablePagination"
            type="checkbox"
            value={properties.enablePagination ?? false}
            label="Enable Pagination"
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.checked)
            }
          />
        );

      case ComponentProperty.DefaultPageSize:
        if (!properties.enablePagination) return null;
        return (
          <PropertyInput
            id="defaultPageSize"
            type="number"
            value={properties.defaultPageSize}
            label="Default page size"
            placeholder="e.g., 20"
            handleChange={(e: any) =>
              setProperty(
                propertyKey,
                e.target.value !== "" ? Number(e.target.value) : "",
              )
            }
          />
        );

      case ComponentProperty.PageSizeOptions:
        if (!properties.enablePagination) return null;
        return (
          <PropertyInput
            type="text"
            id="pageSizeOptions"
            label="Page size options"
            placeholder="10, 20, 50, 100"
            value={properties.pageSizeOptions}
            handleChange={(e: any) =>
              setProperty(propertyKey, e.target.value)
            }
          />
        );

      default:
        return null;
    }
  };
  return (
    <div id="DataColumnPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.DataColumnPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.DataColumnPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>{panelTitle}</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.DataColumnPanel) && (
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

export default DataColumnPanel;
