import { useState, useCallback } from "react";

export function useComponentDragOver() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number | null = null) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) {
        setIsDragOver(true);
        setDragOverIndex(index);
      }
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
    const data = e.dataTransfer.getData("application/json");
    return JSON.parse(data);
  }, []);

  return {
    isDragOver,
    dragOverIndex,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
