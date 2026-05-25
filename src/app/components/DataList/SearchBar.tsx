"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  RefObject,
  useEffect,
  useState,
} from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import SearchIcon from "@/app/components/SVGIcons/Search";
import CloseIcon from "@/app/components/SVGIcons/Close";

interface SearchBarProps {
  placeholder: string;
  searchValue: string;
  isSearchOpen: boolean;
  isPending: boolean;
  hasSearchTerm: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const DEFAULT_SHORTCUT_HINT = "Ctrl+E";

const getShortcutHint = (): string => {
  if (typeof navigator === "undefined") {
    return DEFAULT_SHORTCUT_HINT;
  }

  return /Macintosh|Mac OS X|iPhone|iPad|iPod/.test(navigator.userAgent)
    ? "⌘E"
    : DEFAULT_SHORTCUT_HINT;
};

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target.closest("[contenteditable='true']")) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

const SearchBar = ({
  placeholder,
  searchValue,
  isSearchOpen,
  isPending,
  hasSearchTerm,
  searchInputRef,
  searchContainerRef,
  onToggle,
  onChange,
  onKeyDown,
  onClear,
}: SearchBarProps) => {
  const [shortcutHint, setShortcutHint] = useState(DEFAULT_SHORTCUT_HINT);

  useEffect(() => {
    setShortcutHint(getShortcutHint());
  }, []);

  useEffect(() => {
    if (!isSearchOpen || !hasSearchTerm) {
      return;
    }

    const input = searchInputRef.current;
    if (!input) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      return;
    }

    input.focus();
    const cursorPosition = input.value.length;
    input.setSelectionRange(cursorPosition, cursorPosition);
  }, [hasSearchTerm, isSearchOpen, searchInputRef, searchValue]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const isShortcutPressed =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "e";

      if (!isShortcutPressed || event.defaultPrevented) {
        return;
      }

      const targetNode = event.target instanceof Node ? event.target : null;
      const container = searchContainerRef.current;
      const isInsideSearch = container?.contains(targetNode) ?? false;

      if (isEditableElement(event.target) && !isInsideSearch) {
        return;
      }

      event.preventDefault();

      if (!isSearchOpen) {
        onToggle();
        return;
      }

      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
    };
  }, [isSearchOpen, onToggle, searchContainerRef, searchInputRef]);

  return (
    <div
      data-testid="search-container"
      ref={searchContainerRef}
      className={`${sharedStyles.searchContainer} ${
        isSearchOpen ? sharedStyles.isActive : ""
      } ${isPending ? sharedStyles.isPending : ""} ${
        hasSearchTerm ? sharedStyles.hasValue : ""
      }`}
    >
      <button
        type="button"
        data-testid="search-toggle"
        className={sharedStyles.searchToggle}
        aria-label={isSearchOpen ? "Close search" : "Open search"}
        title={isSearchOpen ? "Close search" : placeholder}
        aria-expanded={isSearchOpen}
        aria-keyshortcuts="Meta+E Control+E"
        onClick={onToggle}
      >
        <SearchIcon />
        {!isSearchOpen && (
          <div
            className={sharedStyles.searchShortcutHint}
            data-testid="search-shortcut-hint"
            aria-hidden="true"
          >
            {shortcutHint}
          </div>
        )}
      </button>
      <input
        ref={searchInputRef}
        className={sharedStyles.searchInput}
        type="text"
        value={searchValue}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        aria-label={placeholder}
      />
      {hasSearchTerm && (
        <button
          type="button"
          className={sharedStyles.clearButton}
          aria-label="Clear search"
          data-testid="clear-search"
          title="Clear search"
          onClick={onClear}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
