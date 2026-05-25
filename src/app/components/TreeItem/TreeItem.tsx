import React from "react";
import ArrowUp from "../SVGIcons/ArrowUp";
import Bin from "../SVGIcons/Bin";
import DragHandleIcon from "../SVGIcons/DragHandle";
import styles from "./TreeItem.module.scss";
import Edit from "../SVGIcons/Edit";

interface TreeItemProps {
  mode: string;
  item: Record<string, any>;
  level: number;
  expanded: Record<string, boolean>;
  toggleExpand: (name: string) => void;
  onAdd: (parentName: string) => void;
  onDelete: (name: string) => Promise<void>;
  onEdit: (item: Record<string, any>) => void;
  onDragStart: (
    e: React.DragEvent<HTMLButtonElement>,
    item: Record<string, any>
  ) => void;
  onDragOver: (
    e: React.DragEvent<HTMLButtonElement>,
    item: Record<string, any>
  ) => void;
  onDrop: (
    e: React.DragEvent<HTMLButtonElement>,
    dropTargetItem: Record<string, any>
  ) => void;
  onSelect: (menuName: any, checked: any) => void;
  selectedItems: Record<string, any>[];
  dropTarget: string | null;
  draggedItem: Record<string, any> | null;
  isDescendant: (
    parent: Record<string, any>,
    child: Record<string, any>
  ) => boolean;
  deleteConfirmFor: string | null;
  setDeleteConfirmFor: (name: string | null) => void;
}

const TreeItem = React.memo(
  ({
    mode,
    item,
    level,
    expanded,
    toggleExpand,
    onAdd,
    onDelete,
    onEdit,
    onDragStart,
    onDragOver,
    onDrop,
    onSelect,
    selectedItems,
    dropTarget,
    draggedItem,
    isDescendant,
    deleteConfirmFor,
    setDeleteConfirmFor,
  }: TreeItemProps) => {
    const confirmDelete = deleteConfirmFor === item.menuName;
    const isExpanded = expanded[item.menuName] ?? false;
    const hasChildren = item.subMenus?.length > 0;

    const isDropTarget = dropTarget === item.menuName;
    const canDropHere =
      !draggedItem ||
      (draggedItem.menuName !== item.menuName &&
        !isDescendant(draggedItem, item));

    return (
      <div
        style={{ marginLeft: level * 20 }}
        className={`${isDropTarget && canDropHere ? styles.dropTarget : ""} 
                    ${isDropTarget && !canDropHere ? styles.invalidDrop : ""}`}
      >
        <div className={styles.selectRow}>
          <div style={{ display: "flex", gap: 8 }}>
            {hasChildren && (
              <button
                className={`${styles.toggleBtn} ${
                  isExpanded ? styles.expanded : ""
                }`}
                onClick={() => toggleExpand(item.menuName)}
              >
                <ArrowUp className={styles.arrow} />
              </button>
            )}

            {mode === "select" && (
              <input
                type="checkbox"
                checked={selectedItems.some(
                  (n) => n.menuName === item.menuName
                )}
                onChange={(e) => onSelect(item.menuName, e.target.checked)}
              />
            )}

            <span className={styles.title}>{item.menuTitle}</span>

            {mode === "edit" && (
              <div className={styles.actionBtns}>
                <button onClick={() => onEdit(item)}>
                  <Edit />
                </button>
                <button onClick={() => onAdd(item.menuName)}>+</button>
                {!confirmDelete ? (
                  <button onClick={() => setDeleteConfirmFor(item.menuName)}>
                    <Bin />
                  </button>
                ) : (
                  <>
                    <button
                      className={styles.confirmYes}
                      onClick={() =>
                        onDelete(item.menuName).finally(() =>
                          setDeleteConfirmFor(null)
                        )
                      }
                    >
                      Yes
                    </button>

                    <button
                      className={styles.confirmCancel}
                      onClick={() => setDeleteConfirmFor(null)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {mode === "edit" && (
            <button
              className={styles.dragBtn}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDragOver={(e) => onDragOver(e, item)}
              onDrop={(e) => onDrop(e, item)}
            >
              <DragHandleIcon />
            </button>
          )}
        </div>

        {isExpanded &&
          item.subMenus?.map((child: any) => (
            <TreeItem
              mode={mode}
              key={child.menuName}
              item={child}
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onAdd={onAdd}
              onDelete={onDelete}
              onEdit={onEdit}
              onSelect={onSelect}
              selectedItems={selectedItems}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dropTarget={dropTarget}
              draggedItem={draggedItem}
              isDescendant={isDescendant}
              deleteConfirmFor={deleteConfirmFor}
              setDeleteConfirmFor={setDeleteConfirmFor}
            />
          ))}
      </div>
    );
  }
);

export default TreeItem;
