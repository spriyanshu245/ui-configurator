import { OperationProgress as OperationProgressState } from "@/app/utils/micrositeOrchestration";
import styles from "./OperationProgress.module.scss";

interface OperationProgressProps {
  progress: OperationProgressState;
}

const OperationProgress = ({ progress }: OperationProgressProps) => {
  const normalizedTotal = Math.max(progress.total, 1);
  const normalizedValue = Math.min(Math.max(progress.current, 0), normalizedTotal);

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressHeader}>
        <p className={styles.progressLabel}>{progress.label}</p>
      </div>
      <progress
        className={styles.progressTrack}
        value={normalizedValue}
        max={normalizedTotal}
      />
      {progress.detail && (
        <p className={styles.progressDetail}>{progress.detail}</p>
      )}
    </div>
  );
};

export default OperationProgress;
