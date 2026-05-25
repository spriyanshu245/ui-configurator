"use client";
import { useRef, useState } from "react";
import { DynamicConditions, NameKeyId } from "../../types/types";
import sharedStyles from "../../styles/shared.module.scss";
import sharedPropertiesStyles from "../../styles/properties-pane.module.scss";
import styles from "./dynamicConditionRenderer.module.scss";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import MultiSelect from "../../components/MultiSelect/MultiSelect";
import { keyFormat } from "../../utils/utils";
import DeleteIcon from "../../components/SVGIcons/Delete";
import EditIconButton from "../EditIconButton/EditIconButton";
import {
  dynamicConditionsType,
  dynamicContionsTitles,
  toggleDynamicTooltips,
} from "../../utils/constants";
import AddIcon from "../SVGIcons/Add";

interface ConditionsRendererProps {
  dynamicConditions: DynamicConditions | undefined;
  componentProperty: string;
  setProperty: (key: string, property: any) => void;
  formElements: NameKeyId[];
  handleSelectedItem: (e: string, key: string) => void;
  onRemoveValue: (key: string) => void;
  dropdownItems: NameKeyId[];
}

const DynamicConditionRenderer = ({
  dynamicConditions,
  componentProperty,
  setProperty,
  formElements,
  handleSelectedItem,
  onRemoveValue,
  dropdownItems,
}: ConditionsRendererProps) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedKey, setEditedKey] = useState<string>("");
  const [selected, setSelected] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addCondition = (parentKeys: string, value: boolean) => {
    const updatedConditions = {
      ...(dynamicConditions?.conditions || {}),
      [parentKeys]: value,
    };
    setProperty(componentProperty, {
      ...dynamicConditions,
      conditions: updatedConditions,
    });
  };

  const handleAdd = () => {
    const target = inputRef.current;
    if (target) {
      const parentKeys = keyFormat(target.value);
      addCondition(parentKeys, false);
      target.value = "";
    }
  };

  const deleteCondition = (combinedKey: string) => {
    const updatedConditions = dynamicConditions?.conditions || {};
    delete updatedConditions[combinedKey];
    setProperty(componentProperty, {
      ...dynamicConditions,
      conditions: updatedConditions,
    });
  };

  const updateCondition = (combinedKey: string) => {
    const updatedConditions = {
      ...(dynamicConditions?.conditions || {}),
      [combinedKey]: dynamicConditions?.conditions
        ? !dynamicConditions.conditions[combinedKey]
        : false,
    };
    setProperty(componentProperty, {
      ...dynamicConditions,
      conditions: updatedConditions,
    });
  };

  const handleEditKey = (oldKey: string) => {
    if (!editedKey.trim() || editedKey === oldKey) {
      setEditingKey(null);
      return;
    }

    const updatedConditions = { ...dynamicConditions?.conditions };
    updatedConditions[editedKey] = updatedConditions[oldKey];
    delete updatedConditions[oldKey];
    setProperty(componentProperty, {
      ...dynamicConditions,
      conditions: updatedConditions,
    });
    setEditingKey(null);
    setEditedKey("");
  };

  return (
    <div
      id={componentProperty}
      className={sharedPropertiesStyles.dynamicConditionsContainer}
    >
      <div className={sharedPropertiesStyles.propertyHeaders}>
        <h5>{dynamicContionsTitles[componentProperty]}</h5>
        <div className={sharedPropertiesStyles.importContainer}>
          <select
            id={`${componentProperty}-import`}
            className={`${sharedPropertiesStyles.selectInput}`}
            value={selected || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelected(e.target.value);
              handleSelectedItem(e.target.value, componentProperty);
            }}
            data-testid={`${componentProperty}-import`}
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
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <MultiSelect
          label="Select Parent Names:"
          options={formElements}
          id="parentNames"
          value={dynamicConditions?.parentNames || []}
          onChange={(selectedOptions) => {
            setProperty(componentProperty, {
              ...dynamicConditions,
              parentNames: selectedOptions,
            });
          }}
          onRemoveValue={() => onRemoveValue(componentProperty)}
        />
      </div>
      <div className={`${sharedPropertiesStyles.componentProperty}`}>
        <label className={sharedPropertiesStyles.checkBoxCenter}>
          <input
            id={`is${dynamicConditionsType[componentProperty]}ByDefault`}
            data-testid={`is${dynamicConditionsType[componentProperty]}ByDefault`}
            type="checkbox"
            checked={dynamicConditions?.defaultValue ?? false}
            onChange={(e) => {
              setProperty(componentProperty, {
                ...dynamicConditions,
                defaultValue: e.target.checked,
              });
            }}
            className={sharedPropertiesStyles.conditionalCheckBox}
          />
          <span className={sharedPropertiesStyles.propertyLabel}>
            {`${dynamicConditionsType[componentProperty]} by default`}
          </span>
        </label>
      </div>
      <div>
        <div
          className={`${sharedPropertiesStyles.dynamicConditionsHeader} ${sharedPropertiesStyles.conditionRow}`}
        >
          <div className={sharedPropertiesStyles.parentValuesHeader}>
            Parent Values
          </div>
          <div className={sharedPropertiesStyles.statusCol}>status</div>
          <div className={sharedPropertiesStyles.actionsCol}>Actions</div>
        </div>
        {dynamicConditions &&
          Object.entries(dynamicConditions?.conditions || {}).map(
            ([combinedKey, value], index) => (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.conditionRow}`}
                key={`condition-${index + 1}`}
              >
                {editingKey === combinedKey ? (
                  <input
                    type="text"
                    value={editedKey}
                    onChange={(e) => setEditedKey(keyFormat(e.target.value))}
                    onBlur={() => handleEditKey(combinedKey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditKey(combinedKey);
                    }}
                    className={`${sharedPropertiesStyles.parentValuesHeader} ${sharedPropertiesStyles.parentValuesCol}`}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`${sharedPropertiesStyles.parentValuesHeader} ${sharedPropertiesStyles.parentValuesCol}`}
                  >
                    {combinedKey}
                  </span>
                )}
                <span
                  className={sharedPropertiesStyles.statusCol}
                  title={toggleDynamicTooltips[componentProperty][`${value}`]}
                >
                  <ToggleSwitch
                    size="small"
                    isToggled={value}
                    onToggle={() => updateCondition(combinedKey)}
                  />
                </span>
                <span className={sharedPropertiesStyles.actionsCol}>
                  <button
                    id={`delete-${componentProperty}`}
                    data-testid={`delete-${componentProperty}`}
                    className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                    onClick={() => deleteCondition(combinedKey)}
                    title={`Delete ${dynamicConditionsType[componentProperty]} condition`}
                  >
                    <DeleteIcon />
                  </button>
                  {editingKey === combinedKey ? null : (
                    <EditIconButton
                      id={`edit-${componentProperty}`}
                      data-testid={`edit-${componentProperty}`}
                      className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                      onClick={() => {
                        setEditingKey(combinedKey);
                        setEditedKey(combinedKey);
                      }}
                      title={`Edit ${dynamicConditionsType[componentProperty]} condition`}
                    />
                  )}
                </span>
              </div>
            )
          )}
      </div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <label
          htmlFor="parentValue"
          className={sharedPropertiesStyles.propertyLabel}
        >
          {`Add ${dynamicContionsTitles[componentProperty].replace(
            " conditions",
            ""
          )} condition:`}
        </label>
        <div className={styles.inputRowContainer}>
          <input
            id="parentValue"
            type="text"
            placeholder="Parent Values (comma-separated)"
            ref={inputRef}
            className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
            onKeyDown={(e) => {
              const target = e.target as HTMLInputElement;
              if (e.key === "Enter") {
                const parentKeys = keyFormat(target.value);
                addCondition(parentKeys, false);
                target.value = "";
              }
            }}
          />
          <button
            id={`add-${componentProperty}`}
            data-testid={`add-${componentProperty}`}
            className={`${sharedStyles.iconButton} ${sharedStyles.small} ${sharedStyles.mt5}`}
            onClick={handleAdd}
          >
            <AddIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicConditionRenderer;
