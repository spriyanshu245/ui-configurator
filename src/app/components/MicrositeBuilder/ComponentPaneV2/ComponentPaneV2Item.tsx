"use client";

import Tooltip from "@/app/components/Tooltip/Tooltip";
import { componentPaneIconMap } from "@/app/data/componentPaneIconMap";
import { useDraggableBuilderComponent } from "@/app/hooks/useDraggableBuilderComponent";
import { ComponentCatalogEntry } from "@/app/types/types";
import styles from "./ComponentPaneV2.module.scss";

interface ComponentPaneV2ItemProps {
  entry: ComponentCatalogEntry;
  viewMode: "list" | "grid";
  isFormFound?: boolean;
}

export default function ComponentPaneV2Item({
  entry,
  viewMode,
  isFormFound,
}: Readonly<ComponentPaneV2ItemProps>) {
  const IconComponent = componentPaneIconMap[entry.type];
  const title = entry.title ?? entry.displayName;
  const createDragPreview = (sourceEl: HTMLDivElement) => {
    const previewEl = document.createElement("div");
    previewEl.className = styles.dragPreview;

    const iconShell = sourceEl.querySelector("[data-drag-preview-icon]");
    if (iconShell instanceof HTMLElement) {
      const { top, left, width, height } = iconShell.getBoundingClientRect();
      previewEl.style.top = `${top}px`;
      previewEl.style.left = `${left}px`;
      previewEl.style.width = `${width}px`;
      previewEl.style.height = `${height}px`;
      previewEl.appendChild(iconShell.cloneNode(true));
    }

    return previewEl;
  };

  const {
    disableExternalIntegration,
    draggable,
    handleDragEnd,
    handleDragStart,
    showTooltip,
    tooltipText,
  } = useDraggableBuilderComponent({
    component: entry,
    isFormFound,
    ghostClassName: styles.ghost,
    createDragPreview,
  });

  return (
    <Tooltip text={tooltipText} visibilityCondition={showTooltip}>
      <div
        role="presentation"
        data-testid={`component-pane-v2-item-${entry.type}`}
        className={`${styles.itemCard} ${
          viewMode === "list" ? styles.listItem : styles.gridItem
        } ${disableExternalIntegration ? styles.disable : ""}`}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.itemIcon} data-drag-preview-icon="true">
          {IconComponent ? <IconComponent /> : null}
        </div>
        <div className={styles.itemBody}>
          <div className={styles.itemTitle}>{title}</div>
          {viewMode === "list" ? (
            <div className={styles.itemDescription}>{entry.description ?? ""}</div>
          ) : null}
        </div>
      </div>
    </Tooltip>
  );
}
