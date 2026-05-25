import { ChangeEvent } from "react";
import styles from "../../PropertiesPanel.module.scss";
import { PropertyInputProps } from "@/app/template-designer/types";
import { unitSuffixProperties } from "@/app/template-designer/data/blockPropertiesMap";
import { formatPropertyKey } from "../../utils/propertiesPanelUtils";

const PropertyInput = ({
  propertyKey,
  value,
  onChange,
}: PropertyInputProps) => {
  if (Array.isArray(value)) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (typeof value === "boolean") {
      onChange(propertyKey, target.checked);
    } else if (typeof value === "number") {
      onChange(propertyKey, Number(target.value));
    } else {
      onChange(propertyKey, target.value);
    }
  };

  const handleNumericChange = (e: ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replaceAll(/\D/g, "");
    onChange(propertyKey, `${numericValue}px`);
  };

  const inputId = `prop-${propertyKey}`;

  if (typeof value === "boolean") {
    return (
      <div className={styles.propertyRow}>
        <label className={styles.propertyLabel} htmlFor={inputId}>
          {formatPropertyKey(propertyKey)}
        </label>
        <input
          id={inputId}
          type="checkbox"
          className={styles.checkbox}
          checked={value}
          onChange={handleChange}
        />
      </div>
    );
  }

  if (
    unitSuffixProperties.has(propertyKey as never) &&
    typeof value === "string"
  ) {
    const numericValue = String(value).replaceAll(/\D/g, "");
    return (
      <div className={styles.propertyRow}>
        <label className={styles.propertyLabel} htmlFor={inputId}>
          {formatPropertyKey(propertyKey)}
        </label>
        <div className={styles.propertyInputWithSuffix}>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            className={styles.suffixInput}
            value={numericValue}
            onChange={handleNumericChange}
          />
          <span className={styles.suffix}>px</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.propertyRow}>
      <label className={styles.propertyLabel} htmlFor={inputId}>
        {formatPropertyKey(propertyKey)}
      </label>
      <input
        id={inputId}
        type={typeof value === "number" ? "number" : "text"}
        className={styles.propertyInput}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default PropertyInput;
