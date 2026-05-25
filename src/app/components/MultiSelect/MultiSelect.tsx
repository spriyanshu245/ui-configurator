import React, { useEffect, useRef, useState } from "react";
import styles from "./MultiSelect.module.scss";
import { NameKeyId } from "@/app/types/types";
import { getSelectedOptions } from "@/app/utils/utils";

export interface MultiSelectProps {
  options: NameKeyId[];
  value?: string[];
  onChange: (value: string[]) => void;
  onRemoveValue: (val: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  name?: string;
  id?: string;
  dataTestId?: string;
  allowCustomValues?: boolean;
  customValueValidator?: (value: string) => boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  onRemoveValue,
  placeholder = "Select...",
  label,
  disabled = false,
  required = false,
  error,
  name,
  id,
  dataTestId,
  allowCustomValues = true,
  customValueValidator = () => true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(value)
  );
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<NameKeyId[]>(
    options ?? []
  );
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue) {
      const filtered = options?.filter(
        (option) =>
          option?.label?.toLowerCase()?.includes(inputValue.toLowerCase()) &&
          !selectedValues.has(option.id)
      );
      setFilteredOptions(filtered);
    } else if (selectedValues.size > 0) {
      setFilteredOptions(
        options?.filter((option) => !selectedValues.has(option.id))
      );
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options, selectedValues]);

  const handleSelect = (optionValue: string) => {
    const newSelected = new Set(selectedValues);
    newSelected.add(optionValue);
    setSelectedValues(newSelected);
    onChange(Array.from(newSelected));
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const matchingOption = options?.find(
        (opt) => opt.label?.toLowerCase() === inputValue.toLowerCase()
      );

      if (matchingOption) {
        handleSelect(matchingOption.id);
      } else if (allowCustomValues && customValueValidator(inputValue)) {
        handleSelect(inputValue);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
    } else if (e.key === "ArrowDown" && isOpen) {
      const firstOption = document.querySelector(
        `.${styles.option}`
      ) as HTMLElement;
      if (firstOption) {
        firstOption.focus();
      }
    }
  };

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedValues);
    newSelected.delete(valueToRemove);
    setSelectedValues(newSelected);
    onChange(Array.from(newSelected));
    onRemoveValue(valueToRemove);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, option: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(option);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleContainerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);

      !isOpen &&
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
    }
  };

  return (
    <React.Fragment>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        ref={selectRef}
        className={`${styles.selectContainer} ${
          disabled ? styles.disabled : ""
        }`}
      >
        <div
          data-testid={dataTestId}
          className={`${styles.selectBox} ${isOpen ? styles.open : ""} ${
            error ? styles.error : ""
          }`}
          onClick={handleContainerClick}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleContainerClick();
            }
          }}
          tabIndex={-1}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={id ? `${id}_dropdown` : "multiselect_dropdown"}
        >
          <div className={styles.selectedItems}>
            {getSelectedOptions(Array.from(selectedValues), options)?.map(
              (selected) => (
                <span key={selected.id} className={styles.selectedItem}>
                  {selected.label}
                  {!disabled && (
                    <button
                      id={`${id}_removeButton`}
                      data-testid={`${id}_removeButton`}
                      type="button"
                      onClick={(e) => removeValue(selected.id, e)}
                      className={styles.removeButton}
                      aria-label={`Remove ${selected.id}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              )
            )}

            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              style={
                !isOpen && !inputValue && value?.length > 0
                  ? { display: "none" }
                  : {}
              }
              data-testid={`${id}_searchInput`}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={selectedValues.size === 0 ? placeholder : ""}
              disabled={disabled}
              aria-label="Type to search or add custom values"
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <ul
            className={styles.dropdown}
            id={id ? `${id}_dropdown` : "multiselect_dropdown"}
          >
            {filteredOptions?.length > 0 ? (
              filteredOptions?.map((option, index) => (
                <option
                  aria-selected={selectedValues.has(option.id)}
                  key={"key-" + option.label + index}
                  className={`${styles.option} ${
                    selectedValues.has(option.id) ? styles.selected : ""
                  }`}
                  onClick={() => handleSelect(option.id)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.id)}
                  tabIndex={0}
                >
                  {option.label}
                </option>
              ))
            ) : allowCustomValues && inputValue ? (
              <div className={styles.customValuePrompt}>
                Press Enter to add "{inputValue}"
              </div>
            ) : (
              <div className={styles.customValuePrompt}>
                No options available
              </div>
            )}
          </ul>
        )}
      </div>

      <input
        id={id}
        type="hidden"
        name={name}
        value={Array.from(selectedValues).join(",")}
      />

      {error && <div className={styles.errorMessage}>{error}</div>}
    </React.Fragment>
  );
};

export default MultiSelect;
