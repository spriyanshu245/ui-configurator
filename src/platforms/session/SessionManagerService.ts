import { SessionState, WorkerEventType } from "./enums";
import { SessionManagerState, UserDetails } from "./session.types";
import { SESSION_CONSTANTS } from "./session.constants";
import { getApiBaseUrl } from "@/app/utils/utils";

class SessionManagerService {
  private static instance: SessionManagerService;

  private state: SessionManagerState = {
    state: SessionState.INITIAL,
    lastActivityTime: Date.now(),
    tokenLastRefreshed: 0,
    isRefreshing: false,
    userDetails: null,
  };

  private snapshot: SessionManagerState = Object.freeze({ ...this.state });

  private subscribers = new Set<() => void>();
  private worker?: Worker;

  private refreshMutex: Promise<boolean> | null = null;
  private logoutMutex: Promise<void> | null = null;

  private hasBootstrapped = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new SessionManagerService();
    }
    return this.instance;
  }

  private emit() {
    this.snapshot = Object.freeze({ ...this.state });
    this.subscribers.forEach((cb) => cb());
  }

  private setState(partial: Partial<SessionManagerState>) {
    this.state = Object.freeze({
      ...this.state,
      ...partial,
    });

    this.emit();
  }

  getSnapshot = (): SessionManagerState => this.snapshot;

  subscribe = (cb: () => void) => {
    this.subscribers.add(cb);
    cb();

    return () => {
      this.subscribers.delete(cb);
    };
  };

  private createWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL("./session.worker.ts", import.meta.url));
    this.worker.onmessage = this.handleWorkerMessage;
  }

  private startTimers() {
    if (!this.worker) return;
    this.worker.postMessage({
      type: WorkerEventType.START_INACTIVITY,
      payload: SESSION_CONSTANTS.INACTIVITY_TIMEOUT_MS,
    });

    this.worker.postMessage({
      type: WorkerEventType.START_REFRESH,
      payload: SESSION_CONSTANTS.TOKEN_REFRESH_INTERVAL_MS,
    });
  }

  private stopTimers() {
    this.worker?.postMessage({
      type: WorkerEventType.STOP_REFRESH,
    });
  }

  notifyActivity = async (): Promise<boolean> => {
    this.setState({ lastActivityTime: Date.now()});

    if (this.state.state === SessionState.INACTIVE) {
      return this.resumeSession();
    }

    if (this.state.state === SessionState.ACTIVE) {
      this.worker?.postMessage({
        type: WorkerEventType.RESET_INACTIVITY,
        payload: SESSION_CONSTANTS.INACTIVITY_TIMEOUT_MS,
      });
    }

    return true;
  };

  private handleWorkerMessage = async (event: MessageEvent) => {
    const { type } = event.data;

    if (type === WorkerEventType.INACTIVE) {
      this.becomeInactive();
    }

    if (type === WorkerEventType.REFRESH) {
      if (this.state.state === SessionState.ACTIVE) {
        await this.refreshToken();
      }
    }
  };

  private becomeInactive() {
    if (this.state.state !== SessionState.ACTIVE) return;

    this.stopTimers();
    this.setState({
      state: SessionState.INACTIVE,
    });
  }

  private async resumeSession(): Promise<boolean> {
    const success = await this.refreshToken();

    if (!success) {
      await this.handleLogout();
      return false;
    }

    this.createWorker();
    this.startTimers();
    this.setState({
      state: SessionState.ACTIVE,
      lastActivityTime: Date.now(),
    });

    return true;
  }

  refreshToken = async (): Promise<boolean> => {
    if (
      this.state.tokenLastRefreshed &&
      Date.now() - this.state.tokenLastRefreshed <
        SESSION_CONSTANTS.MIN_REFRESH_INTERVAL
    ) {
      return true;
    }

    if (this.state.state === SessionState.LOGGED_OUT) {
      return false;
    }

    if (this.refreshMutex) return this.refreshMutex;

    this.refreshMutex = (async () => {
      try {
        this.setState({ isRefreshing: true });

        const API_BASE_URL = getApiBaseUrl();

        const res = await fetch(
          `${API_BASE_URL}${SESSION_CONSTANTS.TOKEN_REFRESH_ENDPOINT}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "X-User-Type": "employee",
            },
          }
        );

        if (!res.ok) return false;

        this.setState({
          tokenLastRefreshed: Date.now(),
        });

        return true;
      } catch {
        return false;
      } finally {
        this.refreshMutex = null;
        this.setState({ isRefreshing: false });
      }
    })();

    return this.refreshMutex;
  };

  waitForOngoingRefresh = async () => {
    if (this.refreshMutex) {
      try {
        await this.refreshMutex;
      } catch {}
    }
  };

  handle401 = async () => {
    await this.handleLogout();
  };

  onLogin = (userDetails: UserDetails) => {
    this.createWorker();
    this.startTimers();
    this.logoutMutex = null;
    this.setState({
      userDetails,
      state: SessionState.ACTIVE,
      lastActivityTime: Date.now(),
    });
  };

  restore = (user: UserDetails) => {
    if (this.hasBootstrapped) return;

    this.hasBootstrapped = true;

    this.createWorker();
    this.startTimers();

    this.setState({
      userDetails: user,
      state: SessionState.ACTIVE,
    });
  };

  handleLogout = async () => {
    if (this.logoutMutex) return this.logoutMutex;

    const API_BASE_URL = getApiBaseUrl();
    const userDetails = JSON.parse(
      sessionStorage.getItem("global.login.userDetails") ?? "{}"
    );
    this.logoutMutex = (async () => {
      try {
        await fetch(`${API_BASE_URL}${SESSION_CONSTANTS.LOGOUT_ENDPOINT}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "X-User-Type": "employee",
            "X-User-Id": userDetails?.userId,
          },
        });
      } catch {}

      this.worker?.terminate();
      this.worker = undefined;

      this.refreshMutex = null;
      this.hasBootstrapped = false;

      sessionStorage.clear();
      localStorage.clear();

      this.setState({
        state: SessionState.LOGGED_OUT,
        userDetails: null,
        isRefreshing: false,
      });

      window.dispatchEvent(new Event("session-logout"));
    })();

    return this.logoutMutex;
  };

  destroy() {
    this.worker?.terminate();
    this.worker = undefined;

    this.subscribers.clear();

    this.refreshMutex = null;
    this.logoutMutex = null;
  }
}

const sessionManager = SessionManagerService.getInstance();
export default sessionManager;
