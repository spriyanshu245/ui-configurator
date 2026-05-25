import { render, screen, act, fireEvent } from "@testing-library/react";
import ToastNotification from "./ToastNotification";
import ToastNotificationService from "../../services/ToastNotificationService";

jest.mock("../SVGIcons/Close", () => () => <div data-testid="close-icon" />);

describe("ToastNotification", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("renders nothing when there is no toast", () => {
    render(<ToastNotification />);
    expect(screen.queryByText(/./i)).not.toBeInTheDocument();
  });

  test("renders toast message when notification is published", () => {
    render(<ToastNotification />);

    act(() => {
      ToastNotificationService.show({
        message: "Test notification",
        type: "success",
      });
    });

    expect(screen.getByText("Test notification")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("closes the toast when close button is clicked", () => {
    render(<ToastNotification />);

    act(() => {
      ToastNotificationService.show({
        message: "Test notification",
        type: "info",
      });
    });

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.queryByText("Test notification")).not.toBeInTheDocument();
  });

  test("automatically closes the toast after duration", () => {
    render(<ToastNotification />);

    act(() => {
      ToastNotificationService.show({
        message: "Auto-close notification",
        duration: 3000,
      });
    });

    expect(screen.getByText("Auto-close notification")).toBeInTheDocument();

    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.queryByText("Auto-close notification")
    ).not.toBeInTheDocument();
  });

  test("doesn't auto-close when autoClose is false", () => {
    render(<ToastNotification />);

    act(() => {
      ToastNotificationService.show({
        message: "Persistent notification",
        autoClose: false,
      });
    });

    expect(screen.getByText("Persistent notification")).toBeInTheDocument();

    // Check that toast remains after long time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Persistent notification")).toBeInTheDocument();
  });

  test("updates progress bar correctly", () => {
    render(<ToastNotification />);

    act(() => {
      ToastNotificationService.show({
        message: "Progress test",
        duration: 1000,
      });
    });

    const progressBar = document.querySelector(`.${CSS.escape("progressBar")}`);
    expect(progressBar).toHaveStyle("width: 100%");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Progress should be approximately 50%
    expect(progressBar).toHaveStyle("width: 50%");
  });
});
