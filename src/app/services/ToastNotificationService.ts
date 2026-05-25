export interface ToastData {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  autoClose?: boolean;
  duration?: number;
  visible?: boolean;
}

type ToastCallback = (toastData: ToastData) => void;

let subscribers: ToastCallback[] = [];

const subscribe = (callback: ToastCallback): (() => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};

const show = (toastData: ToastData): void => {
  subscribers.forEach((callback) => callback(toastData));
};

const ToastNotificationService = {
  subscribe,
  show,
};

export default ToastNotificationService;
