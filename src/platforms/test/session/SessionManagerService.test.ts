import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import sessionManager from "../../session/SessionManagerService";
import { SessionState, WorkerEventType } from "../../session/enums";
import { SESSION_CONSTANTS } from "../../session/session.constants";

// --- Mocks ---

jest.mock("../../../app/utils/utils", () => ({
  getApiBaseUrl: jest.fn(() => "https://api.test.com"),
}));

// Mock the Worker global
class MockWorker {
  onmessage: (event: any) => void = () => {};
  postMessage = jest.fn();
  terminate = jest.fn();
  constructor(public url: string) {}
}

(global as any).Worker = MockWorker;

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe("SessionManagerService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // 1. Fully reset the Singleton state
    sessionManager.destroy();

    // 2. Reset private bootstrap flag
    (sessionManager as any).hasBootstrapped = false;

    // 3. Reset the state object entirely (avoids "read-only" mutation errors)
    // We provide a fresh object that isn't frozen yet
    (sessionManager as any).state = {
      state: SessionState.INITIAL,
      lastActivityTime: Date.now(),
      tokenLastRefreshed: 0,
      isRefreshing: false,
      userDetails: null,
    };

    // Update the snapshot to match the fresh state
    (sessionManager as any).emit();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Singleton and State", () => {
    it("should initialize with INITIAL state", () => {
      const snapshot = sessionManager.getSnapshot();
      expect(snapshot.state).toBe(SessionState.INITIAL);
      expect(snapshot.userDetails).toBeNull();
    });

    it("should notify subscribers when state changes", () => {
      const callback = jest.fn();
      sessionManager.subscribe(callback);

      // Callback called once on subscription
      expect(callback).toHaveBeenCalledTimes(1);

      sessionManager.restore({ userId: "123" } as any);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("Worker Integration", () => {
    it("should create worker and start timers on restore", () => {
      // Ensure we are starting fresh
      expect((sessionManager as any).hasBootstrapped).toBe(false);

      sessionManager.restore({ userId: "123" } as any);

      const worker = (sessionManager as any).worker;
      expect(worker).toBeDefined(); // This will now pass
      expect(worker.postMessage).toHaveBeenCalled();
    });

    it("should handle INACTIVE message from worker", () => {
      sessionManager.onLogin({ userId: "123" } as any);
      const worker = (sessionManager as any).worker;

      // Simulate worker sending INACTIVE
      worker.onmessage({ data: { type: WorkerEventType.INACTIVE } });

      expect(sessionManager.getSnapshot().state).toBe(SessionState.INACTIVE);
    });
  });

  describe("Activity Tracking", () => {
    it("should reset inactivity timer on activity if state is ACTIVE", async () => {
      sessionManager.onLogin({ userId: "123" } as any);
      const worker = (sessionManager as any).worker;

      await sessionManager.notifyActivity();

      expect(worker.postMessage).toHaveBeenCalledWith({
        type: WorkerEventType.RESET_INACTIVITY,
        payload: SESSION_CONSTANTS.INACTIVITY_TIMEOUT_MS,
      });
    });

    it("should resume session on activity if state is INACTIVE", async () => {
      // Setup: Become inactive
      sessionManager.onLogin({ userId: "123" } as any);
      (sessionManager as any).becomeInactive();

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await sessionManager.notifyActivity();

      expect(result).toBe(true);
      expect(sessionManager.getSnapshot().state).toBe(SessionState.ACTIVE);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Token Refresh & Mutex", () => {
    it("should only allow one refresh at a time (Mutex)", async () => {
      // 2. Ensure the time-guard doesn't block the fetch
      (sessionManager as any).state.tokenLastRefreshed = 0;

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
      );

      const p1 = sessionManager.refreshToken();
      const p2 = sessionManager.refreshToken();

      expect(p1).toStrictEqual(p2);

      // Move timers to trigger the fetch resolution
      jest.advanceTimersByTime(100);
      await p1;

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    it("should not refresh if last refresh was within MIN_REFRESH_INTERVAL", async () => {
      sessionManager.restore({ userId: "123" } as any);

      // Manually set last refresh to now
      (sessionManager as any).setState({ tokenLastRefreshed: Date.now() });

      const result = await sessionManager.refreshToken();

      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Logout", () => {
    it("should clear storage and dispatch event on logout", async () => {
      const storageSpy = jest.spyOn(Storage.prototype, "clear");
      const dispatchSpy = jest.spyOn(window, "dispatchEvent");

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await sessionManager.handleLogout();

      expect(storageSpy).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "session-logout" })
      );
      expect(sessionManager.getSnapshot().state).toBe(SessionState.LOGGED_OUT);
      expect((sessionManager as any).worker).toBeUndefined();
    });
  });
});
