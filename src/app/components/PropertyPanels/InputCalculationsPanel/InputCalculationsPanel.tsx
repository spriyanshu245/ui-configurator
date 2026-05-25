"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import MathExpressionInput from "../../UIComponents/CustomComponents/MathExpression/MathExpression";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";
import { BaseComponent, ComponentGroup } from "@/app/types/types";
import { InputTypes } from "@/app/utils/enums";
interface InputCalculationsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const InputCalculationsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: InputCalculationsPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { parentForm } = useParentFormProperties(propertyComponent);

  const getOperands = (components: BaseComponent[] | undefined): string[] => {
    return (
      components?.reduce<string[]>((acc, component) => {
        if (
          component.type === "input" &&
          component.properties?.name &&
          component.properties.inputType === InputTypes.NUMBER
        ) {
          acc.push(component.properties.name);
        } else if (
          component.type === "form-row" &&
          (component as ComponentGroup).components
        ) {
          acc.push(...getOperands((component as ComponentGroup).components));
        }
        return acc;
      }, []) ?? []
    );
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.IsCalculated:
        if (properties.inputType !== "number") return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column} ${sharedStyles.mb20}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isCalculated"
                type="checkbox"
                checked={properties.isCalculated || false}
                onChange={(e) =>
                  setProperty(ComponentProperty.IsCalculated, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Calculated Field
              </span>
            </label>
          </div>
        );

      case ComponentProperty.Formula:
        if (!properties.isCalculated) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column} ${sharedStyles.mb20} ${sharedStyles.mt5}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
            >
              Formula
            </p>
            <MathExpressionInput
              data-testid="formula"
              key={"key-" + propertyComponent.id}
              variables={getOperands(parentForm?.components).flat(Infinity)}
              updateExpression={(e: string) => {
                setProperty("formula", e);
              }}
              expression={properties.formula}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    propertyComponent.properties.inputType === "number" && (
      <div id="inputCalculationsPanel">
        <button
          id="toggleButton"
          onClick={() =>
            togglePanel && togglePanel(PropertyPanels.InputCalculationsPanel)
          }
          className={`${sharedPropertiesStyles.panelHeading} ${
            isPanelOpen?.(PropertyPanels.InputCalculationsPanel)
              ? sharedPropertiesStyles.isOpen
              : ""
          }`}
        >
          <h3>Calculations</h3>
          <svg
            width="204"
            height="122"
            viewBox="0 0 204 122"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M190.765 3.88079C185.597 -1.2936 177.217 -1.2936 172.049 3.88079L102 74.0153L31.9506 3.88081C26.7825 -1.29358 18.4023 -1.29358 13.2342 3.88081L3.87607 13.2504C-1.29203 18.4248 -1.29203 26.8151 3.87607 31.9895L87.9619 116.178C95.7147 123.941 108.285 123.941 116.038 116.178L200.124 31.9894C205.292 26.8151 205.292 18.4247 200.124 13.2503L190.765 3.88079Z"
              fill="black"
            />
          </svg>
        </button>

        {isPanelOpen && isPanelOpen(PropertyPanels.InputCalculationsPanel) && (
          <>
            {propertyKeys.map((propKey) => (
              <div key={`${propKey}-${propertyComponent.id}`}>
                {renderProperty(propKey)}
              </div>
            ))}
          </>
        )}
      </div>
    )
  );
};

export default InputCalculationsPanel;
