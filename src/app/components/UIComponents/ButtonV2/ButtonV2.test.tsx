import { render, screen } from "@testing-library/react";
import ButtonV2 from "./ButtonV2";
import { ButtonV2Component } from "@/app/types/types";

jest.mock("next/image", () => (props: any) => <img {...props} alt="Mock" />);

const baseComponent: ButtonV2Component = {
  id: "test-button",
  type: "button-v2",
  properties: {
    label: "Click Me",
    showLabel: true,
    iconUrl: "https://example.com/icon.png",
    iconSize: 24,
    iconPosition: "left",
    iconSpacing: 10,
  },
};

const renderComponent = (
  overrides: Partial<ButtonV2Component["properties"]> = {}
) => {
  const component: ButtonV2Component = {
    ...baseComponent,
    properties: { ...baseComponent.properties, ...overrides },
  };
  return render(<ButtonV2 component={component} />);
};

describe("ButtonV2", () => {
  it("renders label on the left (default)", () => {
    renderComponent({ iconPosition: "left" });
    expect(screen.getByTestId("left-button")).toHaveTextContent("Click Me");
    expect(screen.getByAltText("Mock")).toBeInTheDocument();
  });

  it("renders label on the right", () => {
    renderComponent({ iconPosition: "right" });
    expect(screen.getByTestId("right-button")).toHaveTextContent("Click Me");
  });

  it("renders label above the icon", () => {
    renderComponent({ iconPosition: "above" });
    expect(screen.getByTestId("left-button")).toBeInTheDocument();
  });

  it("renders with default icon position when undefined", () => {
    renderComponent({ iconPosition: undefined });
    expect(screen.getByTestId("left-button")).toBeInTheDocument();
  });

  it("uses default icon size and spacing when not provided", () => {
    renderComponent({ iconSize: undefined, iconSpacing: undefined });
    const img = screen.getByAltText("Mock");
    expect(img).toHaveAttribute("width", "20");
    expect(img).toHaveAttribute("height", "20");
  });

  it("does not render icon when iconUrl is empty string", () => {
    renderComponent({ iconUrl: "" });
    expect(screen.queryByAltText("Mocked Image")).not.toBeInTheDocument();
  });

  it("does not render icon when iconUrl is whitespace", () => {
    renderComponent({ iconUrl: "   " });
    expect(screen.queryByAltText("Mock")).not.toBeInTheDocument();
  });

  it("does not render label when showLabel is false", () => {
    renderComponent({ showLabel: false });
    expect(screen.queryByText("Click Me")).not.toBeInTheDocument();
    expect(screen.getByAltText("Mock")).toBeInTheDocument();
  });

  it("renders fallback label 'Button' when label is missing", () => {
    renderComponent({ label: undefined });
    expect(screen.getByText("Button")).toBeInTheDocument();
  });

  it("renders button with correct type", () => {
    renderComponent();
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("prevents default onClick behavior", () => {
    renderComponent();
    const button = screen.getByRole("button");

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    // Mock preventDefault directly on the event
    clickEvent.preventDefault = jest.fn();

    button.dispatchEvent(clickEvent);

    expect(clickEvent.preventDefault).toHaveBeenCalled();
  });

  it('renders fallback label "Button" when label is falsy and iconPosition is "right"', () => {
    renderComponent({ label: "", iconPosition: "right" });
    expect(screen.getByTestId("right-button")).toHaveTextContent("Button");
  });
});
