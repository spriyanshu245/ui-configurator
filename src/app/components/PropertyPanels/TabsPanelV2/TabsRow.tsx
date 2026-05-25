import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { TabComponent, TabsComponent, TabsConditions } from "@/app/types/types";
import TabsConditionsRenderer from "./TabsConditionsRenderer";

interface TabsRowProps {
  id: number;
  column: TabComponent;
  propertyComponent: TabsComponent;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
}

export const TabsRow = ({
  id,
  column,
  propertyComponent,
  setProperty,
}: TabsRowProps) => {
  const { properties } = column;
  const colData = propertyComponent.components || [];

  const handleChange = (id: string, name: string, value: any) => {
    const updatedData = colData.map((col: TabComponent) =>
      col.id === id
        ? {
            ...col,
            properties: {
              ...col.properties,
              [name]: value,
            },
          }
        : col
    );

    setProperty("components", updatedData, true);
  };

  return (
    <>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>Label</p>
        <input
          id={`tabLabel-${id + 1}`}
          data-testid={`tabLabel-${id + 1}`}
          type="text"
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          value={properties?.title ?? ""}
          onChange={(e) => handleChange(column.id, "title", e.target.value)}
        />
      </div>
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
      >
        <label className={sharedPropertiesStyles.checkBoxCenter}>
          <input
            id={`isConditional-${id + 1}`}
            type="checkbox"
            data-testid={`isConditional-${id + 1}`}
            checked={properties?.isConditional ?? false}
            onChange={(e) =>
              handleChange(column.id, "isConditional", e.target.checked)
            }
            className={sharedPropertiesStyles.conditionalCheckBox}
          />
          <span className={sharedPropertiesStyles.propertyLabel}>
            Is Conditional
          </span>
        </label>
      </div>
      {properties.isConditional && (
        <TabsConditionsRenderer
          data-testid={`condition-${id + 1}`}
          tabConditions={properties?.conditions}
          setProperty={(property: string, conditions: TabsConditions) =>
            handleChange(column.id, property, conditions)
          }
        ></TabsConditionsRenderer>
      )}
      <div
        className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
      >
        <p className={sharedPropertiesStyles.propertyLabel}>
          Clear session on click
        </p>
        <textarea
          id={`sessionKeys-${id + 1}`}
          data-testid={`sessionKeys-${id + 1}`}
          placeholder="Enter session keys (comma-separated)"
          value={properties?.sessionKeys ?? ""}
          className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
          onChange={(e) =>
            handleChange(column.id, "sessionKeys", e.target.value)
          }
        />
      </div>

      
    </>
  );
};

export default TabsRow;
