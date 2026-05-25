"use client";
import { useState, useCallback } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import { DropZoneProps } from "@/app/types/types";
import { useControlPanel } from "@/app/context/ControlPanelContext";

const FormElementDropZone: React.FC<DropZoneProps & { className?: string }> = ({
  index,
  handleDrop,
  isVertical = false,
  height = "auto",
  isDraggingFormElement,
}) => {
  const { showDropZones } = useControlPanel();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) {
        setIsDragOver(true);
      }
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDropWrapper = (e: React.DragEvent<HTMLDivElement>) => {
    handleDrop(e, index);
    setIsDragOver(false);
  };

  const formElementDropZoneClass = `${sharedStyles.dropZone} ${
    sharedStyles.transformLeft
  } ${isDraggingFormElement && isDragOver && sharedStyles.dragOver} ${
    isDraggingFormElement && sharedStyles.canDrop
  } ${!showDropZones && !isDraggingFormElement && sharedStyles.hideDropZones}
  ${isVertical ? sharedStyles.verticalDropZone : ""}`;

  return (
    <div
      role="presentation"
      className={formElementDropZoneClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropWrapper}
      style={{ height: height }}
      data-testid="form-dropzone"
    >
      <div className={sharedStyles.placeholder}>
        {isDraggingFormElement ? "Drop it here" : "Drop a form element here"}
      </div>
    </div>
  );
};

export default FormElementDropZone;
