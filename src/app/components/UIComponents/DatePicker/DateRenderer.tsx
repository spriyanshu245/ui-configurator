"use client";

import { useState } from "react";

import styles from "@/app/styles/properties-pane.module.scss";
import {
  compareMinMaxDates,
  formatDateInput,
  formatDateInputWithPlaceHolder,
  validateDateInput,
} from "@/app/utils/date";
import { ComponentProperty } from "@/app/data/componentProperties";
import {
  DATE_ERROR_MESSAGE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_SEPARATOR,
} from "@/app/utils/constants";

interface DateRendererProps {
  properties: any;
  setProperty: (prop: string, value: any) => void;
  field: string;
}

const DateRenderer = ({
  properties,
  setProperty,
  field,
}: DateRendererProps) => {
  const [error, setError] = useState("");
  const fieldName =
    ComponentProperty.MinDate === field
      ? ComponentProperty.MinDate
      : ComponentProperty.MaxDate;

  const value = properties[fieldName];

  const getDynamicPlaceholder = () => {
    const inputData = formatDateInputWithPlaceHolder(
      value,
      DEFAULT_DATE_FORMAT
    );
    return (
      <>
        <span className={styles.hideCharacter}>
          {inputData.substring(0, value?.length)}
        </span>
        <span>{inputData.substring(value?.length)}</span>
      </>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formattedValue = formatDateInput({
      input,
      format: DEFAULT_DATE_FORMAT,
      separator: DEFAULT_DATE_SEPARATOR,
    });
    setProperty(fieldName, formattedValue);
    let validationError = validateDateInput({
      input,
      error,
      format: DEFAULT_DATE_FORMAT,
      separator: DEFAULT_DATE_SEPARATOR,
    });
    if (!validationError && input.length === 10) {
      validationError = compareMinMaxDates({ field, input, properties });
    }
    setError(validationError);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const input = e.target as HTMLInputElement;
      const value = input.value;
      if (value.endsWith(DEFAULT_DATE_SEPARATOR)) {
        setProperty(fieldName, value.slice(0, -1));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    if (value?.length > 0 && value?.length < 10) {
      setError(DATE_ERROR_MESSAGE);
    }
  };

  return (
    <>
      <div className={styles.dateInputContainer}>
        <input
          type="text"
          className={styles.textInput}
          value={value}
          spellCheck={false}
          maxLength={10}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          inputMode="numeric"
        />
        <span className={styles.placeHolderText}>
          {getDynamicPlaceholder()}
        </span>
      </div>

      {error && <p className={styles.errorMessages}>{error}</p>}
    </>
  );
};

export default DateRenderer;
