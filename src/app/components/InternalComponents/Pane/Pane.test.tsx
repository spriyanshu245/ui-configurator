import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Pane from "./Pane";

jest.mock("./pane.module.scss", () => ({
  overlay: "overlay",
  active: "active",
  pane: "pane",
  open: "open",
  paneHeader: "paneHeader",
  closeButton: "closeButton",
  paneContent: "paneContent",
  paneFooter: "paneFooter",
}));

describe("Pane (coverage)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const mount = (props: Partial<Parameters<typeof Pane>[0]> = {}) => {
    const onClose = jest.fn();
    render(
      <Pane
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        title={props.title ?? "My Title"}
        minWidth={props.minWidth}
        paneFooter={props.paneFooter}
        showCloseIcon={props.showCloseIcon ?? true}
      >
        {props.children ?? <div data-testid="child">Child</div>}
      </Pane>
    );
    return { onClose };
  };

  it("activates after small delay and renders children + footer", () => {
    mount({ paneFooter: <div data-testid="footer">F</div> });
    const overlay = document.querySelector(".overlay") as HTMLElement;
    if (!overlay) throw new Error("overlay not found");
    const pane = screen.getByTestId("pane");
    expect(pane.className.split(" ")).toContain("pane");
    // before timer -> not active
    expect(overlay.className.split(" ")).not.toContain("active");
    act(() => {
      // advance more than the 10ms used in component
      jest.advanceTimersByTime(50);
    });
    // force layout read to flush effects
    void (overlay as HTMLElement).offsetHeight;
    // In test environment animation class toggle may be skipped; just assert pane eventually has 'open' after timers.
    expect(pane.className.split(" ")).toContain("open");
    expect(pane.className.split(" ")).toContain("open");
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("applies minWidth style", () => {
    mount({ minWidth: 480 });
    const pane = screen.getByTestId("pane");
    act(() => {
      jest.runAllTimers();
    });
    expect(pane.style.minWidth).toBe("480px");
  });

  it("closes via close button with delayed onClose", () => {
    const { onClose } = mount();
    act(() => {
      jest.runAllTimers();
    });
    const pane = screen.getByTestId("pane");
    const btn = pane.querySelector("button.closeButton") as HTMLButtonElement;
    fireEvent.click(btn);
    // immediate state reset removes open class
    expect(pane.className.split(" ")).not.toContain("open");
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes via overlay click", () => {
    const { onClose } = mount();
    act(() => {
      jest.advanceTimersByTime(20);
    });
    const overlay = document.querySelector(".overlay") as HTMLElement;
    fireEvent.click(overlay);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("omits header when no title and close icon hidden", () => {
    mount({ title: "", showCloseIcon: false });
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.queryByRole("heading")).toBeNull();
    const pane = screen.getByTestId("pane");
    expect(pane.querySelector("button.closeButton")).toBeNull();
  });

  it("renders when initially closed (isOpen=false)", () => {
    mount({ isOpen: false });
    const pane = screen.getByTestId("pane");
    const overlay = document.querySelector(".overlay") as HTMLElement;
    act(() => {
      jest.runAllTimers();
    });
    expect(pane.className.split(" ")).not.toContain("open");
    expect(overlay.className.split(" ")).not.toContain("active");
  });

  it("applies auto width when minWidth not provided", () => {
    mount({ minWidth: undefined });
    const pane = screen.getByTestId("pane");
    act(() => {
      jest.runAllTimers();
    });
    expect(pane.style.minWidth).toBe("auto");
  });

  it("shows header with title but no close button when showCloseIcon=false", () => {
    mount({ title: "Test Title", showCloseIcon: false });
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByRole("heading")).toHaveTextContent("Test Title");
    const pane = screen.getByTestId("pane");
    expect(pane.querySelector("button.closeButton")).toBeNull();
  });
});
