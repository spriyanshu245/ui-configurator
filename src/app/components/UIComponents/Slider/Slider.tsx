"use client";
import styles from "./Slider.module.scss";

type SliderProps = {
  id: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
  valueSuffix?: string;
};

export default function Slider({
  id,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  disabled = false,
  valueSuffix,
}: Readonly<SliderProps>) {
  return (
    <div className={styles.sliderContainer}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.sliderWrapper}>
        <input
          id={id}
          data-testid={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={styles.slider}
        />
        <div className={styles.sliderInput}>
          <input
            data-testid="sliderInput"
            type="number"
            value={value}
            onChange={(e) => {
              if (Number(e.target.value) <= max)
                onChange(Number(e.target.value));
            }}
            disabled={disabled}
            className={styles.input}
            min={min}
            max={max}
          />
          {valueSuffix && (
            <span className={styles.valueSuffix}>{valueSuffix}</span>
          )}
        </div>
      </div>
    </div>
  );
}
