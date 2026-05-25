"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./ToastNotification.module.scss";
import ToastNotificationService, {
  ToastData,
} from "../../services/ToastNotificationService";
import CloseIcon from "../SVGIcons/Close";

const ToastNotification = () => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [progress, setProgress] = useState<number>(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const unsubscribe = ToastNotificationService.subscribe(
      (toastData: ToastData) => {
        clearTimers();
        setToast({ ...toastData, visible: true });
        setProgress(100);

        if (toastData.autoClose !== false) {
          const duration = toastData.duration ?? 5000;
          const startTime = Date.now();

          timerRef.current = setTimeout(() => {
            setToast(null);
          }, duration);

          intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const percentage = Math.max(100 - (elapsed / duration) * 100, 0);
            setProgress(percentage);
          }, 50);
        }
      },
    );

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, []);

  const handleClose = () => {
    clearTimers();
    setToast(null);
  };

  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type ?? "info"]}`}>
      <div className={styles.content}>{toast.message}</div>
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
      <button className={styles.closeButton} onClick={handleClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default ToastNotification;
