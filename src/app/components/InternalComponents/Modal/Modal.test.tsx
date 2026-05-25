import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

jest.mock("./Modal.module.scss", () => ({
  overlay: "overlay",
  modal: "modal",
  close: "close",
  info: "info",
  heading: "heading",
  paragraph: "paragraph",
  actions: "actions",
  button: "button",
  successButton: "successButton",
  warningButton: "warningButton",
  hideButton: "hideButton",
}));

jest.mock("@/app/utils/InternalIcons", () => ({
  __esModule: true,
  default: (iconName: string) => `Icon(${iconName})`,
}));

describe("Modal Component", () => {
  const onCloseMock = jest.fn();
  const onSubmitMock = jest.fn();
  const backDropMock = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: onCloseMock,
    backDrop: backDropMock,
    onSubmit: onSubmitMock,
    title: "Test Title",
    description: "Test Description",
    submitText: "Confirm",
    cancelText: "Cancel",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns null when isOpen is false", () => {
    const { container } = render(<Modal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders modal content and applies correct style based on type", () => {
    const { rerender } = render(<Modal {...defaultProps} type="warning" />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toHaveClass("heading");
    expect(screen.getByText("Test Description")).toHaveClass("paragraph");
    expect(screen.getByTestId("submit-button")).toHaveClass("warningButton");

    rerender(<Modal {...defaultProps} type="success" />);
    expect(screen.getByTestId("submit-button")).toHaveClass("successButton");
  });

  test("clicking overlay calls backDrop and stops propagation", () => {
    render(<Modal {...defaultProps} />);
    const overlay = screen.getByTestId("modal-overlay");

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const stopSpy = jest.spyOn(event, "stopPropagation");
    const preventSpy = jest.spyOn(event, "preventDefault");

    fireEvent(overlay, event);

    expect(backDropMock).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
    expect(preventSpy).toHaveBeenCalled();
  });

  test("clicking cancel button calls onClose and prevents propagation", () => {
    render(<Modal {...defaultProps} />);
    const cancelButton = screen.getByText("Cancel");

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const stopSpy = jest.spyOn(event, "stopPropagation");

    fireEvent(cancelButton, event);

    expect(onCloseMock).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  test("clicking submit button calls onSubmit and prevents propagation", () => {
    render(<Modal {...defaultProps} />);
    const submitButton = screen.getByTestId("submit-button");

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const stopSpy = jest.spyOn(event, "stopPropagation");

    fireEvent(submitButton, event);

    expect(onSubmitMock).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  test("toggles between standard and hidden button class based on cancelText", () => {
    const { rerender } = render(
      <Modal {...defaultProps} cancelText={undefined} />
    );

    const buttons = screen.getAllByRole("button");
    const cancelBtn = buttons.find(
      (b) => b.tagName === "BUTTON" && !b.getAttribute("data-testid")
    );

    expect(cancelBtn).toHaveClass("hideButton");

    rerender(<Modal {...defaultProps} cancelText="Go Back" />);
    expect(screen.getByText("Go Back")).toHaveClass("button");
  });

  test("handles keydown events on overlay for accessibility", () => {
    render(<Modal {...defaultProps} />);
    const overlay = screen.getByTestId("modal-overlay");

    fireEvent.keyDown(overlay, { key: "Enter" });
    expect(backDropMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(overlay, { key: " " });
    expect(backDropMock).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(overlay, { key: "Tab" });
    expect(backDropMock).toHaveBeenCalledTimes(2);
  });
});
