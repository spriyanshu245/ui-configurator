"use client";
import { DynamicOptions, NameKeyId, Options } from "@/app/types/types";
import React, { useState } from "react";
import { OptionsRenderer } from "../OptionsRenderer/OptionsRenderer";
import sharedStyles from "@/app/styles/shared.module.scss";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { deepClone, keyFormat } from "@/app/utils/utils";
import MultiSelect from "@/app/components/MultiSelect/MultiSelect";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import { ComponentProperty } from "@/app/data/componentProperties";
import { dynamicContionsTitles } from "@/app/utils/constants";

interface DynamicOptionsRendererProps {
  setProperty: (key: string, value: any) => void;
  dynamicOptions: DynamicOptions | undefined;
  type: string;
  formElements: NameKeyId[];
  handleSelectedItem: (e: string, key: string) => void;
  onRemoveValue: (key: string) => void;
  dropdownItems: NameKeyId[];
}

const DynamicOptionsRenderer = ({
  setProperty,
  dynamicOptions,
  type,
  formElements,
  handleSelectedItem,
  onRemoveValue,
  dropdownItems,
}: DynamicOptionsRendererProps) => {
  const [selected, setSelected] = useState("");

  const deleteCondition = (dynamicOptions: DynamicOptions, key: string) => {
    const conditions = { ...(dynamicOptions?.conditions || {}) };
    delete conditions[key];
    dynamicOptions.conditions = conditions;
    setProperty(ComponentProperty.DynamicOptions, { ...dynamicOptions });
  };

  const setDynamicOptions =
    (dynamicOptions: DynamicOptions) => (options: Options, key: string) => {
      const conditions = { ...(dynamicOptions?.conditions || {}) };
      conditions[key] = options;
      dynamicOptions.conditions = conditions;
      setProperty(ComponentProperty.DynamicOptions, { ...dynamicOptions });
    };

  const validatePreviousConditionKey = (): boolean => {
    const keys = Object.keys(dynamicOptions?.conditions || {});
    return keys.length > 0 ? !!keys[keys.length - 1] : true;
  };

  const addCondition = (dynamicOptions: DynamicOptions) => {
    if (validatePreviousConditionKey()) {
      const newKey = "";
      const newConditions = deepClone(dynamicOptions);
      newConditions.conditions = {
        ...dynamicOptions.conditions,
        [newKey]: [
          {
            value: "option1",
            label: "Option 1",
          },
        ],
      };
      setProperty(ComponentProperty.DynamicOptions, newConditions);
    }
  };

  const updateKey = (
    oldKey: string,
    newKey: string,
    dynamicOptions: DynamicOptions
  ) => {
    if (
      dynamicOptions.conditions &&
      newKey?.trim() !== "" &&
      oldKey !== newKey
    ) {
      const conditions = { ...(dynamicOptions.conditions || {}) };
      if (!conditions[newKey]) {
        conditions[newKey] = conditions[oldKey];
        delete conditions[oldKey];
        dynamicOptions.conditions = conditions;
        setProperty(ComponentProperty.DynamicOptions, { ...dynamicOptions });
      }
    }
  };

  return (
    <div
      id="dynamicOptions"
      data-testid="dynamicOptions"
      className={sharedPropertiesStyles.dynamicConditionsContainer}
    >
      <div className={sharedPropertiesStyles.propertyHeaders}>
        <h5>{dynamicContionsTitles[ComponentProperty.DynamicOptions]}</h5>
        <div className={sharedPropertiesStyles.importContainer}>
          <select
            id="dynamicOptionsSelect"
            className={`${sharedPropertiesStyles.selectInput}`}
            value={(selected ?? selected) || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelected(e.target.value);
              handleSelectedItem(
                e.target.value,
                ComponentProperty.DynamicOptions
              );
            }}
            data-testid="dynamicOptionsSelect"
          >
            <option value="">Import from</option>
            {dropdownItems?.map((item, index) => (
              <option key={`${item.id}-${index}`} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <MultiSelect
            label="Select Parent Names:"
            options={formElements}
            id="parentNames"
            dataTestId="parentNames"
            value={dynamicOptions?.parentNames || []}
            onChange={(selectedOptions) => {
              dynamicOptions = {};
              dynamicOptions["parentNames"] = selectedOptions;
              setProperty(ComponentProperty.DynamicOptions, {
                ...dynamicOptions,
              });
            }}
            onRemoveValue={() =>
              onRemoveValue(ComponentProperty.DynamicOptions)
            }
          />
        </div>
        {!!dynamicOptions &&
          Object.entries(dynamicOptions?.conditions || {}).map(
            ([key, options], index) => (
              <div
                id={`condition-${index + 1 + key}`}
                key={`condition-${index + 1 + key}`}
              >
                <div
                  className={`${sharedPropertiesStyles.listItem} ${sharedStyles.mt5} ${sharedPropertiesStyles.conditions}`}
                >
                  <h5>Condition {index + 1}:</h5>
                  <button
                    id={"deleteConditionButton" + (index + 1)}
                    className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                    onClick={() => deleteCondition(dynamicOptions!, key)}
                    title="Delete condition"
                  >
                    <DeleteIcon />
                  </button>
                </div>
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <p className={sharedPropertiesStyles.propertyLabel}>Key</p>
                  <input
                    id={"values" + (index + 1)}
                    type="text"
                    defaultValue={key}
                    placeholder="Parent Values (comma-separated)"
                    onBlur={(e) =>
                      updateKey(key, keyFormat(e.target.value), dynamicOptions!)
                    }
                    className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                  <OptionsRenderer
                    setOptions={setDynamicOptions(dynamicOptions!)}
                    property={key}
                    options={options}
                    type={type}
                  />
                </div>
              </div>
            )
          )}
      </div>

      <button
        id="addCondition"
        className={`${sharedStyles.button} ${sharedStyles.secondaryBorderButton}`}
        onClick={() => addCondition(dynamicOptions ?? {})}
        title="Add Condition"
      >
        Add Condition
      </button>
    </div>
  );
};

export default DynamicOptionsRenderer;
