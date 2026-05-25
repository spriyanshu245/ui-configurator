import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import UserNotificationV2 from "./UserNotificationV2";

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/Exclamation", () => {
  const MockErrorIcon = () => <span data-testid="error-icon" />;
  return { __esModule: true, default: MockErrorIcon };
});

jest.mock("@/app/components/SVGIcons/Success", () => {
  const MockSuccessIcon = () => <span data-testid="success-icon" />;
  return { __esModule: true, default: MockSuccessIcon };
});

import { useHeaderV2 } from "@/app/context/HeaderContextV2";

describe("UserNotificationV2", () => {
  const mockSetUserNotification = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useHeaderV2 as jest.Mock).mockReturnValue({
      userNotification: null,
      setUserNotification: mockSetUserNotification,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders nothing when there is no notification", () => {
    const { container } = render(<UserNotificationV2 />);
    expect(container.firstChild).toBeNull();
  });

  it("renders notification when provided and then hides it after the timeout", async () => {
    const notification = {
      text: "Test notification",
      time: 3000,
      type: "info",
    };
    (useHeaderV2 as jest.Mock).mockReturnValue({
      userNotification: notification,
      setUserNotification: mockSetUserNotification,
    });
    render(<UserNotificationV2 />);
    await screen.findByText("Test notification");
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      expect(screen.queryByText("Test notification")).toBeNull();
    });
  });

  it("renders ExclamationIcon when notification type is 'error'", async () => {
    const errorNotification = {
      text: "Error occurred",
      time: 3000,
      type: "error",
    };
    (useHeaderV2 as jest.Mock).mockReturnValue({
      userNotification: errorNotification,
      setUserNotification: mockSetUserNotification,
    });
    render(<UserNotificationV2 />);
    await screen.findByText("Error occurred");
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it("renders SuccessIcon when notification type is 'success'", async () => {
    const successNotification = {
      text: "Success",
      time: 1500,
      type: "success",
    };
    (useHeaderV2 as jest.Mock).mockReturnValue({
      userNotification: successNotification,
      setUserNotification: mockSetUserNotification,
    });
    render(<UserNotificationV2 />);
    await screen.findByText("Success");
    expect(screen.getByTestId("success-icon")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => {
      expect(screen.queryByText("Success")).toBeNull();
    });
  });
});
