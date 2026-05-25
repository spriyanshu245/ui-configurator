"use client";
import React from "react";
import { SelectComponent } from "@/app/types/types";
import styles from "./Select.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";

interface SelectProps {
  component: SelectComponent;
}

const Select = ({ component }: SelectProps) => {
  const placeholder = component.properties?.placeholder ?? "";
  const labelVisible =
    component.properties.label && component.properties.showLabel;
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.customSelect} `}
      aria-haspopup="listbox"
      aria-owns={`${component.id}-listbox`}
    >
      {labelVisible && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div className={styles.selectTrigger} data-testid={component.id}>
        <span>{placeholder}</span>
        <span className={styles.arrow}>
          <ChevronDownIcon />
        </span>
      </div>
    </div>
  );
};

export default Select;
