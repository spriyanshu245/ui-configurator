import { render, screen, fireEvent } from "@testing-library/react";
import HeadingPanel from "./HeadingPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import React from "react";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("HeadingPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
  });

  it("renders heading panel correctly", () => {
    mockIsPanelOpen.mockReturnValue(false);

    render(
      <HeadingPanel
        propertyKeys={[ComponentProperty.Level]}
        propertyComponent={{ properties: { level: 2 } }}
        setProperty={mockSetProperty}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Heading" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading" })).toBeInTheDocument();
  });

  it("toggles panel visibility on button click", () => {
    mockIsPanelOpen.mockReturnValue(false);
    render(
      <HeadingPanel
        propertyKeys={[ComponentProperty.Level]}
        propertyComponent={{ properties: { level: 2 } }}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: "Heading" });
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.HeadingPanel);
  });

  it("displays heading levels when panel is open", () => {
    mockIsPanelOpen.mockReturnValue(true);
    render(
      <HeadingPanel
        propertyKeys={[ComponentProperty.Level]}
        propertyComponent={{ properties: { level: 2 } }}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Heading Level")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "H1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "H2" })).toBeInTheDocument();
  });

  it("updates heading level when button is clicked", () => {
    mockIsPanelOpen.mockReturnValue(true);
    render(
      <HeadingPanel
        propertyKeys={[ComponentProperty.Level]}
        propertyComponent={{ properties: { level: 2 } }}
        setProperty={mockSetProperty}
      />
    );

    const level3Button = screen.getByRole("button", { name: "H3" });
    fireEvent.click(level3Button);
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.Level, 3);
  });
});
