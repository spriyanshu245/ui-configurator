"use client";

import { useDragContext } from "@/app/context/DragContext";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { BuilderComponent } from "@/app/types/types";
import { MAX_FORMS_LIMIT } from "@/app/utils/constants";
import { resetGhostImage } from "@/app/utils/utils";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import { applyCustomDragPreview } from "@/app/utils/dragPreview";

interface UseDraggableBuilderComponentParams {
  component: BuilderComponent;
  isFormFound?: boolean;
  ghostClassName: string;
  createDragPreview?: (sourceEl: HTMLDivElement) => HTMLElement;
}

export function useDraggableBuilderComponent({
  component,
  isFormFound,
  ghostClassName,
  createDragPreview,
}: Readonly<UseDraggableBuilderComponentParams>) {
  const {
    isDragging,
    setIsDragging,
    setIsDraggingComponent,
    setIsDraggingFormElement,
    setIsFormRowValidation,
  } = useDragContext();
  const { isEditing } = useMicrosite();
  const { userTask } = useUserTask();
  const isPopupPage = userTask?.properties?.showAsPopup;
  const isExternalIntegration = component.type === "external-integration";
  const disableExternalIntegration = isExternalIntegration && !isPopupPage;
  const disableForm = component.type === "form" && !!isFormFound;
  const isDisabled = disableForm || disableExternalIntegration || !isEditing;

  useAutoScroll(isDragging);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (disableExternalIntegration) {
      resetGhostImage();
      e.preventDefault();
      return;
    }

    applyCustomDragPreview({
      event: e,
      sourceEl: e.currentTarget,
      createPreview: createDragPreview,
      fallbackCloneClassName: ghostClassName,
    });

    if (component.category === "component") {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          ...component,
          isComponent: true,
        })
      );
      e.dataTransfer.effectAllowed = "copy";
      setIsDraggingComponent(true);
    } else if (component.category === "form") {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          ...component,
          isComponent: false,
          isFormElement: true,
        })
      );
      e.dataTransfer.effectAllowed = "copy";
      setIsDraggingFormElement(true);
      setIsFormRowValidation(component.type === "form-row");
    } else if (component.category === "") {
      e.dataTransfer.setData("application/json", JSON.stringify(component));
      e.dataTransfer.effectAllowed = "copy";
      setIsDraggingComponent(true);
      setIsDraggingFormElement(true);
    }

    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsFormRowValidation(false);
    setIsDragging(false);
    resetGhostImage();
  };

  return {
    disableExternalIntegration,
    isDisabled,
    tooltipText: disableExternalIntegration
      ? "Available only on popup pages"
      : `A page can have a maximum of ${MAX_FORMS_LIMIT + 1} forms`,
    showTooltip: disableForm || disableExternalIntegration,
    draggable: !isDisabled,
    handleDragStart,
    handleDragEnd,
  };
}
