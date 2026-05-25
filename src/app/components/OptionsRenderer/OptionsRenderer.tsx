import { Option, Options } from "@/app/types/types";
import sharedStyles from "@/app/styles/shared.module.scss";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import { toPascalCase } from "@/app/utils/utils";
import React from "react";

interface OptionsRendererProps {
  setOptions: (options: Options, property: string) => void;
  property: string;
  type: string;
  options: Options;
  id?: string;
}

export const OptionsRenderer = ({
  setOptions,
  property,
  type,
  options = [],
  id,
}: OptionsRendererProps) => {
  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setOptions(newOptions, property);
  };

  const handleDelete = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions, property);
    }
  };

  const addNewOption = () => {
    const newOptions = [
      ...options,
      {
        label: "",
        value: `option-${options.length + 1}`,
      },
    ];
    setOptions(newOptions, property);
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.currentTarget.value === options[index]?.label) {
      e.preventDefault();
      const pascalCaseText = toPascalCase(e.clipboardData.getData("text"));
      updateOption(index, "label", pascalCaseText);
      e.currentTarget.value = pascalCaseText;
    }
  };

  return (
    <div
      className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      data-testid={id}
    >
      <p className={sharedPropertiesStyles.propertyLabel}>
        Options
      </p>

      {options &&
        options.length > 0 &&
        options.map((option: Option, index: number) => (
          <React.Fragment key={`key-${index + 1}`}>
            <div
              id="option"
              className={`${sharedPropertiesStyles.listItem} ${sharedStyles.mt5}`}
            >
              <input
                id={`label-${index + 1}`}
                data-testid={`${id}-label-${index + 1}`}
                className={sharedPropertiesStyles.textInput}
                type="text"
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
                placeholder="Label"
                onPaste={(e) => handlePaste(e, index)}
              />

              <input
                id={`value-${index + 1}`}
                className={sharedPropertiesStyles.textInput}
                type="text"
                value={option.value}
                onChange={(e) => updateOption(index, "value", e.target.value)}
                placeholder="Value"
              />

              <button
                data-testid={`deleteOption-${index + 1}`}
                className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                disabled={
                  (type === "radio-group" && options.length <= 2) ||
                  (type === "checkbox-group" && options.length <= 1)
                }
                onClick={() => handleDelete(index)}
              >
                <DeleteIcon />
              </button>
            </div>
          </React.Fragment>
        ))}

      <button
        id="addOption"
        data-testid={`${id}-addOption`}
        className={`${sharedStyles.button} ${sharedStyles.secondaryBorderButton} ${sharedStyles.mt5}`}
        disabled={type === "radio-group" && options.length >= 7}
        onClick={addNewOption}
      >
        Add Option
      </button>
    </div>
  );
};
