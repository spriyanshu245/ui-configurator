import React, { InputHTMLAttributes } from "react";
import styles from "./Input.module.scss";
import InputIcon from "./InputIcon";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, className, ...props }) => {
  return (
    <>
      {label && (
        <label className={styles.label} htmlFor={props.name}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <div data-testid="icon-svg" className={styles.iconWrapper}>
          <InputIcon icon={icon} />
        </div>
        <input {...props} className={`${styles.input} ${className ?? ""}`} />
      </div>
    </>
  );
};

export default Input;
