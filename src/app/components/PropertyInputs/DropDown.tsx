import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { InputProps } from "@/app/types/types";

const DropDown = ({
  id,
  value,
  handleChange,
  options,
  placeholder,
  ...props
}: InputProps) => {
  return (
    <select
      id={id}
      data-testid={id}
      className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
      value={value}
      onChange={handleChange}
      {...props}
    >
      {placeholder && (
        <option value="" key={placeholder}>
          {placeholder}
        </option>
      )}
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default DropDown;
