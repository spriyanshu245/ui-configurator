import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyInputProps } from "./PropertyInput";

const TextInput = ({
  id,
  type,
  value,
  placeholder,
  handleChange,
  ...props
}: PropertyInputProps) => {
  return (
    <input
      id={id}
      data-testid={id}
      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
      type={type}
      value={value}
      placeholder={placeholder ?? "Enter input here"}
      onChange={handleChange}
      {...props}
    />
  );
};

export default TextInput;
