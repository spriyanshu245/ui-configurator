"use client";
import { RadioGroupComponent } from "@/app/types/types";
import styles from "./RadioGroup.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface RadioGroupProps {
  component: RadioGroupComponent;
}

export default function RadioGroup({ component }: Readonly<RadioGroupProps>) {
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {component.properties?.label && component?.properties?.showLabel && (
        <label htmlFor={component.name} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div className={styles.radioGroupContainer}>
        {component.properties?.options?.map(
          (option: { value: string; label: string }) => (
            <div key={option.value} className={styles.radio}>
              <label>
                <input
                  type="radio"
                  name={component.name}
                  value={option.value}
                  required={component.validations?.some(
                    (v) => v.type === "required"
                  )}
                  disabled={true}
                />
                {option.label}
              </label>
            </div>
          )
        )}
      </div>
    </div>
  );
}
