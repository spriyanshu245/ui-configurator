import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import { ContactComponent } from "../../../types/types";

const baseProps: ContactComponent = {
  id: "contact1",
  type: "contact",
  category: "form",
  properties: {
    label: "Contact Label",
    showLabel: true,
    contactType: "Mobile Number",
    placeholder: "Enter contact",
  },
};

describe("Contact", () => {
  it("renders label when showLabel is true", () => {
    render(<Contact component={baseProps} />);
    expect(screen.getByText("Contact Label")).toBeInTheDocument();
  });

  it("does not render label when showLabel is false", () => {
    const props = {
      ...baseProps,
      properties: { ...baseProps.properties, showLabel: false },
    };
    render(<Contact component={props} />);
    expect(screen.queryByText("Contact Label")).not.toBeInTheDocument();
  });

  it("handles undefined properties gracefully", () => {
    const propsWithUndefinedProperties: ContactComponent = {
      id: "contact1",
      type: "contact",
      category: "form",
      properties: undefined as any,
    };
    render(<Contact component={propsWithUndefinedProperties} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("does not render icon when iconUrl is empty string", () => {
    const propsWithEmptyIcon = {
      ...baseProps,
      properties: {
        ...baseProps.properties,
        iconUrl: "",
        iconPosition: "left" as const,
      },
    };
    render(<Contact component={propsWithEmptyIcon} />);
    expect(screen.queryByAltText("Img")).not.toBeInTheDocument();
  });

  it("does not render icon when iconUrl is whitespace", () => {
    const propsWithWhitespaceIcon = {
      ...baseProps,
      properties: {
        ...baseProps.properties,
        iconUrl: "   ",
        iconPosition: "left" as const,
      },
    };
    render(<Contact component={propsWithWhitespaceIcon} />);
    expect(screen.queryByAltText("Img")).not.toBeInTheDocument();
  });

  it("renders left icon when iconPosition is left and iconUrl is valid", () => {
    const propsWithLeftIcon = {
      ...baseProps,
      properties: {
        ...baseProps.properties,
        iconUrl: "/test-icon.png",
        iconPosition: "left" as const,
        iconSpacing: 10,
      },
    };
    render(<Contact component={propsWithLeftIcon} />);
    const icon = screen.getByAltText("Img");
    expect(icon).toBeInTheDocument();
    expect(icon.closest(".iconContainer")).toHaveStyle("margin-right: 10px");
  });

  it("renders right icon when iconPosition is right and iconUrl is valid", () => {
    const propsWithRightIcon = {
      ...baseProps,
      properties: {
        ...baseProps.properties,
        iconUrl: "/test-icon.png",
        iconPosition: "right" as const,
        iconSpacing: 15,
      },
    };
    render(<Contact component={propsWithRightIcon} />);
    const icon = screen.getByAltText("Img");
    expect(icon).toBeInTheDocument();
    expect(icon.closest(".iconContainer")).toHaveStyle("margin-left: 15px");
  });
});
