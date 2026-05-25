import React, { useState } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { IconColorCondition } from "@/app/types/types";
import styles from "../DataColumnPanel/DataColumnPanel.module.scss";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";

interface Props {
  properties: any;
  prefixSuffix: string;
  setProperty: (prop: string, value: any) => void;
  handleAddCondition: () => void;
}

const operatorOptions = [
  { label: "== (Equal)", value: "==" },
  { label: "=== (Strict Equal)", value: "===" },
  { label: "!= (Not Equal)", value: "!=" },
  { label: "> (Greater Than)", value: ">" },
  { label: "< (Less Than)", value: "<" },
  { label: ">= (Greater or Equal)", value: ">=" },
  { label: "<= (Less or Equal)", value: "<=" },
];

const DynamicIconColorConditions = ({
  properties,
  prefixSuffix,
  setProperty,
  handleAddCondition,
}: Props) => {
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const colorConditions =
    properties?.[`${prefixSuffix}DynamicIconColorConditions`] ?? [];
  const propertyKey = `${prefixSuffix}DynamicIconColorConditions`;

  const updateConditionField = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedConditions = colorConditions.map(
      (condition: IconColorCondition, i: number) =>
        i === index ? { ...condition, [field]: value } : condition
    );
    setProperty(propertyKey, updatedConditions);
  };

  return (
    <div className={styles.columns}>
      <div className={styles.columnHeader}>Color Conditions</div>
      <div className={sharedStyle.draggableRows}>
        {colorConditions?.map(
          (condition: IconColorCondition, index: number) => {
            const conditionLabel = `Condition ${index + 1}`;

            return (
              <ExpandableColumn
                id={index}
                key={condition.id}
                colData={colorConditions}
                column={condition}
                draggedItemId={draggedItemId}
                setDraggedItemId={setDraggedItemId}
                setProperty={setProperty}
                property={propertyKey}
                minColCount={0}
                label={conditionLabel}
              >
                <div
                  className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
                >
                  <div className={styles.inputWidth}>
                    <PropertyInput
                      id={`leftOperand-${index}`}
                      type="text"
                      label="Left Operand"
                      placeholder="e.g., #promiseStatus"
                      value={condition.leftOperand}
                      handleChange={(e) =>
                        updateConditionField(
                          index,
                          "leftOperand",
                          e.target.value
                        )
                      }
                    />

                    <PropertyInput
                      type="select"
                      id={`operator-${index}`}
                      options={operatorOptions}
                      label="Operator"
                      value={condition.operator}
                      placeholder="Select Operator"
                      handleChange={(e) =>
                        updateConditionField(index, "operator", e.target.value)
                      }
                    />

                    <PropertyInput
                      id={`rightOperand-${index}`}
                      type="text"
                      label="Right Operand"
                      placeholder="e.g., Active"
                      value={condition.rightOperand}
                      handleChange={(e) =>
                        updateConditionField(
                          index,
                          "rightOperand",
                          e.target.value
                        )
                      }
                    />

                    <PropertyInput
                      id={`color-${index}`}
                      type="text"
                      label="Color (hex)"
                      placeholder="e.g., #FF0000"
                      value={condition.color}
                      handleChange={(e) =>
                        updateConditionField(index, "color", e.target.value)
                      }
                    />
                  </div>
                </div>
              </ExpandableColumn>
            );
          }
        )}
        <AddExpandableColumn
          handleAddCol={handleAddCondition}
          label="Color Condition"
        />
      </div>
    </div>
  );
};

export default DynamicIconColorConditions;
