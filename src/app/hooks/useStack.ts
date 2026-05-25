import { useCallback, useMemo } from "react";
import { BaseComponent, StackComponent, UIComponent } from "@/app/types/types";
import { useDragContext } from "@/app/context/DragContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import {
  addCategoryRecursive,
  generateRandomId,
  resetGhostImage,
} from "@/app/utils/utils";
import { shouldRenderDropZoneAtIndex } from "@/app/utils/userTask/dropZoneUtils";

interface UseStackProps {
  component: StackComponent;
}

export function useStack({ component }: UseStackProps) {
  const { moveComponent, addComponentToComponent } = useUserTask();
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
  const { columns, columnGap, childCount, gridTemplateColumns } =
    useMemo(() => {
      const computedColumns =
        component?.properties?.columns ??
        (component.properties.hasFixedColumns ||
        component.properties.direction !== "column"
          ? 2
          : 1);
      const computedColumnGap = component?.properties?.columnGap ?? 10;
      const computedChildCount = component.components?.length ?? 0;

      return {
        columns: computedColumns,
        columnGap: computedColumnGap,
        childCount: computedChildCount,
        gridTemplateColumns: `repeat(${
          component.properties.hasFixedColumns
            ? computedColumns
            : computedChildCount + 1
        }, 1fr)`,
      };
    }, [
      component?.properties?.columns,
      component?.properties?.columnGap,
      component?.properties?.hasFixedColumns,
      component.components?.length,
    ]);

  const cleanupDragState = useCallback(() => {
    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsDragging(false);
    setDraggingComponentId(null);
    resetGhostImage();
  }, [
    setIsDraggingComponent,
    setIsDraggingFormElement,
    setIsDragging,
    setDraggingComponentId,
  ]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
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
      if (component.category !== droppedItem.category) {
        setIsDraggingFormElement(false);
        console.warn(
          `Only form components can be dropped into form category components.`
        );
        return;
      }

      let newComponent: UIComponent;

      if (droppedItem.id) {
        const components: BaseComponent[] = component.components ?? [];
        const isSameComponent = components.some(
          (comp) => comp.id === droppedItem.id
        );
        const draggedComponentOriginalIndex = components.findIndex(
          (comp) => comp.id === droppedItem.id
        );

        newComponent = { ...droppedItem };

        if (
          isSameComponent &&
          draggedComponentOriginalIndex !== -1 &&
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
      cleanupDragState();
    },
    [
      component.category,
      component.id,
      component.components,
      moveComponent,
      addComponentToComponent,
      setActiveComponent,
      setIsDraggingFormElement,
      cleanupDragState,
    ]
  );

  const components = component.components || [];
  const draggedComponentIndex = useMemo(
    () => components.findIndex((comp) => comp.id === draggingComponentId),
    [components, draggingComponentId]
  );

  const shouldRenderDropZone = useMemo(() => {
    const slotIndex = childCount;
    return shouldRenderDropZoneAtIndex(slotIndex, draggedComponentIndex);
  }, [childCount, draggedComponentIndex]);

  const getDropZoneProps = useCallback(() => {
    const slotIndex = childCount;

    const dropZoneProps = {
      index: slotIndex,
      dragOverIndex,
      handleDragOver: (event: React.DragEvent) =>
        handleDragOver(event, slotIndex),
      handleDragLeave,
      handleDrop: (event: React.DragEvent<HTMLDivElement>) =>
        handleDrop(event, slotIndex),
      ...(component.category === "form" && { isDraggingFormElement }),
    };

    return dropZoneProps;
  }, [
    childCount,
    dragOverIndex,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    component.category,
    isDraggingFormElement,
  ]);

  return {
    columns,
    columnGap,
    childCount,
    gridTemplateColumns,
    components,
    draggedComponentIndex,
    shouldRenderDropZone,
    getDropZoneProps,
    handleDrop,
  };
}
