"use client";
import { ButtonV2Component } from "@/app/types/types";
import styles from "./ButtonV2.module.scss";
import Image from "next/image";
import {
  DefaultButtonIconPosition,
  DefaultButtonIconSize,
  DefaultButtonIconSpacing,
} from "@/app/utils/constants";

interface ButtonProps {
  readonly component: ButtonV2Component;
}

const ButtonV2 = ({ component }: ButtonProps) => {
  const {
    label,
    showLabel,
    iconUrl,
    iconSize,
    iconPosition,
    iconSpacing,
    buttonSize,
  } = component.properties;
  const buttonType = "button";
  const isValidIconSrc = iconUrl && iconUrl.trim() !== "";
  const buttonIconPosition = iconPosition ?? DefaultButtonIconPosition;
  const buttonIconSize = iconSize ?? DefaultButtonIconSize;
  const buttonIconSpacing =
    showLabel && iconSpacing ? iconSpacing : DefaultButtonIconSpacing;

  const buttonIconStyles = {
    width: buttonIconSize,
    height: "auto",
    marginRight: buttonIconPosition === "left" ? `${buttonIconSpacing}px` : "0",
    marginLeft: buttonIconPosition === "right" ? `${buttonIconSpacing}px` : "0",
    marginBottom:
      buttonIconPosition === "above" ? `${buttonIconSpacing}px` : "0",
  };

  const buttonSizeClassMap: { [key: string]: string } = {
    S: styles.sizeS,
    M: styles.sizeM,
    L: styles.sizeL,
  };
  const activeSizeClass = buttonSizeClassMap[buttonSize ?? "S"] ?? styles.sizeS;

  return (
    <div id={component.id} className={styles.buttonContainer}>
      <button
        className={`${styles.button} ${activeSizeClass} ${
          buttonIconPosition == "above" && styles.iconAbove
        }`}
        type={buttonType}
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        {showLabel && iconPosition === "right" && (
          <span data-testid="right-button">{label || "Button"}</span>
        )}
        {isValidIconSrc && (
          <Image
            src={iconUrl}
            alt="Img"
            style={buttonIconStyles}
            width={iconSize ?? DefaultButtonIconSize}
            height={iconSize ?? DefaultButtonIconSize}
          />
        )}
        {showLabel &&
          (!iconPosition ||
            iconPosition === "left" ||
            iconPosition === "above") && (
            <span data-testid="left-button">{label || "Button"}</span>
          )}
      </button>
    </div>
  );
};

export default ButtonV2;
