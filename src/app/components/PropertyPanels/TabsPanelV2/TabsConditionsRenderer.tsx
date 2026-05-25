import { LOGICAL_OPERATORS, OPERATORS } from "@/app/utils/constants";
import React, { useState } from "react";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { TabsConditions } from "@/app/types/types";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import styles from "./TabsPanel.module.scss";
import DeleteIcon from "../../SVGIcons/Delete";

interface TabsConditionsRenderProps {
  tabConditions: TabsConditions;
  setProperty: (property: string, value: any) => void;
}

const TabsConditionsRenderer = ({
  tabConditions,
  setProperty,
}: TabsConditionsRenderProps) => {
  const initialCondition = { leftOperand: "", operator: "", rightOperand: "" };
  const initialConditions = {
    logicalOp: "&&",
    expressions: [initialCondition],
  };
  const [conditions, setConditions] = useState(
    typeof tabConditions == "object" && tabConditions
      ? tabConditions
      : initialConditions
  );

  const addCondition = () => {
    const updated = {
      ...conditions,
      expressions: [...conditions.expressions, initialCondition],
    };

    setConditions(updated);
    setProperty("conditions", updated);
  };

  const removeCondition = (index: number) => {
    const updated = {
      ...conditions,
      expressions: conditions?.expressions.filter((_, i) => i !== index)??[],
    };
    setConditions(updated);
    setProperty("conditions", updated);
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = JSON.parse(JSON.stringify(conditions));
    updated.expressions[index][field] = value;
    setConditions(updated);
    setProperty("conditions", updated);
  };

  const updateLogicalOp = (value: string) => {
    const updated = JSON.parse(JSON.stringify(conditions));
    updated.logicalOp = value;
    setConditions(updated);
    setProperty("conditions", updated);
  };

  return (
    <div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <h5>Build Conditions</h5>
        <PropertyInput
          type="select"
          id={"logicalOp"}
          label="Logical Operator"
          options={LOGICAL_OPERATORS}
          placeholder="select Operator"
          value={conditions.logicalOp}
          handleChange={(e) => updateLogicalOp(e.target.value)}
        />
        <h5>Conditions</h5>
        {conditions?.expressions?.map((condition, index) => (
          <div
            className={`${sharedStyles.dFlex} ${styles.conditionContainer}`}
            key={index}
          >
            <div className={styles.conditionheader}>
              <h5>Condition {index + 1}</h5>
              <button
                id={`delete${index}`}
                data-testid={`delete${index}`}
                title="delete condition"
                onClick={() => removeCondition(index)}
                className={` ${styles.deleteCondition}`}
              >
                <DeleteIcon />
              </button>
            </div>

            <PropertyInput
              id={"left" + index}
              type="text"
              label="Left key"
              placeholder="Enter left hand side Value"
              value={condition.leftOperand ?? ""}
              handleChange={(e) =>
                updateCondition(index, "leftOperand", e.target.value)
              }
            />
            {!condition.leftOperand?.startsWith("!") && (
              <React.Fragment>
                <PropertyInput
                  type="select"
                  id={"operator" + index}
                  options={OPERATORS}
                  label="operator"
                  value={condition.operator ?? ""}
                  placeholder="select Operator"
                  disabled={!condition.leftOperand}
                  handleChange={(e) =>
                    updateCondition(index, "operator", e.target.value)
                  }
                />
                <PropertyInput
                  id={"right" + index}
                  type="text"
                  label="Right key"
                  placeholder="Enter right hand side (e.g., 10, b, !b)"
                  value={condition.rightOperand ?? ""}
                  disabled={!condition.leftOperand}
                  handleChange={(e) =>
                    updateCondition(index, "rightOperand", e.target.value)
                  }
                />
              </React.Fragment>
            )}
          </div>
        ))}
        <button
          id="addTabCondition"
          data-testid="addTabCondition"
          className={`${sharedStyles.button} ${sharedStyles.secondaryBorderButton}`}
          onClick={addCondition}
        >
          Add Condition
        </button>
      </div>
    </div>
  );
};

export default TabsConditionsRenderer;
