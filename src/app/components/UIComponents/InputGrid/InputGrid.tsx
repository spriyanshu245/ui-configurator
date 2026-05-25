import {
  InputGridComponent,
  InputGridHeader,
  InputGridRow,
  UIComponent,
} from "../../../types/types";
import styles from "./InputGrid.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import { addCategoryRecursive, generateRandomId, resetGhostImage } from "../../../../app/utils/utils";
import { shouldRenderInputGridDropZoneAtIndex } from "../../../../app/utils/userTask/dropZoneUtils";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import { useUserTask } from "../../../../app/context/UserTaskContext";
import { useDragContext } from "../../../../app/context/DragContext";
import { useComponentDragOver } from "../../../../app/hooks/useComponentDragOver";
import { usePropertyPane } from "../../../../app/context/PropertiesContext";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import { Fragment } from "react";
import ComponentDropZone from "../../ComponentDropZone/ComponentDropZone";

interface Props {
  component: InputGridComponent;
}

const InputGrid = ({ component }: Props) => {
  const { label, width, columnHeaders } = component.properties ?? {};

  const gridRows: InputGridRow[] = component.components ?? [];

  const { addComponentToComponent, moveComponent } = useUserTask();
  const {
    draggingComponentId,
    setIsDragging,
    setIsDraggingComponent,
    setDraggingComponentId,
    setIsDraggingFormElement,
    isDraggingFormElement,
  } = useDragContext();
  const { dragOverIndex, handleDragOver, handleDragLeave } =
    useComponentDragOver();
  const { setActiveComponent } = usePropertyPane();

  let draggedComponentIndex = -1;
  component.components.forEach((component, rowIndex) => {
    component?.components?.findIndex((comp, colIndex) => {
      if (comp.id === draggingComponentId)
        draggedComponentIndex = (rowIndex + 1) * 10 + colIndex;
    });
  });

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData("application/json");
    let droppedItem = JSON.parse(data);
    const gridRow = component.components?.[rowIndex];
    if (droppedItem.category === "") {
      droppedItem = addCategoryRecursive(droppedItem as UIComponent, component.category);
    }
    if (droppedItem.id) {
      if (draggedComponentIndex >= 0 && draggedComponentIndex < colIndex) {
        colIndex = colIndex - 1;
      }
      moveComponent(droppedItem.id, gridRow.id, colIndex);
    } else {
      droppedItem.id = generateRandomId();

      if (rowIndex >= 0 && rowIndex < component.components?.length) {
        if (
          gridRow.components &&
          colIndex >= 0 &&
          colIndex < gridRow.components.length
        ) {
          addComponentToComponent(gridRow.id, droppedItem, colIndex);
        }
      }
    }
    setActiveComponent(droppedItem.id);

    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  };

  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup}`}
      key={component.id}
    >
      {label && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {label}
        </label>
      )}
      <div
        className={styles.inputGridContainer}
        style={{
          width: `${width ?? 100}%`,
        }}
      >
        <table className={styles.inputGrid}>
          <thead>
            <tr>
              {columnHeaders.map((ele: InputGridHeader) => (
                <th key={ele.id} style={{ minWidth: "100px" }}>
                  {ele?.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridRows?.map((row, rowIndex) => {
              return (
                <tr key={row.id}>
                  {row.components?.map((col, colIndex) => {
                    return (
                      <td
                        key={`${row.id}-${col.id}`}
                        style={{ minWidth: "100px" }}
                      >
                        {col?.properties && (
                          <div key={col.id} draggable className={styles.item}>
                            <ComponentRenderer component={col} />
                          </div>
                        )}
                        {!col?.properties &&
                          shouldRenderInputGridDropZoneAtIndex(
                            (rowIndex + 1) * 10 + colIndex,
                            draggedComponentIndex
                          ) && (
                            <Fragment>
                              {component.category === "component" ? (
                                <ComponentDropZone
                                  index={(rowIndex + 1) * 10 + colIndex}
                                  dragOverIndex={dragOverIndex}
                                  handleDragOver={handleDragOver}
                                  handleDragLeave={handleDragLeave}
                                  handleDrop={(e) =>
                                    handleDrop(e, rowIndex, colIndex)
                                  }
                                  isDraggingFormElement={isDraggingFormElement}
                                />
                              ) : (
                                <FormElementDropZone
                                  index={(rowIndex + 1) * 10 + colIndex}
                                  dragOverIndex={dragOverIndex}
                                  handleDragOver={handleDragOver}
                                  handleDragLeave={handleDragLeave}
                                  handleDrop={(e) =>
                                    handleDrop(e, rowIndex, colIndex)
                                  }
                                  isDraggingFormElement={isDraggingFormElement}
                                />
                              )}
                            </Fragment>
                          )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InputGrid;
