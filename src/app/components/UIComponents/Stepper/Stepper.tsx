import { StepperComponent } from "@/app/types/types";
import styles from "./Stepper.module.scss";

interface StepperProps {
  readonly component: StepperComponent;
}

const PREVIEW_STEPS = [
  { label: "Step 1", state: "completed" },
  { label: "Step 2", state: "current" },
  { label: "Step 3", state: "wait" },
];

const ICON_CLASS: Record<string, string> = {
  wait: styles.icon_wait,
  current: styles.icon_current,
  completed: styles.icon_completed,
};

const LABEL_CLASS: Record<string, string> = {
  wait: styles.label_wait,
  current: styles.label_current,
  completed: styles.label_completed,
};

const Stepper = ({ component }: StepperProps) => (
  <div className={styles.stepper} id={component.id}>
    {PREVIEW_STEPS.map((step, index) => {
      const isLast = index === PREVIEW_STEPS.length - 1;
      return (
        <div key={step.label} className={styles.step}>
          <div className={styles.iconColumn}>
            <div className={`${styles.iconWrapper} ${ICON_CLASS[step.state]}`}>
              {step.state === "completed" && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10.5L8.5 14L15 7"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {step.state === "current" && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 6V11.333L14 14"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {step.state === "wait" && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 10.5L8.5 13L14 7"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            {!isLast && (
              <div
                className={`${styles.connector} ${step.state === "completed" ? styles.connectorCompleted : ""}`}
              />
            )}
          </div>
          <div
            className={`${styles.content} ${isLast ? styles.contentLast : ""}`}
          >
            <p className={`${styles.label} ${LABEL_CLASS[step.state]}`}>
              {step.label}
            </p>
            <p className={styles.desc}>Configure via properties panel</p>
          </div>
        </div>
      );
    })}
  </div>
);

export default Stepper;
