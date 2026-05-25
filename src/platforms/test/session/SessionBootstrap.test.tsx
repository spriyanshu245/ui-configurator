import { render, waitFor } from "@testing-library/react";
import SessionBootstrap from "./../../session/SessionBootstrap";
import sessionManager from "../../session/SessionManagerService";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "../../../app/utils/utils";
import { SESSION_CONSTANTS } from "../../session/session.constants";

// --- Mocks ---

// 1. Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "pathname"),
}));

// 2. Mock Session Manager Service
jest.mock("../../session/SessionManagerService", () => ({
  restore: jest.fn(),
  handleLogout: jest.fn(),
  notifyActivity: jest.fn(),
}));

// 3. Mock Utils
jest.mock("@/app/utils/utils", () => ({
  getApiBaseUrl: jest.fn(),
}));

// 4. Mock Global Fetch
global.fetch = jest.fn() as jest.Mock;

describe("SessionBootstrap", () => {
  const mockRouter = { replace: jest.fn() };
  const mockApiUrl = "https://api.test.com";

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Router Mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default API URL Mock
    (getApiBaseUrl as jest.Mock).mockReturnValue(mockApiUrl);
  });

  describe("Boot Logic (useEffect)", () => {
    it("should restore session when API call is successful", async () => {
      const mockUser = { id: 1, name: "Test User" };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      render(<SessionBootstrap />);

      // Verify fetch was called correctly
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${mockApiUrl}${SESSION_CONSTANTS.TOKEN_REFRESH_ENDPOINT}`,
          expect.objectContaining({
            method: "POST",
            headers: { "x-user-type": "employee" },
          })
        );
      });

      // Verify session restoration
      await waitFor(() => {
        expect(sessionManager.restore).toHaveBeenCalledWith(mockUser);
      });
      expect(sessionManager.handleLogout).not.toHaveBeenCalled();
    });

    it("should handle logout when API call fails (res.ok is false)", async () => {
      // Mock failed fetch (401/403 etc)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<SessionBootstrap />);

      await waitFor(() => {
        expect(sessionManager.handleLogout).toHaveBeenCalled();
      });
      expect(sessionManager.restore).not.toHaveBeenCalled();
    });

    it("should handle logout when fetch throws an error (Network Error)", async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network Error")
      );

      render(<SessionBootstrap />);

      await waitFor(() => {
        expect(sessionManager.handleLogout).toHaveBeenCalled();
      });
    });
  });

  describe("Activity Listeners", () => {
    it("should attach sessionManager to window global", () => {
      render(<SessionBootstrap />);
      // Cast window to any to access custom property
      expect((window as any).__RAHI_SESSION_MANAGER__).toBe(sessionManager);
    });

    it("should notify activity on window focus", () => {
      render(<SessionBootstrap />);

      // Dispatch focus event
      window.dispatchEvent(new Event("focus"));

      expect(sessionManager.notifyActivity).toHaveBeenCalled();
    });

    it("should notify activity when document becomes visible", () => {
      render(<SessionBootstrap />);

      // Mock visibility state
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      expect(sessionManager.notifyActivity).toHaveBeenCalled();
    });

    it("should NOT notify activity when document is hidden", () => {
      render(<SessionBootstrap />);

      // Mock visibility state hidden
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      expect(sessionManager.notifyActivity).not.toHaveBeenCalled();
    });
  });

  describe("Logout Handler", () => {
    it("should redirect to /login on 'session-logout' event", () => {
      render(<SessionBootstrap />);

      // Dispatch custom event
      window.dispatchEvent(new Event("session-logout"));

      expect(mockRouter.replace).toHaveBeenCalledWith("/login");
    });

    it("should remove event listeners on unmount", () => {
      const { unmount } = render(<SessionBootstrap />);

      // Spies for add/remove event listener
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const docRemoveSpy = jest.spyOn(document, "removeEventListener");

      unmount();

      expect(removeSpy).toHaveBeenCalledWith(
        "session-logout",
        expect.any(Function)
      );
      expect(removeSpy).toHaveBeenCalledWith("focus", expect.any(Function));
      expect(docRemoveSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
    });
  });
});
