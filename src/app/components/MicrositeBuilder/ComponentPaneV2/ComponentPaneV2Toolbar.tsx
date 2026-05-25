"use client";

import { RefObject, useEffect, useState } from "react";
import SearchIcon from "@/app/components/SVGIcons/Search";
import GridViewIcon from "@/app/components/SVGIcons/GridView";
import ListViewIcon from "@/app/components/SVGIcons/ListView";
import ExpandAllIcon from "@/app/components/SVGIcons/ExpandAll";
import CollapseAllIcon from "@/app/components/SVGIcons/CollapseAll";
import styles from "./ComponentPaneV2.module.scss";

const DEFAULT_SHORTCUT_HINT = "Ctrl+E";

const getShortcutHint = (): string => {
  if (typeof navigator === "undefined") {
    return DEFAULT_SHORTCUT_HINT;
  }

  return /Macintosh|Mac OS X|iPhone|iPad|iPod/.test(navigator.userAgent)
    ? "⌘E"
    : DEFAULT_SHORTCUT_HINT;
};

interface ComponentPaneV2ToolbarProps {
  searchValue: string;
  viewMode: "list" | "grid";
  areAllCategoriesExpanded: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "list" | "grid") => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export default function ComponentPaneV2Toolbar({
  searchValue,
  viewMode,
  areAllCategoriesExpanded,
  searchInputRef,
  onSearchChange,
  onViewModeChange,
  onExpandAll,
  onCollapseAll,
}: Readonly<ComponentPaneV2ToolbarProps>) {
  const [shortcutHint, setShortcutHint] = useState(DEFAULT_SHORTCUT_HINT);

  useEffect(() => {
    setShortcutHint(getShortcutHint());
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isShortcutPressed =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "e";

      if (!isShortcutPressed || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
    };
  }, [searchInputRef]);

  return (
    <div className={styles.toolbar}>
      <label className={styles.searchField}>
        <SearchIcon />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search here (${shortcutHint})`}
          aria-label="Search components here"
        />
      </label>
      <div className={styles.toolbarActions}>
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            viewMode === "grid" ? styles.isActive : ""
          }`}
          onClick={() => onViewModeChange("grid")}
          aria-label="Switch to grid view"
          title="Grid view"
        >
          <GridViewIcon />
        </button>
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            viewMode === "list" ? styles.isActive : ""
          }`}
          onClick={() => onViewModeChange("list")}
          aria-label="Switch to list view"
          title="List view"
        >
          <ListViewIcon />
        </button>
        {areAllCategoriesExpanded ? (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={onCollapseAll}
            aria-label="Collapse all categories"
            title="Collapse all"
          >
            <CollapseAllIcon />
          </button>
        ) : (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={onExpandAll}
            aria-label="Expand all categories"
            title="Expand all"
          >
            <ExpandAllIcon />
          </button>
        )}
      </div>
    </div>
  );
}
