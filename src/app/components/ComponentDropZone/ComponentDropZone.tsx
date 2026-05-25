"use client";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useDragContext } from "@/app/context/DragContext";
import { DropZoneProps } from "@/app/types/types";
import { useControlPanel } from "@/app/context/ControlPanelContext";

const ComponentDropZone: React.FC<DropZoneProps> = ({
  index,
  emptySection,
  dragOverIndex,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}) => {
  const { isDraggingComponent } = useDragContext();
  const { showDropZones } = useControlPanel();

  const componentDropZoneClass = `${sharedStyles.dropZone} ${
    sharedStyles.transformLeft
  } ${
    dragOverIndex === index && isDraggingComponent ? sharedStyles.dragOver : ""
  } ${isDraggingComponent ? sharedStyles.canDrop : ""}
    ${
      !showDropZones && !isDraggingComponent ? sharedStyles.hideDropZones : ""
    } ${emptySection && sharedStyles.emptySection}`;

  return (
    <section
      aria-label="Component drop zone"
      className={componentDropZoneClass}
      onDragOver={(e) =>
        handleDragOver(e as React.DragEvent<HTMLDivElement>, index)
      }
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e as React.DragEvent<HTMLDivElement>, index)}
    >
      <div className={sharedStyles.placeholder}>
        {isDraggingComponent ? "Drop it here" : "Drop a page component here"}
      </div>
    </section>
  );
};

export default ComponentDropZone;
