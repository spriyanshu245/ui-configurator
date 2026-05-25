"use client";
import { ContactComponent } from "../../../types/types";
import styles from "./Contact.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import Image from "next/image";
import { DefaultInputIconSize } from "../../../utils/constants";

interface ContactProps {
  component: ContactComponent;
}

const Contact = ({ component }: Readonly<ContactProps>) => {
  const { iconUrl, iconSize, iconPosition, iconSpacing } =
    component.properties ?? {};

  const isValidIconSrc = iconUrl && iconUrl.trim() !== "";
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {component.properties?.label && component.properties?.showLabel && (
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
              className={styles.contactIcon}
            />
          </div>
        )}
        <input
          type={component.properties?.inputType}
          name={component.id}
          id={component.id}
          placeholder={component.properties?.placeholder}
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
              className={styles.contactIcon}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
