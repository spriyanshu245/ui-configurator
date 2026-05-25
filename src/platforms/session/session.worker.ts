import { WorkerEventType, SessionState } from "./enums";
let inactivityTimer: ReturnType<typeof setTimeout> | undefined = undefined;
let refreshInterval: ReturnType<typeof setInterval> | undefined = undefined;

self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case WorkerEventType.START_INACTIVITY:
    case WorkerEventType.RESET_INACTIVITY:
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        self.postMessage({ type: SessionState.INACTIVE });
      }, payload);

      break;

    case WorkerEventType.START_REFRESH:
      clearInterval(refreshInterval);
      refreshInterval = setInterval(() => {
        self.postMessage({ type: SessionState.REFRESH });
      }, payload);
      break;

    case WorkerEventType.STOP_REFRESH:
      clearInterval(refreshInterval);
      break;

    case WorkerEventType.DESTROY:
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      clearInterval(refreshInterval);
      break;
  }
};
