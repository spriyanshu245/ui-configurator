"use client";
import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { WorkspaceItem, IRequestData } from "@/app/types/types";
import { updateRecord } from "@/app/utils/dataTableUtils";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import ThreeDotMenuIcon from "@/app/components/SVGIcons/ThreeDotMenu";
import EditIcon from "@/app/components/SVGIcons/EditIcon";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import Modal from "@/app/components/InternalComponents/Modal/Modal";
import styles from "./WorkspaceSelector.module.scss";

const dataConfig = DATA_TYPE_CONFIG["workspace"];

interface WorkspaceChipProps {
  workspace: WorkspaceItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdated: (payload: { code: string; name: string }) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const WorkspaceChip = ({
  workspace,
  isSelected,
  onSelect,
  onUpdated,
  onDelete,
}: WorkspaceChipProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<React.MouseEvent | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target) ?? false;
      const insideDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!insideTrigger && !insideDropdown) {
        closeMenu();
      }
    };
    const handleScroll = () => closeMenu();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpen, closeMenu]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen((prev) => !prev);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setPendingDeleteEvent(e);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteEvent) {
      onDelete(pendingDeleteEvent);
    }
    setConfirmOpen(false);
    setPendingDeleteEvent(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteEvent(null);
  };

  const handleEditMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setEditName(workspace.name);
    setIsEditing(true);
  };

  const resetEdit = () => {
    setIsEditing(false);
    setEditName("");
    setEditError(null);
    setEditSubmitting(false);
  };

  const handleEditSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || editSubmitting) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const requestData: IRequestData = {
        method: "PUT",
        endpoint: `/api/v1/config${dataConfig.routeBase}/${workspace.code}`,
        body: { code: workspace.code, name: trimmed },
      };
      await updateRecord(requestData);
      onUpdated({ code: workspace.code, name: trimmed });
      resetEdit();
    } catch (e) {
      setEditError(
        e instanceof Error ? e.message : "Failed to update workspace",
      );
      setEditSubmitting(false);
    }
  };

  const handleEditKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") void handleEditSave();
    if (e.key === "Escape") resetEdit();
  };

  const dropdown = menuOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className={styles.menuDropdown}
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <button className={styles.menuItem} onClick={handleEditMenuClick}>
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            className={`${styles.menuItem} ${styles.danger}`}
            onClick={handleDeleteClick}
          >
            <DeleteIcon />
            <span>Delete</span>
          </button>
        </div>,
        document.body,
      )
    : null;

  if (isEditing) {
    return (
      <div className={styles.inlineCreateChip} onKeyDown={handleEditKeyDown}>
        <div className={styles.inlineCreateFields}>
          <input
            ref={nameInputRef}
            className={styles.inlineInput}
            placeholder="Workspace name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={editSubmitting}
          />
          {editError && <span className={styles.inlineError}>{editError}</span>}
        </div>
        <div className={styles.inlineCreateActions}>
          <button
            className={`${styles.inlineAction} ${styles.inlineSave}`}
            onClick={() => void handleEditSave()}
            disabled={!editName.trim() || editSubmitting}
          >
            {editSubmitting ? "Saving…" : "Save"}
          </button>
          <button
            className={`${styles.inlineAction} ${styles.inlineCancel}`}
            onClick={resetEdit}
            disabled={editSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.chip} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Select workspace ${workspace.name}`}
    >
      <div className={styles.chipContent}>
        <span className={styles.chipName}>{workspace.name}</span>
        <span className={styles.chipCode}>{workspace.code}</span>
      </div>
      <button
        ref={triggerRef}
        className={styles.menuTrigger}
        onClick={handleMenuToggle}
        aria-label="Workspace actions"
      >
        <ThreeDotMenuIcon />
      </button>
      {dropdown}
      <Modal
        isOpen={confirmOpen}
        title={`Delete "${workspace.name}"?`}
        description="This action is permanent and cannot be undone. All data associated with this workspace will be lost."
        submitText="Delete"
        cancelText="Cancel"
        type="warning"
        onSubmit={handleConfirmDelete}
        onClose={handleCancelDelete}
        backDrop={handleCancelDelete}
      />
    </div>
  );
};

export default WorkspaceChip;
