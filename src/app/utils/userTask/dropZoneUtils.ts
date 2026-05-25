export const shouldRenderDropZoneAtIndex = (
  dropZoneIndex: number,
  draggedComponentIndex: number | undefined
): boolean => {
  if (isValidDraggedComponentIndexIndex(draggedComponentIndex)) {
    return true;
  }
  return (
    dropZoneIndex !== draggedComponentIndex &&
    dropZoneIndex !== (draggedComponentIndex as number) + 1
  );
};

export const shouldRenderInputGridDropZoneAtIndex = (
  dropZoneIndex: number,
  draggedComponentIndex: number | undefined
): boolean => {
  if (isValidDraggedComponentIndexIndex(draggedComponentIndex)) {
    return true;
  }
  return dropZoneIndex !== draggedComponentIndex;
};

export const isValidDraggedComponentIndexIndex = (
  draggedComponentIndex: number | undefined
): boolean =>
  draggedComponentIndex === -1 || draggedComponentIndex === undefined;
