"use client";
import { ConditionBuilderComponent } from "@/app/types/types";
import styles from "./ConditionBuilder.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import RuleIcon from "../../SVGIcons/RuleIcon";

interface ConditionBuilderProps {
  component: ConditionBuilderComponent;
}

const ConditionBuilder = ({ component }: Readonly<ConditionBuilderProps>) => {
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {component.properties.label && component.properties.showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div className={styles.inputContainer}>
        <input
          name={component.id}
          id={component.id}
          placeholder={component.properties.placeholder}
          className={styles.input}
          disabled
        />
        <div
          className={styles.iconContainer}
          style={{
            marginLeft: `6px`,
          }}
        >
          <RuleIcon />
        </div>
      </div>
    </div>
  );
};

export default ConditionBuilder;
