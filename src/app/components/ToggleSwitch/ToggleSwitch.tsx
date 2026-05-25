"use client";

import { ChangeEvent } from "react";
import styles from "../../components/ToggleSwitch/ToggleSwitch.module.scss";
import sharedStyles from "../../styles/shared.module.scss";
import { ToggleButtonComponent } from "@/app/types/types";

type ToggleProps = {
  id?: string;
  size?: "small" | "medium" | "large";
  label?: string;
  isToggled?: boolean;
  onToggle?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  component?: ToggleButtonComponent;
};

const ToggleSwitch = ({
  id,
  size = "medium",
  label,
  isToggled,
  onToggle,
  disabled,
  component,
}: ToggleProps) => {
  const componentProps = component?.properties || {};

  const finalId = id ?? componentProps.id;
  const finalIsToggled = isToggled ?? componentProps.isToggled;
  const finalDisabled = disabled ?? componentProps.disabled;
    
  const directLabelProvided = label !== undefined;
  const componentLabelProvided = componentProps.label !== undefined;
  const shouldShowComponentLabel = componentProps.showLabel === true;
  
  let displayLabel = null;
  if (directLabelProvided) {
    displayLabel = label;
  } else if (componentLabelProvided && shouldShowComponentLabel) {
    displayLabel = componentProps.label;
  }

  const switchSizeClass =
    size === "small"
      ? styles.switchSmall
      : size === "medium"
      ? styles.switchMedium
      : styles.switch;

  return (
    <div
      className={`${sharedStyles.formGroup || ""} ${styles.formGroup || ""}`}
    >
      <div className={styles.toggleSwitchContainer}>
        <label className={switchSizeClass}>
          <input
            id={finalId}
            data-testid={finalId}
            type="checkbox"
            role="switch"
            checked={finalIsToggled}
            onChange={onToggle}
            disabled={finalDisabled}
            aria-label={displayLabel ?? "toggle switch"}
          />
          <span className={styles.slider}></span>
        </label>
        
        {displayLabel && (
          <span className={styles.label}>{displayLabel}</span>
        )}
      </div>
    </div>
  );
};

export default ToggleSwitch;