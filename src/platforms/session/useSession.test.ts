import { renderHook } from "@testing-library/react";
import { useSession } from "./useSession";
import { SessionState } from "./enums";
import type { SessionManagerState } from "./session.types";

jest.mock("./SessionManagerService", () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn((cb: () => void) => {
      cb();
      return jest.fn();
    }),
    getSnapshot: jest.fn(),
    handleLogout: jest.fn(),
  },
}));

import sessionManager from "./SessionManagerService";

describe("useSession", () => {
  const baseSnapshot: SessionManagerState = {
    state: SessionState.ACTIVE,
    lastActivityTime: 0,
    tokenLastRefreshed: 0,
    isRefreshing: false,
    userDetails: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sessionManager.getSnapshot as jest.Mock).mockReturnValue({
      ...baseSnapshot,
    });
  });

  it("returns session state from sessionManager", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.state).toBe(SessionState.ACTIVE);
  });

  it("returns isActive true when state is ACTIVE", () => {
    (sessionManager.getSnapshot as jest.Mock).mockReturnValue({
      ...baseSnapshot,
      state: SessionState.ACTIVE,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isActive).toBe(true);
    expect(result.current.isInactive).toBe(false);
  });

  it("returns isInactive true when state is INACTIVE", () => {
    (sessionManager.getSnapshot as jest.Mock).mockReturnValue({
      ...baseSnapshot,
      state: SessionState.INACTIVE,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isInactive).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("exposes handleLogout as logout", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.logout).toBe(sessionManager.handleLogout);
  });

  it("spreads session snapshot properties into return value", () => {
    const userDetails = { userId: "u1", username: "test" };
    (sessionManager.getSnapshot as jest.Mock).mockReturnValue({
      ...baseSnapshot,
      userDetails,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.userDetails).toEqual(userDetails);
  });
});
