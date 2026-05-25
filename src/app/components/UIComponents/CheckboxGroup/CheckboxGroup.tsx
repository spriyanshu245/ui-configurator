"use client";
import { CheckboxGroupComponent } from "@/app/types/types";
import styles from "./CheckboxGroup.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface CheckboxGroupProps {
  component: CheckboxGroupComponent;
}

export default function CheckboxGroup({
  component,
}: Readonly<CheckboxGroupProps>) {
  const options =
    component.properties?.showSingleOption
      ? [
          {
            value: component.properties?.option ?? "",
            label: component.properties?.option ?? "",
          },
        ]
      : component.properties?.options || [];

  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {component.properties?.label && (
        <label htmlFor={component.name} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}

      {options?.map(
        (option: { value: string; label: string }) => (
          <div key={option.value} className={styles.checkbox}>
            <label>
              <input
                type="checkbox"
                name={component.name}
                value={option.value}
                disabled={true}
              />
              {option.label}
            </label>
          </div>
        )
      )}
    </div>
  );
}
