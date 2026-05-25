import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MetadataPanel from "./MetadataPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPaneProvider } from "@/app/context/PropertiesContext";

const renderWithContext = (ui: React.ReactElement) => {
  return render(<PropertyPaneProvider>{ui}</PropertyPaneProvider>);
};

describe("ConstantsPanel", () => {
  it("should toggle panel visibility on button click", () => {
    renderWithContext(
      <MetadataPanel
        propertyKeys={[ComponentProperty.Metadata]}
        propertyComponent={{
          id: "comp-1",
          properties: {
            metadata: { foo: "bar" },
          },
        }}
        setProperty={jest.fn()}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /metadata/i });
    expect(toggleButton).toBeInTheDocument();

    expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByTestId("requestBodySpecs")).toBeInTheDocument();
  });

  it("should call setProperty when JSON is changed", () => {
    const mockSetProperty = jest.fn();

    renderWithContext(
      <MetadataPanel
        propertyKeys={[ComponentProperty.Metadata]}
        propertyComponent={{
          id: "comp-1",
          properties: {
            metadata: '{"foo": "bar"}',
          },
        }}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /metadata/i });
    fireEvent.click(toggleButton);

    const jsonInput = screen.getByTestId("requestBodySpecs");

    fireEvent.change(jsonInput, {
      target: { value: '{"foo": "baz"}' },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Metadata,
      '{"foo": "baz"}'
    );
  });

  it("should return null for unknown property key (default case)", () => {
    const mockSetProperty = jest.fn();

    const UnknownProperty = "UnknownProperty" as ComponentProperty;

    renderWithContext(
      <MetadataPanel
        propertyKeys={[UnknownProperty]}
        propertyComponent={{
          id: "comp-2",
          properties: {},
        }}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /metadata/i });
    fireEvent.click(toggleButton);

    expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();
  });
});
