import React, {
  Dispatch,
  DragEvent,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import DragHandleIcon from "../SVGIcons/DragHandle";
import styles from "./ExpandableColumn.module.scss";
import DeleteIcon from "../SVGIcons/Delete";
import { BaseComponent } from "../../../app/types/types";

interface Props {
  colData: any[];
  column: any;
  draggedItemId?: number | null;
  setDraggedItemId?: Dispatch<SetStateAction<number | null>>;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
  setProperties?: (
    propeties: { [key: string]: any },
    isProperty?: boolean
  ) => void;
  children: ReactNode;
  property: string;
  id: number;
  label?: string;
  isDraggable?: boolean;
  minColCount?: number;
  isTab?: boolean;
  isRow?: boolean;
  isPill?: boolean;
  propertyComponent?: BaseComponent;
}

const ExpandableColumn = ({
  colData,
  column,
  draggedItemId,
  setDraggedItemId,
  setProperty,
  setProperties,
  children,
  property,
  id,
  label,
  minColCount = 1,
  isDraggable = true,
  isTab = false,
  isRow = false,
  isPill = false,
  propertyComponent,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const canDelete = colData.length > minColCount;

  const handleDragStart = (idx: number) => {
    if (isDraggable) {
      setDraggedItemId?.(idx);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (isDraggable) {
      e.preventDefault();
    }
  };

  const handleDrop = (targetIndex: number) => {
    if (!isDraggable || draggedItemId === null || draggedItemId === targetIndex)
      return;
    const updatedData = [...colData];
    const [draggedItem] = updatedData.splice(draggedItemId ?? 0, 1);
    updatedData.splice(targetIndex, 0, draggedItem);
    isTab || isRow
      ? setProperty("components", updatedData, true)
      : setProperty(property, updatedData);
    setDraggedItemId?.(null);
  };

  const updatePropertiesWithComponents = (
    updatedData: any[],
    updatedComponents: BaseComponent[]
  ) => {
    propertyComponent?.components && setProperties
      ? setProperties(
          {
            properties: {
              ...(propertyComponent?.properties ?? {}),
              [property]: updatedData,
            },
            components: [...updatedComponents],
          },
          true
        )
      : setProperty(property, updatedData);
  };

  const deleteColumn = () => {
    if (canDelete) {
      const updatedData = colData.filter((_, idx) => idx !== id);

      const updatedComponents =
        propertyComponent?.components?.map((component) => {
          return {
            ...component,
            components: component.components?.filter(
              (_, innerIndex) => innerIndex !== id
            ),
          };
        }) ?? [];

      const propertyKey = isPill ? "subsectionHeaders" : "components";
      isTab || isRow || isPill
        ? setProperty(propertyKey, updatedData, !isPill)
        : updatePropertiesWithComponents(updatedData, updatedComponents);
    }
  };

  return (
    <div
      id={`column-${id + 1}`}
      data-testid={`column-${id + 1}`}
      role="button"
      tabIndex={0}
      className={`${styles.row} ${draggedItemId === id ? styles.dragging : ""}`}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(id)}
      onKeyDown={(e) => {
        if (!isOpen) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleDrop(id);
          }
        }
      }}
      onTouchEnd={() => handleDrop(id)}
    >
      {isDraggable && (
        <button
          className={styles.dragHandle}
          draggable
          aria-label="Drag to reorder column"
          onDragStart={() => handleDragStart(id)}
          onClick={() => handleDragStart(id)}
        >
          <DragHandleIcon />
        </button>
      )}
      <div className={styles.colDetails}>
        <div className={styles.topContent}>
          <div
            className={styles.label}
            data-testid="label"
            onClick={() => setIsOpen(!isOpen)}
          >
            {(label ?? column?.properties?.label) ||
              (column?.properties?.tableColumnActionTypes
                ? `${column.properties.tableColumnActionTypes} `
                : `Action ${id + 1}`) ||
              ""}
          </div>
          <div className={styles.actions}>
            <button
              data-testid="delete"
              id={`deleteColumn-${id + 1}`}
              className={`${styles.removeIcon} ${
                canDelete ? "" : styles.removeDisabled
              }`}
              onClick={canDelete ? deleteColumn : undefined}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
        {isOpen && <div className={styles.bottomContent}>{children}</div>}
      </div>
    </div>
  );
};

interface AddExpandableColumnProps {
  handleAddCol: VoidFunction;
  label?: string;
}
export const AddExpandableColumn = ({
  handleAddCol,
  label,
}: AddExpandableColumnProps) => {
  return (
    <button
      onClick={handleAddCol}
      className={styles.addCol}
      data-testid="addColumnButton"
    >
      + Add {label ?? "Column"}
    </button>
  );
};

export default ExpandableColumn;
