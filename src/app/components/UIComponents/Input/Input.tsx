"use client";
import { InputComponent } from "@/app/types/types";
import styles from "./Input.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import Image from "next/image";
import { DefaultInputIconSize } from "@/app/utils/constants";
interface InputProps {
  component: InputComponent;
}

export default function Input({ component }: Readonly<InputProps>) {
  const { iconUrl, iconSize, iconPosition, iconSpacing } =
    component.properties ?? {};

  const isValidIconSrc = iconUrl && iconUrl.trim() !== "";

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
        {iconPosition === "left" && isValidIconSrc && (
          <div
            className={styles.iconContainer}
            style={{
              marginRight: `${iconSpacing}px`,
            }}
          >
            <Image
              src={iconUrl}
              alt="Img"
              width={iconSize ?? DefaultInputIconSize}
              height={iconSize ?? DefaultInputIconSize}
              className={styles.inputIcon}
            />
          </div>
        )}
        <input
          type={component.properties.inputType}
          name={component.id}
          id={component.id}
          placeholder={component.properties.placeholder}
          className={styles.input}
          disabled
        />
        {iconPosition === "right" && isValidIconSrc && (
          <div
            className={styles.iconContainer}
            style={{
              marginLeft: `${iconSpacing}px`,
            }}
          >
            <Image
              src={iconUrl}
              alt="Img"
              width={iconSize ?? DefaultInputIconSize}
              height={iconSize ?? DefaultInputIconSize}
              className={styles.inputIcon}
            />
          </div>
        )}
      </div>
    </div>
  );
}
