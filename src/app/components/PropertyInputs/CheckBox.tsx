import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { InputProps } from "@/app/types/types";

const CheckBox = ({ id, value, handleChange, label, ...props }: InputProps) => {
  return (
    <label className={sharedPropertiesStyles.checkBoxCenter}>
      <input
        id={id}
        data-testid={id}
        type="checkbox"
        checked={value}
        onChange={handleChange}
        className={sharedPropertiesStyles.conditionalCheckBox}
        {...props}
      />
      <span className={sharedPropertiesStyles.propertyLabel}>{label}</span>
    </label>
  );
};

export default CheckBox;
