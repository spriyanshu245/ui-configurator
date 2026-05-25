"use client";
import { InputComponent } from "@/app/types/types";
import styles from "./DatePicker.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import { useState } from "react";

interface DatePickerProps {
  component: InputComponent;
}

const DatePicker = ({ component }: DatePickerProps) => {
  const [date, setDate] = useState("");

  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {component.properties.label && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <input
        name={component.id}
        id={component.id}
        type="text"
        value={date}
        placeholder={component.properties.placeholder}
        maxLength={10}
        className={styles.input}
        disabled={true}
      />
    </div>
  );
};

export default DatePicker;
