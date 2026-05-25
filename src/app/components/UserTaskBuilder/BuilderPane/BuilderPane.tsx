"use client";
import styles from "./BuilderPane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useUserTask } from "@/app/context/UserTaskContext";
import React, { Fragment } from "react";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { useDragContext } from "@/app/context/DragContext";
import ComponentDropZone from "@/app/components/ComponentDropZone/ComponentDropZone";
import { componentIcons } from "@/app/data/componentIcons";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { addCategoryRecursive, generateRandomId, resetGhostImage } from "@/app/utils/utils";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import { shouldRenderDropZoneAtIndex } from "@/app/utils/userTask/dropZoneUtils";
import { UIComponent } from "@/app/types/types";

export default function BuilderPane() {
  const { userTask, addComponentAtIndex, moveComponentToIndex } = useUserTask();
  const { showDropZones } = useControlPanel();

  const {
    isDragging,
    setIsDragging,
    setIsDraggingComponent,
    isDraggingComponent,
    setIsDraggingFormElement,
    draggingComponentId,
    setDraggingComponentId,
  } = useDragContext();

  useAutoScroll(isDragging);

  const {
    dragOverIndex,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleDropHook,
  } = useComponentDragOver();
  const { setActiveComponent } = usePropertyPane();

  const isPopupPage = !!userTask?.properties?.showAsPopup;

  const components = userTask?.components || [];
  const emptyPane = components.length === 0;
  const isDragOver = dragOverIndex !== null;

  const draggedComponentIndex = components.findIndex(
    (component) => component.id === draggingComponentId,
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    const droppedItem = handleDropHook(e);

    if (
      (droppedItem?.type === "external-integration" ||
        droppedItem?.type === "EXTERNAL-INTEGRATION") &&
      !isPopupPage
    ) {
      console.warn(
        "External Integration component can only be added to popup pages.",
      );
      setIsDraggingComponent(false);
      setIsDraggingFormElement(false);
      setIsDragging(false);
      setDraggingComponentId(null);
      resetGhostImage();
      return;
    }

    if (droppedItem.isComponent || droppedItem.category === "") {
      const newComponent: UIComponent =
        droppedItem.category === ""
          ? addCategoryRecursive(droppedItem as UIComponent, "component")
          : {
              ...droppedItem,
            };

      if (droppedItem.id && !e.ctrlKey) {
        moveComponentToIndex(newComponent.id, "", index);
      } else {
        newComponent.id = generateRandomId();
        addComponentAtIndex(newComponent, "", index);
      }
      setActiveComponent(newComponent.id);
    } else if (droppedItem.isFormElement) {
      console.warn(
        "Dropping form elements into the builder pane is not allowed.",
      );
    }

    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  };

  const builderPaneContainerClassName = `${styles.builderPaneContainer} ${
    emptyPane ? styles.emptyPane : ""
  } ${isDragOver ? styles.dragOver : ""}`;

  const placeholderIcon = componentIcons.filter(
    (icon) => icon.type === "placeholder-icon-only",
  )[0]?.svgCode;

  return (
    <div
      id="builderPane"
      className={builderPaneContainerClassName}
      aria-label="Builder Pane"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        e.preventDefault();
      }}
    >
      {shouldRenderDropZoneAtIndex(0, draggedComponentIndex) && (
        <ComponentDropZone
          index={0}
          dragOverIndex={dragOverIndex}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          emptySection={emptyPane}
        />
      )}

      {emptyPane && !showDropZones && !isDraggingComponent && (
        <div className={sharedStyles.emptyPlaceholder}>
          <div
            dangerouslySetInnerHTML={{ __html: placeholderIcon || "" }}
            className={sharedStyles.svgIcon}
          ></div>
          <div className={sharedStyles.label}>
            Drop your first component here
          </div>
        </div>
      )}

      {components.map((component, index) => (
        <Fragment key={component.id}>
          <ComponentRenderer
            key={component.id}
            component={component}
            data-testid={`component-${component.id}`}
          />
          {shouldRenderDropZoneAtIndex(index + 1, draggedComponentIndex) && (
            <ComponentDropZone
              index={index + 1}
              dragOverIndex={dragOverIndex}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
