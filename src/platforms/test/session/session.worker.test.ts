import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { WorkerEventType, SessionState } from "../../session/enums";

const workerScope = global as any;

if (!workerScope.postMessage) {
  workerScope.postMessage = jest.fn();
}

require("../../session/session.worker");

describe("Session Worker", () => {
  let postMessageSpy: any;

  beforeEach(() => {
    jest.useFakeTimers();

    workerScope.postMessage = jest.fn();
    postMessageSpy = workerScope.postMessage;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

 
  const triggerWorkerMessage = (type: WorkerEventType, payload?: number) => {
    const handler = workerScope.onmessage;
    if (handler) {
      handler({ data: { type, payload } } as MessageEvent);
    } else {
      throw new Error(
        "Worker onmessage handler not found. Did the worker file load?"
      );
    }
  };

  describe("Inactivity Timer", () => {
    it("should start timer and post INACTIVE event after payload delay", () => {
      const delay = 5000;
      triggerWorkerMessage(WorkerEventType.START_INACTIVITY, delay);

      expect(postMessageSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(delay);

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith({
        type: SessionState.INACTIVE,
      });
    });

    it("should reset the timer if START_INACTIVITY is called again", () => {
      const delay = 5000;
      triggerWorkerMessage(WorkerEventType.START_INACTIVITY, delay);

      jest.advanceTimersByTime(2500);

      triggerWorkerMessage(WorkerEventType.START_INACTIVITY, delay);

      jest.advanceTimersByTime(2500);

      expect(postMessageSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2500);

      expect(postMessageSpy).toHaveBeenCalledWith({
        type: SessionState.INACTIVE,
      });
    });

    it("should reset the timer on RESET_INACTIVITY", () => {
      const delay = 3000;
      triggerWorkerMessage(WorkerEventType.START_INACTIVITY, delay);

      jest.advanceTimersByTime(1000);

      triggerWorkerMessage(WorkerEventType.RESET_INACTIVITY, delay);

      jest.advanceTimersByTime(2000);
      expect(postMessageSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(postMessageSpy).toHaveBeenCalledWith({
        type: SessionState.INACTIVE,
      });
    });
  });

  describe("Refresh Interval", () => {
    it("should start an interval and post REFRESH repeatedly", () => {
      const interval = 1000;
      triggerWorkerMessage(WorkerEventType.START_REFRESH, interval);

      expect(postMessageSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(interval);
      expect(postMessageSpy).toHaveBeenLastCalledWith({
        type: SessionState.REFRESH,
      });
      expect(postMessageSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(interval);
      expect(postMessageSpy).toHaveBeenCalledTimes(2);
    });

    it("should clear and restart interval if START_REFRESH is called again", () => {
      const interval = 1000;
      triggerWorkerMessage(WorkerEventType.START_REFRESH, interval);

      jest.advanceTimersByTime(interval);
      expect(postMessageSpy).toHaveBeenCalledTimes(1);

      triggerWorkerMessage(WorkerEventType.START_REFRESH, interval);

      jest.advanceTimersByTime(interval);

      expect(postMessageSpy).toHaveBeenCalledTimes(2);
    });

    it("should stop the interval on STOP_REFRESH", () => {
      const interval = 1000;
      triggerWorkerMessage(WorkerEventType.START_REFRESH, interval);

      jest.advanceTimersByTime(interval);
      expect(postMessageSpy).toHaveBeenCalledTimes(1);

      triggerWorkerMessage(WorkerEventType.STOP_REFRESH);

      jest.advanceTimersByTime(interval * 10);

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Destroy", () => {
    it("should clear all timers and intervals", () => {
      triggerWorkerMessage(WorkerEventType.START_INACTIVITY, 1000);
      triggerWorkerMessage(WorkerEventType.START_REFRESH, 1000);

      triggerWorkerMessage(WorkerEventType.DESTROY);

      jest.advanceTimersByTime(5000);

      expect(postMessageSpy).not.toHaveBeenCalled();
    });
  });
});
