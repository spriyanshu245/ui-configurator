"use client";
import React from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import PropertyInput from "@/app/components/PropertyInputs/PropertyInput";

interface StepperPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: {
    id: string;
    type: string;
    properties: {
      apiUrl?: string;
      apiHeaders?: string;
      apiName?: string;
      storeDataInSession?: boolean;
      stepperPathToData?: string;
      statusKey?: string;
      waitValue?: string;
      currentValue?: string;
      completedValue?: string;
      titleKey?: string;
      descriptionKey?: string;
      [key: string]: unknown;
    };
  };
  setProperty: (prop: string, value: unknown) => void;
}

const StepperPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: StepperPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.StepperPathToData:
        return (
          <PropertyInput
            type="text"
            label="Path to Data Array"
            placeholder="e.g. data.steps"
            id={`${propertyComponent.id}-stepperPathToData`}
            value={properties.stepperPathToData ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.StepperPathToData,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.StatusKey:
        return (
          <PropertyInput
            type="text"
            label="Status Key"
            placeholder="Key in data item for status"
            id={`${propertyComponent.id}-statusKey`}
            value={properties.statusKey ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.StatusKey,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.WaitValue:
        return (
          <PropertyInput
            type="text"
            label="Wait State Value"
            placeholder="Value that maps to wait state"
            id={`${propertyComponent.id}-waitValue`}
            value={properties.waitValue ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.WaitValue,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.CurrentValue:
        return (
          <PropertyInput
            type="text"
            label="Current State Value"
            placeholder="Value that maps to current state"
            id={`${propertyComponent.id}-currentValue`}
            value={properties.currentValue ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.CurrentValue,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.CompletedValue:
        return (
          <PropertyInput
            type="text"
            label="Completed State Value"
            placeholder="Value that maps to completed state"
            id={`${propertyComponent.id}-completedValue`}
            value={properties.completedValue ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.CompletedValue,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.TitleKey:
        return (
          <PropertyInput
            type="text"
            label="Title Key"
            placeholder="Key in data item for step title"
            id={`${propertyComponent.id}-titleKey`}
            value={properties.titleKey ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.TitleKey,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      case ComponentProperty.DescriptionKey:
        return (
          <PropertyInput
            type="text"
            label="Description Key"
            placeholder="Key in data item for step description"
            id={`${propertyComponent.id}-descriptionKey`}
            value={properties.descriptionKey ?? ""}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.DescriptionKey,
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        );

      default:
        return null;
    }
  };

  const mappingKeys = [
    ComponentProperty.StepperPathToData,
    ComponentProperty.StatusKey,
    ComponentProperty.WaitValue,
    ComponentProperty.CurrentValue,
    ComponentProperty.CompletedValue,
    ComponentProperty.TitleKey,
    ComponentProperty.DescriptionKey,
  ];

  const visibleMappingKeys = propertyKeys.filter((k) =>
    mappingKeys.includes(k),
  );

  return (
    <>
      {visibleMappingKeys.length > 0 && (
        <div id="stepperMappingPanel">
          <button
            onClick={() => togglePanel?.(PropertyPanels.StepperMappingPanel)}
            className={`${sharedPropertiesStyles.panelHeading} ${
              isPanelOpen?.(PropertyPanels.StepperMappingPanel)
                ? sharedPropertiesStyles.isOpen
                : ""
            }`}
          >
            <h3>Stepper Configuration</h3>
            <ChevronDownIcon />
          </button>
          {isPanelOpen?.(PropertyPanels.StepperMappingPanel) && (
            <>
              {visibleMappingKeys.map((key) => (
                <div key={`${key}-${propertyComponent.id}`}>
                  {renderProperty(key)}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StepperPanel;
