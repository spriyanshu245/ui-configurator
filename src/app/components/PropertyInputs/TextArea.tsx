import React from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";

interface TextAreaProps {
  id: string;
  value: any;
  placeholder?: string;
  handleChange: (e: any) => void;
  rows?: number;
}

const TextArea = ({
  id,
  value,
  placeholder,
  handleChange,
  rows = 5,
}: TextAreaProps) => {
  return (
    <textarea
      id={id}
      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
      placeholder={placeholder ?? ""}
      rows={rows}
      value={value ?? ""}
      onChange={handleChange}
    />
  );
};

export default TextArea;