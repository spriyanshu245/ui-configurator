import { TimeInputComponent } from "@/app/types/types";
import React from "react";
import styles from "./TimeInput.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

type TimeInputProps = {
    component: TimeInputComponent
}

const TimeInput = ({ component }: Readonly<TimeInputProps>) => {
  return (
    <div
      id={component.id}
      className={sharedStyles.formGroup}
    >
      {component.properties.label && component.properties.showLabel && (
        <label htmlFor={`${component.id}-nested-timePicker`} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
    <div
      className={`${styles.timePicker}`}
      id={`${component.id}-nested-timePicker`}
    >
      <div
        className={styles.timePicker__input}
        data-placeholder="hh"
        aria-placeholder="hh"
        data-testid="hh"
        aria-label="Hours"
      />
      <span className={styles.timePicker__separator}>:</span>
      <div
        className={styles.timePicker__input}
        data-placeholder="mm"
        aria-placeholder="mm"
        data-testid="mm"
        aria-label="Minutes"
      />
      <button
        type="button"
        className={styles.ampmToggle}
        aria-label="AM/PM"
        tabIndex={0}
      >
        PM
      </button>
    </div>
    </div>
  )
};

export default TimeInput;
