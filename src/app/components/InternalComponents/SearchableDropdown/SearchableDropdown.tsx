import { useState, useEffect, useRef } from "react";
import styles from "./SearchableDropdown.module.scss";
import InternalIcons from "@/app/utils/InternalIcons";
import selectStyles from "../../../components/InternalComponents/SearchInput/SearchInput.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface SearchOption {
  id: string;
  label: string;
  keys: Record<string, string>;
  tagName?: string;
}

interface SearchableDropdownProps {
  options: SearchOption[];
  onItemSelect: (option: SearchOption) => void;
  placeholder?: string;
  debounceTime?: number;
  displayKeys?: string[];
}

const SearchableDropdown = ({
  options,
  onItemSelect,
  placeholder = "Search...",
  debounceTime = 300,
  displayKeys,
}: SearchableDropdownProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const keysToDisplay = displayKeys ?? [];

  useEffect(() => {
    if (query === "") {
      setFilteredOptions((prev) => (prev.length === 0 ? prev : []));
      setIsDebouncing(false);
      setSelectedIndex(-1);
      return;
    }

    setIsDebouncing(true);
    const debounceTimeout = setTimeout(() => {
      const searchResults = searchOptions(query);
      setFilteredOptions(searchResults);
      setIsDebouncing(false);
      setSelectedIndex(-1);
    }, debounceTime);

    return () => clearTimeout(debounceTimeout);
  }, [query, options, debounceTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const selectedRect = selectedItemRef.current.getBoundingClientRect();

      if (selectedRect.bottom > dropdownRect.bottom) {
        selectedItemRef.current.scrollIntoView({ block: "end" });
      } else if (selectedRect.top < dropdownRect.top) {
        selectedItemRef.current.scrollIntoView({ block: "start" });
      }
    }
  }, [selectedIndex]);

  const searchOptions = (searchQuery: string): SearchOption[] => {
    const normalizedQuery = searchQuery.toLowerCase();

    return options?.filter((option) => {
      if (option.label.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      return Object.values(option.keys).some(
        (value) =>
          value && String(value).toLowerCase().includes(normalizedQuery),
      );
    });
  };

  const handleItemClick = (option: SearchOption) => {
    onItemSelect(option);
    setIsSearchOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : prevIndex,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleItemClick(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsSearchOpen(false);
        setQuery("");
        break;
      default:
        break;
    }
  };

  const renderOptionKeys = (option: SearchOption) => {
    return (
      keysToDisplay.length > 0 && (
        <div className={styles.itemAdditionalFields}>
          {keysToDisplay.map((key) => {
            if (option.keys[key]) {
              return (
                <div key={key} className={styles.itemField}>
                  <span className={styles.fieldValue}>{option.keys[key]}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )
    );
  };

  return (
    <div className={selectStyles.searchContainer}>
      {!isSearchOpen && (
        <button
          className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open search"
        >
          {InternalIcons("search")}
        </button>
      )}

      {isSearchOpen && (
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            id="searchInput"
            type="text"
            placeholder={placeholder}
            value={query}
            autoFocus={true}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={selectStyles.searchInput}
            aria-expanded={isSearchOpen && query.length > 0}
            aria-controls="search-dropdown"
            aria-autocomplete="list"
            role="combobox"
          />
          <button
            className={selectStyles.closeButton}
            onClick={() => {
              setIsSearchOpen(false);
              setQuery("");
            }}
            aria-label="Close search"
          >
            {InternalIcons("close")}
          </button>
        </div>
      )}
      {isSearchOpen && query.length > 0 && (
        <div
          className={styles.dropdown}
          ref={dropdownRef}
          id="search-dropdown"
          role="listbox"
        >
          {isDebouncing && (
            <div className={styles.loadingItem}>Loading results...</div>
          )}
          {!isDebouncing &&
            filteredOptions.length > 0 &&
            filteredOptions.map((option, index) => (
              <div
                key={option.id + option.label}
                className={`${styles.dropdownItem} ${
                  selectedIndex === index ? styles.selectedItem : ""
                }`}
                onClick={() => handleItemClick(option)}
                role="option"
                aria-selected={selectedIndex === index}
                tabIndex={0}
                ref={selectedIndex === index ? selectedItemRef : null}
              >
                <div className={styles.itemMain}>
                  <span className={styles.itemLabel}>{option.label}</span>
                  {option.tagName && (
                    <span className={styles.itemType}>{option.tagName}</span>
                  )}
                </div>
                {renderOptionKeys(option)}
              </div>
            ))}
          {!isDebouncing && filteredOptions.length === 0 && (
            <div className={styles.notFoundItem}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
