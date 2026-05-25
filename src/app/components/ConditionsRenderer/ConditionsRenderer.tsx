"use client";
import {
  DynamicOptions,
  FormComponent,
  DynamicConditions,
  InputTableComponent,
  TableComponent,
  NameKeyId,
} from "../../types/types";
import React, { useEffect, useState } from "react";
import DynamicOptionsRenderer from "../DynamicOptionsRenderer/DynamicOptionsRenderer";
import DynamicConditionRenderer from "../DynamicConditionRenderer/DynamicConditionRenderer";
import { ComponentProperty } from "@/app/data/componentProperties";


interface ConditionsRendererProps {
  property: ComponentProperty;
  type: string;
  setProperty: (key: string, value: any) => void;
  visibilityConditions?: DynamicConditions;
  enableDisableConditions?: DynamicConditions;
  dynamicOptions?: DynamicOptions;
  requiredFieldConditions?: DynamicConditions;
  parentForm: FormComponent | InputTableComponent | TableComponent | null;
  handleSelectedItem: (e: string, key: string) => void;
  onRemoveValue: (key: string) => void;
  dropdownItems: NameKeyId[];
}

export default function ConditionsRenderer({
  property,
  type,
  setProperty,
  visibilityConditions,
  enableDisableConditions,
  dynamicOptions,
  requiredFieldConditions,
  parentForm,
  handleSelectedItem,
  onRemoveValue,
  dropdownItems,
}: Readonly<ConditionsRendererProps>) {
  const [formElements, setFormElements] = useState<NameKeyId[]>([]);

  const getNamkeyList = () => {
    return parentForm?.properties?.nameKeyIds??[];
  };

  useEffect(() => {
    const list: NameKeyId[] = getNamkeyList();
    setFormElements(list);
  }, [parentForm]);

  const renderProperty = (property: ComponentProperty) => {
    switch (property) {
      case ComponentProperty.DynamicOptions:
        return (
          <DynamicOptionsRenderer
            setProperty={setProperty}
            dynamicOptions={dynamicOptions}
            type={type}
            formElements={formElements}
            handleSelectedItem={handleSelectedItem}
            dropdownItems={dropdownItems}
            onRemoveValue={onRemoveValue}
          />
        );

      case ComponentProperty.VisibilityConditions:
        return (
          <DynamicConditionRenderer
            dynamicConditions={visibilityConditions}
            componentProperty={ComponentProperty.VisibilityConditions}
            setProperty={setProperty}
            formElements={formElements}
            handleSelectedItem={handleSelectedItem}
            onRemoveValue={onRemoveValue}
            dropdownItems={dropdownItems}
          />
        );

      case ComponentProperty.EnableDisableConditions:
        return (
          <DynamicConditionRenderer
            dynamicConditions={enableDisableConditions}
            componentProperty={ComponentProperty.EnableDisableConditions}
            setProperty={setProperty}
            formElements={formElements}
            handleSelectedItem={handleSelectedItem}
            onRemoveValue={onRemoveValue}
            dropdownItems={dropdownItems}
          />
        );

      case ComponentProperty.RequiredFieldConditions:
        return (
          <DynamicConditionRenderer
            dynamicConditions={requiredFieldConditions}
            componentProperty={ComponentProperty.RequiredFieldConditions}
            setProperty={setProperty}
            formElements={formElements}
            handleSelectedItem={handleSelectedItem}
            onRemoveValue={onRemoveValue}
            dropdownItems={dropdownItems}
          />
        );

      default:
        return null;
    }
  };
  return renderProperty(property);
}
