"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./ColorPicker.module.scss";

interface ColorPickerProps {
  id?: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker = ({
  id,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setInputValue(newColor);
      onChange(newColor);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  }, [inputValue, value]);

  return (
    <div ref={containerRef} className={styles.colorPicker}>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className={styles.textInput}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder="#000000"
          maxLength={7}
        />
        <button
          type="button"
          className={styles.colorSwatch}
          style={{
            backgroundColor: value,
            borderColor: value === "#ffffff" ? "#ccc" : value,
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="Choose color"
        />
      </div>
      {isOpen && !disabled && (
        <div className={styles.popover}>
          <input
            type="color"
            className={styles.nativeColorInput}
            value={value}
            onChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
