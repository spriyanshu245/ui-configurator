import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConstantsPanel from "./ConstantsPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPaneProvider } from "@/app/context/PropertiesContext";

const renderWithContext = (ui: React.ReactElement) => {
  return render(<PropertyPaneProvider>{ui}</PropertyPaneProvider>);
};

describe("ConstantsPanel", () => {
  it("should toggle panel visibility on button click", () => {
    renderWithContext(
      <ConstantsPanel
        propertyKeys={[ComponentProperty.ConstantsBodySpecs]}
        propertyComponent={{
          id: "comp-1",
          properties: {
            constantBodySpecs: { foo: "bar" },
          },
        }}
        setProperty={jest.fn()}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /constants/i });
    expect(toggleButton).toBeInTheDocument();

    expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByTestId("requestBodySpecs")).toBeInTheDocument();
  });

  it("should call setProperty when JSON is changed", () => {
    const mockSetProperty = jest.fn();

    renderWithContext(
      <ConstantsPanel
        propertyKeys={[ComponentProperty.ConstantsBodySpecs]}
        propertyComponent={{
          id: "comp-1",
          properties: {
            constantsBodySpecs: '{"foo": "bar"}',
          },
        }}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /constants/i });
    fireEvent.click(toggleButton);

    const jsonInput = screen.getByTestId("requestBodySpecs");

    fireEvent.change(jsonInput, {
      target: { value: '{"foo": "baz"}' },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ConstantsBodySpecs,
      '{"foo": "baz"}'
    );
  });

  it("should return null for unknown property key (default case)", () => {
    const mockSetProperty = jest.fn();

    const UnknownProperty = "UnknownProperty" as ComponentProperty;

    renderWithContext(
      <ConstantsPanel
        propertyKeys={[UnknownProperty]}
        propertyComponent={{
          id: "comp-2",
          properties: {},
        }}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /constants/i });
    fireEvent.click(toggleButton);

    expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();
  });
});
