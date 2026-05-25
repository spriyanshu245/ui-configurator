"use client";
import { TextAreaComponent } from "@/app/types/types";
import styles from "./TextArea.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface TextAreaProps {
  component: TextAreaComponent;
}

export default function WebTextArea({ component }: Readonly<TextAreaProps>) {
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
      <div className={styles.textAreaContainer}>
        <textarea
          name={component.id}
          id={component.id}
          placeholder={component.properties.placeholder}
          className={styles.textArea}
          rows={component.properties.rowCount ?? 3}
          disabled
        />
      </div>
    </div>
  );
}
