import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import CheckBox from "./CheckBox";
import TextInput from "./TextInput";
import TextArea from "./TextArea";
import DropDown from "./DropDown";
import { InputProps } from "@/app/types/types";

export interface PropertyInputProps extends InputProps {
  type: "text" | "number" | "select" | "checkbox" | "textarea";
}
const PropertyInput = ({
  type,
  id,
  value,
  label,
  placeholder,
  handleChange,
  options,
  ...props
}: PropertyInputProps) => {
  const getInput = (type: string) => {
    switch (type) {
      case "text":
      case "number":
        return (
          <TextInput
            id={id}
            type={type}
            value={value}
            placeholder={placeholder ?? ""}
            handleChange={handleChange}
            { ...props}
          ></TextInput>
        );
      case "select":
        return (
          <DropDown
            id={id}
            value={value}
            placeholder={placeholder ?? ""}
            handleChange={handleChange}
            options={options ?? []}
            {...props}
          ></DropDown>
        );
      case "textarea":
        return (
          <TextArea
            id={id}
            value={value}
            placeholder={placeholder ?? ""}
            handleChange={handleChange}
            {...props}
          />
        );
    }
  };
  return (
    <div
      className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
    >
      {type === "checkbox" ? (
        <CheckBox
          id={id}
          value={value}
          label={label}
          handleChange={handleChange}
        />
      ) : (
        <React.Fragment>
          <p className={sharedPropertiesStyles.propertyLabel}>{label}</p>
          {getInput(type)}
        </React.Fragment>
      )}
    </div>
  );
};

export default PropertyInput;
