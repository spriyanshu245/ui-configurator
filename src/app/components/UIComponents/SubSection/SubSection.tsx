import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { SubSectionComponent, UIComponent } from "@/app/types/types";
import styles from "./SubSection.module.scss";

import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useDragContext } from "@/app/context/DragContext";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import { Fragment } from "react";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import {
  addCategoryRecursive,
  generateRandomId,
  resetGhostImage,
} from "@/app/utils/utils";
import ComponentDropZone from "../../ComponentDropZone/ComponentDropZone";
import { shouldRenderDropZoneAtIndex } from "@/app/utils/userTask/dropZoneUtils";

interface SubSectionProps {
  component: SubSectionComponent;
}

const SubSection = ({ component }: SubSectionProps) => {
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

  if (!component) {
    return null;
  }
  const {
    styleType,
    borderRadius,
    borderColor,
    backgroundColor,
    backgroundImage,
    dividerColor,
    dividerHeight,
    dividerStyle,
    borderThickness,
    borderStyle,
    textSize,
    width,
    independentPadding,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
  } = component?.properties ?? {};

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    let droppedItem = JSON.parse(data);

    let newComponent: UIComponent;
    if (droppedItem.category === "") {
      droppedItem = addCategoryRecursive(
        droppedItem as UIComponent,
        component.category,
      );
    }
    if (droppedItem.category != component.category) {
      return;
    }
    if (droppedItem.id) {
      const isSameForm = component.components?.some(
        (comp) => comp.id === droppedItem.id,
      );

      const draggedComponentOriginalIndex = component.components?.findIndex(
        (comp) => comp.id === droppedItem.id,
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
        isNewComponent: true,
      };
      addComponentToComponent(component.id, newComponent, index);
    }
    setActiveComponent(newComponent.id);
    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  };

  component.components ??= [];

  const draggedComponentIndex = component.components?.findIndex(
    (comp) => comp.id === draggingComponentId,
  );

  const DropZoneComponent =
    component.category === "form" ? FormElementDropZone : ComponentDropZone;

  const labelStyles = {
    fontSize: `${textSize}px`,
  };

  const subSectionStyles = {
    backgroundImage: (() => {
      if (backgroundImage) {
        return `linear-gradient(rgba(255,255,255,.85), rgba(255,255,255,.85)), url(${backgroundImage})`;
      } else {
        return `none`;
      }
    })(),
    backgroundPosition: `center center`,
    backgroundSize: `cover`,
    backgroundRepeat: `no-repeat`,
    backgroundColor: backgroundColor ?? "",
    border: `${borderThickness ?? 0}px ${borderStyle ?? "none"} ${
      borderColor ?? ""
    }`,
    borderRadius: `${borderRadius ?? 0}px`,
    width: `${width ?? 100}%`,
    padding: independentPadding
      ? `${paddingTop ?? 0}px ${paddingRight ?? 0}px ${paddingBottom ?? 0}px ${paddingLeft ?? 0}px`
      : `${padding ?? 0}px`,
  };
  return (
    <>
      <div className={styles.SubSectionContainer}>
        {styleType === "divider" && (
          <hr
            style={{
              border: `${dividerHeight}px ${dividerStyle} ${dividerColor}`,
            }}
          />
        )}
        <div
          className={styles.SubSectionComponent}
          style={subSectionStyles}
          data-testid="subsection-container"
        >
          {component.properties.label && component?.properties?.showLabel && (
            <label
              htmlFor={component.id}
              className={styles.subSectionLabel}
              style={labelStyles}
            >
              {component.properties.label}
            </label>
          )}
          {shouldRenderDropZoneAtIndex(0, draggedComponentIndex) && (
            <DropZoneComponent
              index={0}
              dragOverIndex={dragOverIndex}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={(e) => handleDrop(e, 0)}
              {...(component.category === "form" && { isDraggingFormElement })}
            />
          )}

          {component.components?.map((childComponent, index) => {
            return (
              <Fragment key={childComponent.id}>
                <ComponentRenderer
                  key={childComponent.id}
                  component={childComponent}
                />
                {childComponent.properties?.actionType !== "submit" &&
                  shouldRenderDropZoneAtIndex(
                    index + 1,
                    draggedComponentIndex,
                  ) && (
                    <DropZoneComponent
                      index={index + 1}
                      dragOverIndex={dragOverIndex}
                      handleDragOver={handleDragOver}
                      handleDragLeave={handleDragLeave}
                      handleDrop={(e) => handleDrop(e, index + 1)}
                      {...(component.category === "form" && {
                        isDraggingFormElement,
                      })}
                    />
                  )}
              </Fragment>
            );
          })}
        </div>
        {styleType === "divider" && (
          <hr
            style={{
              border: `${dividerHeight}px ${dividerStyle} ${dividerColor}`,
            }}
          />
        )}
      </div>
    </>
  );
};

export default SubSection;
