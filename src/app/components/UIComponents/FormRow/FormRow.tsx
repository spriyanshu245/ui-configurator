import { FormRowComponent } from "@/app/types/types";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import styles from "./FormRow.module.scss";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import { useFormRow } from "@/app/hooks/useFormRow";

interface FormRowProps {
  component: FormRowComponent;
}

export default function FormRow({ component }: Readonly<FormRowProps>) {
  const {
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
  } = useFormRow({
    component,
    disallowedTypes: ["form-row"],
    defaultColumns: 2,
  });

  return (
    <div
      id={component.id}
      className={styles.formRow}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        columnGap: `${columnGap}px`,
      }}
      data-testid={component.id}
    >
      {component.components?.map((child) => (
        <div
          key={child.id}
          draggable
          className={styles.item}
          onDragOver={(e) => handleDragOverComponentShuffle(e, child.id)}
        >
          <ComponentRenderer component={child} />
        </div>
      ))}

      {Array.from({ length: emptySlotCount }).map((_, idx) => {
        const slotIndex = childCount + idx;

        if (!shouldShowDropZones) {
          return <div key={`empty-${idx}`} />;
        }

        return (
          <FormElementDropZone
            key={`dropzone-${idx}`}
            index={slotIndex}
            dragOverIndex={slotIndex}
            handleDragOver={(event) => handleDragOver(event, slotIndex)}
            handleDragLeave={handleDragLeave}
            handleDrop={(event) => handleDrop(event, slotIndex)}
            height="fit-content"
            isDraggingFormElement={effectiveIsDraggingFormElement}
          />
        );
      })}
    </div>
  );
}
