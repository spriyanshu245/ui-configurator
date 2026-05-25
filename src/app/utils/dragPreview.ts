import React from "react";

interface ApplyCustomDragPreviewParams<T extends HTMLElement = HTMLElement> {
  event: React.DragEvent<T>;
  sourceEl: T;
  createPreview?: (sourceEl: T) => HTMLElement;
  fallbackCloneClassName?: string;
}

const removeExistingGhost = () => {
  const existingGhost = document.getElementById("ghostEl");
  if (existingGhost?.parentNode) {
    existingGhost.parentNode.removeChild(existingGhost);
  }
};

const createFallbackPreview = <T extends HTMLElement>(
  sourceEl: T,
  fallbackCloneClassName?: string,
) => {
  const previewEl = sourceEl.cloneNode(true) as HTMLElement;

  if (fallbackCloneClassName) {
    previewEl.classList.add(fallbackCloneClassName);
  }

  return previewEl;
};

export const applyCustomDragPreview = <T extends HTMLElement>({
  event,
  sourceEl,
  createPreview,
  fallbackCloneClassName,
}: ApplyCustomDragPreviewParams<T>) => {
  removeExistingGhost();

  const previewEl = createPreview
    ? createPreview(sourceEl)
    : createFallbackPreview(sourceEl, fallbackCloneClassName);

  previewEl.id = "ghostEl";
  document.body.appendChild(previewEl);

  try {
    event.dataTransfer.setDragImage(
      previewEl,
      previewEl.offsetWidth / 2,
      previewEl.offsetHeight / 2,
    );
    return previewEl;
  } catch {
    if (previewEl.parentNode) {
      previewEl.parentNode.removeChild(previewEl);
    }

    return null;
  }
};
