import React from "react";
import DeleteIcon from "../../SVGIcons/Delete";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { ConditionalRoute } from "@/app/types/types";
import styles from "./ActionPanel.module.scss";
import { getComponents } from "@/app/utils/utils";
import { OPERATORS } from "@/app/utils/constants";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { useUserTask } from "@/app/context/UserTaskContext";

interface Props {
  properties: any;
  deleteCondition: (index: number) => void;
  handleAddConditionalRoute: () => void;
  handleRouteChange: (
    name: string,
    value: ConditionalRoute["condition"] | string,
    index: number
  ) => void;
}

const ConditonalRouting = ({
  properties,
  deleteCondition,
  handleAddConditionalRoute,
  handleRouteChange,
}: Props) => {
  const { microsite, activePageCode } = useMicrosite();
  let conditionalRoutings = properties?.conditionalRoutes;
  const { userTask } = useUserTask();

  const pageList = microsite.pages
    .filter((page) => page.pageCode !== activePageCode)
    .map((page) => ({
      value: page.pageCode.slice(page.pageCode.indexOf("_") + 1),
      label: page.pageCode,
      isPopup: userTask?.properties?.showAsPopup ?? false,
    }));

  let components: string[] = getComponents(userTask?.components);

  const updateCondition = (index: number, field: string, value: string) => {
    const route = conditionalRoutings[index];
    const currentCondition = route.condition || {};

    const updatedCondition = {
      leftOperand: currentCondition.leftOperand ?? "",
      operator: currentCondition.operator ?? "",
      rightOperand: currentCondition.rightOperand ?? "",
      [field]: value,
    };

    handleRouteChange("condition", updatedCondition, index);
  };

  return (
    <div
      className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column} ${styles.conditionalColumns}`}
    >
      <p className={sharedPropertiesStyles.propertyLabel}>Conditional Routes</p>

      {conditionalRoutings?.map((route: ConditionalRoute, index: number) => {
        const selectedPage = pageList.find((p) => p.value === route.route);
        const isPopup = selectedPage?.isPopup;
        const condition = route.condition || {
          leftOperand: "",
          operator: "",
          rightOperand: "",
        };
        return (
          <div
            key={`condition-${index + 1}`}
            className={styles.conditionalRoute}
          >
            <div className={styles.header}>
              <button
                data-testid="delete"
                id={`deleteCondition-${index + 1}`}
                className={styles.removeIcon}
                onClick={() => deleteCondition(index)}
              >
                <DeleteIcon />
              </button>
            </div>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Condition</p>
              <div className={styles.expression}>
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
            </div>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Route</p>
              <select
                id={`route-${index}`}
                data-testid={`route-${index}`}
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                value={route.route}
                onChange={(e) =>
                  handleRouteChange("route", e.target.value, index)
                }
              >
                <option value="">Select a page</option>
                {pageList.map((page, index) => (
                  <option key={`${page?.value}-${index}`} value={page?.value}>
                    {page?.label}
                  </option>
                ))}
              </select>
            </div>
            {isPopup && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Action on popup close
                </p>
                <select
                  id={`action-${index}`}
                  data-testid={`action-${index}`}
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  value={route.onCloseAction}
                  onChange={(e) =>
                    handleRouteChange("onCloseAction", e.target.value, index)
                  }
                >
                  <option value="">Select</option>
                  {components.map((comp: string, index) => (
                    <option key={`${comp}-${index}`} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
      <button
        className={`${sharedStyles.button} ${sharedStyles.secondaryBorderButton}`}
        onClick={handleAddConditionalRoute}
      >
        Add Conditional Route
      </button>
    </div>
  );
};

export default ConditonalRouting;
