import { useState } from "react";
import { FormRowComponent, UIComponent } from "@/app/types/types";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useDragContext } from "@/app/context/DragContext";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import {
  addCategoryRecursive,
  generateRandomId,
  resetGhostImage,
} from "@/app/utils/utils";

interface UseFormRowProps {
  component: FormRowComponent;
  columns?: number;
  columnGap?: number;
  disallowedTypes?: string[];
  defaultColumns?: number;
  defaultColumnGap?: number;
}

export function useFormRow({
  component,
  columns: columnsOverride,
  columnGap: columnGapOverride,
  disallowedTypes = ["form-row"],
  defaultColumns = 2,
  defaultColumnGap = 10,
}: UseFormRowProps) {
  const columns =
    columnsOverride ?? component?.properties?.columns ?? defaultColumns;
  const columnGap =
    columnGapOverride ?? component?.properties?.columnGap ?? defaultColumnGap;

  const { moveComponent, addComponentToComponent } = useUserTask();
  const {
    draggingComponentId,
    setDraggingComponentId,
    setIsDragging,
    setIsDraggingComponent,
    setIsDraggingFormElement,
    isDraggingFormElement,
    isFormRowValidation,
  } = useDragContext();
  const { handleDragOver, handleDragLeave } = useComponentDragOver();
  const { setActiveComponent } = usePropertyPane();
  const { showDropZones } = useControlPanel();
  const [renderComponent, setRenderComponent] = useState(component);

  const draggedComponentIndex =
    component.components?.findIndex(
      (comp) => comp.id === draggingComponentId
    ) ?? -1;

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData("application/json");
    let droppedItem = JSON.parse(data);
    if (droppedItem.category === "") {
      droppedItem = addCategoryRecursive(
        droppedItem as UIComponent,
        component.category
      );
    }
    if (disallowedTypes.includes(droppedItem.type)) {
      setIsDraggingFormElement(false);
      console.warn(
        `Dropping ${droppedItem.type} into this component is not allowed.`
      );
      return;
    }

    let newComponent: UIComponent = { ...droppedItem };
    if (droppedItem.id) {
      if (draggedComponentIndex >= 0 && draggedComponentIndex < dropIndex) {
        dropIndex = dropIndex - 1;
      }
      moveComponent(droppedItem.id, component.id, dropIndex);
    } else {
      newComponent.id = generateRandomId();
      addComponentToComponent(component.id, newComponent, dropIndex);
    }
    setActiveComponent(newComponent.id);
    cleanupDrag();
  };

  const cleanupDrag = () => {
    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  };

  const childCount = component.components?.length ?? 0;
  const emptySlotCount = Math.max(0, columns - childCount);

  const handleDragOverComponentShuffle = (
    e: React.DragEvent,
    targetComponentId: string
  ) => {
    e.preventDefault();
    if (
      draggingComponentId === null ||
      draggingComponentId === targetComponentId
    )
      return;

    const updatedComponentData = { ...component };

    if (!updatedComponentData.components) {
      return;
    }

    const draggedComponentIndex = updatedComponentData.components?.findIndex(
      (item) => item.id === draggingComponentId
    );

    const targetComponentIndex = updatedComponentData?.components?.findIndex(
      (item) => item.id === targetComponentId
    );

    if (draggedComponentIndex !== undefined && draggedComponentIndex !== -1) {
      const draggedComponent =
        updatedComponentData.components[draggedComponentIndex];
      updatedComponentData.components?.splice(draggedComponentIndex, 1);

      if (targetComponentIndex !== undefined && targetComponentIndex !== -1) {
        updatedComponentData.components?.splice(
          targetComponentIndex,
          0,
          draggedComponent
        );
      }
    }
    setRenderComponent(updatedComponentData);
  };

  const shouldShowDropZones = !!draggingComponentId || showDropZones;

  let effectiveIsDraggingFormElement = isDraggingFormElement;
  if (component.type === "form-row") {
    effectiveIsDraggingFormElement = isFormRowValidation
      ? false
      : isDraggingFormElement;
  }

  return {
    columns,
    columnGap,
    childCount,
    emptySlotCount,
    shouldShowDropZones,
    effectiveIsDraggingFormElement,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleDragOverComponentShuffle,
    renderComponent,
  };
}
