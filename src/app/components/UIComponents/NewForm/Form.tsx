"use client";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { FormComponent, UIComponent } from "@/app/types/types";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import { useUserTask } from "@/app/context/UserTaskContext";
import styles from "./Form.module.scss";
import { useDragContext } from "@/app/context/DragContext";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import { Fragment } from "react";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { addCategoryRecursive, generateRandomId, resetGhostImage } from "@/app/utils/utils";
import { shouldRenderDropZoneAtIndex } from "@/app/utils/userTask/dropZoneUtils";

interface FormProps {
  component: FormComponent;
}

const Form = ({ component }: FormProps) => {
  const { addComponentToComponent, moveComponent } = useUserTask();
  const {
    draggingComponentId,
    setIsDragging,
    setIsDraggingComponent,
    setDraggingComponentId,
    setIsDraggingFormElement,
    isDraggingFormElement,
  } = useDragContext();
  const { handleDragOver, handleDragLeave } = useComponentDragOver();
  const { setActiveComponent } = usePropertyPane();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData("application/json");
    let droppedItem = JSON.parse(data);
    if (droppedItem.category === "") {
      droppedItem = addCategoryRecursive(droppedItem as UIComponent, "form");
    }
    if (droppedItem.category === "form") {
      let newComponent: UIComponent;

      if (droppedItem.id) {
        const isSameForm = component.components?.some(
          (comp) => comp.id === droppedItem.id
        );

        const draggedComponentOriginalIndex = component.components?.findIndex(
          (comp) => comp.id === droppedItem.id
        );

        newComponent = { ...droppedItem };

        if (
          isSameForm &&
          draggedComponentOriginalIndex !== undefined &&
          draggedComponentOriginalIndex < index
        ) {
          index = index - 1;
        }

        moveComponent(droppedItem.id, component.id, index);
      } else {
        newComponent = {
          ...droppedItem,
          id: generateRandomId(),
        };
        const targetIndex = index;
        addComponentToComponent(component.id, newComponent, targetIndex);
      }
      setActiveComponent(newComponent.id);
    } else {
      console.warn("Only form elements can be dropped into a form.");
    }

    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  };

  const draggedComponentIndex = component.components?.findIndex(
    (comp) => comp.id === draggingComponentId
  );

  return (
    <form
      id={component.id}
      action={component.properties?.action}
      method={component.properties?.method}
      className={styles.form}
      key={component.id}
      data-testid={component.id}
    >
      {shouldRenderDropZoneAtIndex(0, draggedComponentIndex) && (
        <FormElementDropZone
          index={0}
          dragOverIndex={0}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={(e) => handleDrop(e, 0)}
          isDraggingFormElement={isDraggingFormElement}
        />
      )}
      {component.components?.map((childComponent, index) => (
        <Fragment key={childComponent.id}>
          {childComponent?.category === "form" && (
            <Fragment key={childComponent.id}>
              <Fragment key={childComponent.id}>
                <ComponentRenderer
                  key={childComponent.id}
                  component={childComponent}
                />
                {shouldRenderDropZoneAtIndex(0, draggedComponentIndex) && (
                  <FormElementDropZone
                    index={index + 1}
                    dragOverIndex={index + 1}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={(e) => handleDrop(e, index + 1)}
                    isDraggingFormElement={isDraggingFormElement}
                  />
                )}
              </Fragment>
            </Fragment>
          )}
        </Fragment>
      ))}
    </form>
  );
};

export default Form;
