"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import styles from "./SelectDropdown.module.scss";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { createPortal } from "react-dom";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  id: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  showSearch?: boolean;
  usePortal?: boolean;
  minWidth?: number | string;
}

const normalizeSearchValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const SelectDropdown = ({
  id,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  showSearch = true,
  usePortal = false,
  minWidth,
}: SelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const justOpenedRef = useRef(false);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    return options.filter(
      (opt) =>
        normalizeSearchValue(opt.label).includes(normalizedSearchTerm) ||
        normalizeSearchValue(opt.value).includes(normalizedSearchTerm),
    );
  }, [options, searchTerm]);

  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 10000,
    });
  }, []);

  const openDropdown = (highlightFirst = false) => {
    if (disabled || loading) return;
    justOpenedRef.current = true;
    setIsOpen(true);
    setSearchTerm("");
    setHighlightedIndex(highlightFirst && options.length > 0 ? 0 : -1);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    isOpen ? closeDropdown() : openDropdown();
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isSearchInputTarget = e.target instanceof HTMLInputElement;

    if (e.key === " " && !isSearchInputTarget) {
      e.preventDefault();
    }

    if (e.key === "Escape") {
      closeDropdown();
      return;
    }

    if (!isOpen && (e.key === "Enter" || e.key === " ")) {
      openDropdown(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        toggleRef.current?.contains(target) ||
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeDropdown();
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !usePortal) return;

    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isOpen, usePortal, updateMenuPosition]);

  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      });
    }
  }, [isOpen, showSearch]);

  useEffect(() => {
    optionRefs.current = [];
  }, [filteredOptions]);

  useEffect(() => {
    if (!isOpen) return;
    if (justOpenedRef.current) {
      justOpenedRef.current = false;
      return;
    }
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions, isOpen]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !usePortal) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      closeDropdown();
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen, usePortal]);

  const displayText = loading
    ? loadingText
    : (selectedOption?.label ?? placeholder);
  const isPlaceholder = !selectedOption && !loading;

  const dropdownMenu = (
    <div
      ref={menuRef}
      className={styles.dropdownMenu}
      id={`${id}-listbox`}
      role="listbox"
      tabIndex={-1}
      aria-activedescendant={
        highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
      }
      style={usePortal ? menuStyle : undefined}
      onMouseEnter={() => setHighlightedIndex(-1)}
    >
      {showSearch && (
        <div className={styles.dropdownSearch}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
          />
        </div>
      )}

      {filteredOptions.length > 0 ? (
        filteredOptions.map((option, index) => (
          <button
            key={option.value}
            id={`${id}-option-${index}`}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={`${styles.dropdownItem} ${
              option.value === value ? styles.selected : ""
            } ${index === highlightedIndex ? styles.highlighted : ""}`}
            onClick={() => handleSelect(option.value)}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            {option.label}
          </button>
        ))
      ) : (
        <div className={`${styles.dropdownItem} ${styles.noOptions}`}>
          No options found
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={styles.dropdown}
      style={minWidth ? { minWidth } : undefined}
    >
      <button
        type="button"
        id={id}
        ref={toggleRef}
        className={`${styles.dropdownToggle} ${isOpen ? styles.open : ""}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        title={!isPlaceholder && !loading ? displayText : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id}-listbox` : undefined}
      >
        <span
          className={`${styles.toggleText}${isPlaceholder ? ` ${styles.placeholder}` : ""}`}
        >
          {displayText}
        </span>
        <span className={styles.arrowDown}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen &&
        (usePortal ? createPortal(dropdownMenu, document.body) : dropdownMenu)}
    </div>
  );
};

export default SelectDropdown;
