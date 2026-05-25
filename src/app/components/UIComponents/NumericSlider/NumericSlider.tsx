"use client";
import { FormInputComponent } from "@/app/types/types";
import styles from "./NumericSlider.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";

interface NumericSliderProps {
  readonly component: FormInputComponent;
}

export default function NumericSlider({ component }: NumericSliderProps) {
  const { properties } = component;
  const min = properties.sliderMin ?? "0";
  const max = properties.sliderMax ?? "100";
  const prefix = properties.sliderPrefixText ?? "";
  const suffix = properties.sliderSuffixText ?? "";
  const valuePosition = properties.sliderValuePosition ?? "top";
  const valueAlignment = properties.sliderValueAlignment ?? "center";
  const fontSize = properties.sliderValueFontSize ?? 24;
  const fontWeight = properties.sliderValueFontWeight ?? "600";
  const valueGap = properties.sliderValueGap ?? 8;

  const defaultVal = properties.defaultValue ?? min;
  const displayParts: string[] = [];
  if (prefix) displayParts.push(prefix);
  displayParts.push(String(defaultVal));
  if (suffix) displayParts.push(suffix);
  const displayValue = displayParts.join(" ");

  const alignmentMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight,
    justifyContent: alignmentMap[valueAlignment] ?? "center",
  };

  const gapStyle: React.CSSProperties =
    valuePosition === "top"
      ? { marginBottom: `${valueGap}px` }
      : { marginTop: `${valueGap}px` };

  const renderValue = () => (
    <div
      className={styles.selectedValue}
      style={{ ...valueStyle, ...gapStyle }}
    >
      {displayValue}
    </div>
  );

  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.numericSlider}`}
      key={component.id}
    >
      {properties.label && properties.showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {properties.label}
        </label>
      )}

      {valuePosition === "top" && renderValue()}

      <div className={styles.trackContainer}>
        <div className={styles.trackFill} />
        <input
          type="range"
          className={styles.rangeInput}
          disabled
          min={0}
          max={100}
          value={40}
          readOnly
        />
      </div>

      {valuePosition === "bottom" && renderValue()}

      <div className={styles.rangeLabels}>
        <span>{prefix ? `${prefix} ${min}` : min}</span>
        <span>{suffix ? `${max} ${suffix}` : max}</span>
      </div>
    </div>
  );
}
