import OperationProgress from "@/app/components/OperationProgress/OperationProgress";
import { OperationProgress as OperationProgressState } from "@/app/utils/micrositeOrchestration";
import styles from "./OperationProgressModal.module.scss";

interface OperationProgressModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  progress: OperationProgressState | null;
}

const OperationProgressModal = ({
  isOpen,
  title,
  description,
  progress,
}: OperationProgressModalProps) => {
  if (!isOpen || !progress) {
    return null;
  }

  return (
    <div className={styles.overlay} data-testid="operation-progress-modal">
      <div className={styles.modal}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        <OperationProgress progress={progress} />
      </div>
    </div>
  );
};

export default OperationProgressModal;
