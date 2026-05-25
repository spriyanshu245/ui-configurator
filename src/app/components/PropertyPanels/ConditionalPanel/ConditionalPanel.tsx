"use client";
import ConditionsRenderer from "../../../components/ConditionsRenderer/ConditionsRenderer";
import ChevronDownIcon from "../../../components/SVGIcons/ChevronDown";
import ToggleSwitch from "../../../components/ToggleSwitch/ToggleSwitch";
import { useHeaderV2 } from "../../../context/HeaderContextV2";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { useFindForm } from "../../../hooks/useFindForm";
import { useParentFormProperties } from "../../../hooks/useParentFormProperties";
import sharedPropertiesStyles from "../../../styles/properties-pane.module.scss";
import sharedStyles from "../../../styles/shared.module.scss";
import { BaseComponent, NameKeyId } from "../../../types/types";
import { BREAKPOINTS, PropertyPanels } from "../../../utils/constants";
import { useState, useEffect } from "react";
import { getKeyValue } from "../../../utils/utils";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import MultiSelect from "../../MultiSelect/MultiSelect";

interface ConditionalPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  component?: any;
  setProperty: (prop: string, value: any) => void;
}

const ConditionalPanel = ({
  propertyKeys,
  propertyComponent,
  component,
  setProperty,
}: ConditionalPanelProps) => {
  const { properties } = propertyComponent;
  const { parentForm } = useParentFormProperties(
    component ?? propertyComponent,
  );
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { formNames } = useFindForm();
  const [dropdownItems, setDropdownItems] = useState<NameKeyId[]>([]);
  const [importParents, setImportParents] = useState<string[]>([]);
  const [currentParents, setCurrentParents] = useState<string[]>([]);
  const [removeKeyCondition, setRemoveKeyCondition] = useState<string>("");

  const { setUserNotification } = useHeaderV2();

  useEffect(() => {
    const list =
      component?.properties?.nameKeyIds ??
      parentForm?.properties.nameKeyIds ??
      [];

    setDropdownItems(list);

    if (removeKeyCondition) {
      handleRemoveValue(removeKeyCondition);
    }
  }, [
    JSON.stringify(parentForm?.components),
    JSON.stringify(component),
    propertyComponent.id,
    removeKeyCondition,
  ]);

  const setParentConditions = (
    selectedObj: { parentNames?: string[]; conditions?: object },
    key: string,
  ) => {
    const parents = selectedObj.parentNames;
    const conditions = selectedObj?.conditions;
    setCurrentParents(propertyComponent.properties?.[key]?.parentNames);
    const isChildField = parents?.includes(propertyComponent.properties?.name);
    const ResetParents: string[] = propertyComponent.properties[
      key
    ]?.parentNames?.filter((item: string) => !importParents.includes(item));

    if (isChildField) {
      setUserNotification({
        text: "Cannot import from child Field",
        time: 3000,
        type: "error",
      });
    } else {
      if (currentParents === undefined || currentParents.length === 0) {
        setProperty(key, {
          ...propertyComponent.properties?.[key],
          parentNames: [
            ...new Set([...(ResetParents || []), ...(parents || [])]),
          ],
          conditions: conditions ?? {},
        });
      } else if (
        areArraysEqual(
          propertyComponent.properties?.[key]?.parentNames,
          parents || [],
        )
      ) {
        setProperty(key, {
          ...propertyComponent.properties?.[key],
          parentNames: [
            ...new Set([...(ResetParents || []), ...(parents || [])]),
          ],
          conditions: {
            ...propertyComponent.properties?.[key]?.conditions,
            ...conditions,
          },
        });
      }

      function areArraysEqual(arr1: string[] | undefined, arr2: string[]) {
        const sortedArr1 = arr1 && [...arr1].sort((a, b) => a.localeCompare(b));
        const sortedArr2 = [...arr2].sort((a, b) => a.localeCompare(b)) || [];

        return (
          arr1 &&
          (sortedArr1?.every((value, index) => value === sortedArr2[index]) ??
            false)
        );
      }
    }
  };

  const handleRemoveValue = (key: string) => {
    setRemoveKeyCondition(key);
    if (propertyComponent.properties?.[key]?.parentNames?.length === 0) {
      const updatedProperties = { ...propertyComponent.properties?.[key] };
      if (updatedProperties.conditions) {
        delete updatedProperties.conditions;
      }
      setProperty(key, updatedProperties);
    }
  };

  const listFormElementObject = (components: BaseComponent[]) => {
    let elementList: BaseComponent[] = [];
    components?.forEach((component) => {
      if (component.type === "field-group") {
        return;
      } else if ("components" in component) {
        elementList = elementList.concat(
          listFormElementObject(component.components as BaseComponent[]),
        );
      } else if (
        component?.properties?.name &&
        propertyComponent.id !== component.id
      ) {
        elementList.push(component);
      }
    });

    return elementList;
  };

  const handleAddConditionCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.IsConditionalComponent, e.target.checked);
  };

  const handleSelectedItem = (selectedItem: string, key: string) => {
    const matchedComponent =
      (selectedItem &&
        listFormElementObject(parentForm?.components as BaseComponent[]).find(
          (component) => component?.properties?.name === selectedItem,
        )) ||
      [];

    const selectedObj = getKeyValue(matchedComponent, key);
    selectedObj?.parentNames
      ? setParentConditions(selectedObj || [], key)
      : setUserNotification({
          text: `no parent conditions found in ${selectedItem}`,
          time: 3000,
          type: "error",
        });
    selectedObj && setImportParents(selectedObj?.parentNames);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.IsConditionalComponent:
        return (
          <PropertyInput
            id="isConditionalComponent"
            type="checkbox"
            value={!!properties?.isConditionalComponent}
            label="Conditional field"
            handleChange={(e) =>
              handleAddConditionCheck(e as React.ChangeEvent<HTMLInputElement>)
            }
          ></PropertyInput>
        );

      case ComponentProperty.ResponsiveVisibilityOff:
        return (
          !!properties?.isConditionalComponent && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>
                Hide component on
              </p>
              <MultiSelect
                placeholder="Select a resolution"
                options={BREAKPOINTS}
                id="responsiveVisibilityOff"
                dataTestId="responsiveVisibilityOff"
                value={
                  Array.isArray(properties?.responsiveVisibilityOff)
                    ? properties.responsiveVisibilityOff
                    : []
                }
                onChange={(selectedOptions) => {
                  setProperty(
                    ComponentProperty.ResponsiveVisibilityOff,
                    selectedOptions,
                  );
                }}
                onRemoveValue={(value) => {
                  const currentValues = Array.isArray(
                    properties?.responsiveVisibilityOff,
                  )
                    ? properties.responsiveVisibilityOff
                    : [];
                  const updatedValues = currentValues.filter(
                    (option: any) => option !== value,
                  );
                  setProperty(
                    ComponentProperty.ResponsiveVisibilityOff,
                    updatedValues,
                  );
                }}
              />
            </div>
          )
        );

      case ComponentProperty.DynamicOptions:
      case ComponentProperty.VisibilityConditions:
      case ComponentProperty.EnableDisableConditions:
      case ComponentProperty.RequiredFieldConditions:
        return (
          !!properties?.isConditionalComponent && (
            <ConditionsRenderer
              type={propertyComponent.type}
              property={propertyKey}
              setProperty={setProperty}
              visibilityConditions={
                propertyComponent.properties.visibilityConditions
              }
              enableDisableConditions={
                propertyComponent.properties.enableDisableConditions
              }
              requiredFieldConditions={
                propertyComponent.properties.requiredFieldConditions
              }
              dynamicOptions={propertyComponent.properties.dynamicOptions}
              parentForm={
                propertyComponent?.type == "input-table-column" ||
                propertyComponent?.type == "table-column"
                  ? component
                  : parentForm
              }
              handleSelectedItem={handleSelectedItem}
              dropdownItems={dropdownItems}
              onRemoveValue={handleRemoveValue}
            />
          )
        );

      case ComponentProperty.ReloadSessionStatus:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="reloadSessionStatus"
                data-testid="reloadSessionStatus"
                type="checkbox"
                checked={properties?.reloadSessionStatus}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.ReloadSessionStatus,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Reload Session Status
              </span>
            </label>
          </div>
        );

      case ComponentProperty.VisibleOnFormResponse:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <ToggleSwitch
              id="visibleOnFormResponse"
              size="small"
              onToggle={() => {
                const val = !properties?.visibleOnFormResponse;
                setProperty(ComponentProperty.VisibleOnFormResponse, val);
              }}
              isToggled={!!properties?.visibleOnFormResponse}
              label={
                propertyComponent?.type === "sub-section"
                  ? "Reload on Form Success"
                  : "Visible on Form Success"
              }
            />
          </div>
        );

      case ComponentProperty.LinkedFormForSection:
        if (!formNames || !properties?.visibleOnFormResponse) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Linked Form</p>
            <select
              id="linkedFormForSection"
              name="linkedForm"
              data-testid="linkedForm"
              value={propertyComponent?.properties?.linkedFormForSection}
              onChange={(e) =>
                setProperty(
                  ComponentProperty.LinkedFormForSection,
                  e.target.value,
                )
              }
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
            >
              <option value="">Select Linked Form</option>
              {formNames?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case ComponentProperty.LineUnderLabel:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="lineUnderLabel"
                type="checkbox"
                checked={!!properties?.lineUnderLabel}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.LineUnderLabel,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Line Under Label
              </span>
            </label>
          </div>
        );
    }
  };

  return (
    <div id="conditionPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.ConditionalPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.ConditionalPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Conditions</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.ConditionalPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
export default ConditionalPanel;
