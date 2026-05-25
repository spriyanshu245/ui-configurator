import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyPaneProvider, usePropertyPane } from "./PropertiesContext";

const TestConsumer: React.FC = () => {
  const {
    isPropertyPaneVisible,
    propertyComponentId,
    propertyPageCode,
    setActiveComponent,
    resetActiveComponent,
    setActivePage,
    resetActivePage,
    togglePropertyPane,
    togglePanel,
    isPanelOpen,
  } = usePropertyPane();

  return (
    <div>
      <div data-testid="visible">
        {isPropertyPaneVisible ? "true" : "false"}
      </div>
      <div data-testid="componentId">
        {propertyComponentId ? propertyComponentId : "null"}
      </div>
      <div data-testid="pageId">
        {propertyPageCode ? propertyPageCode : "null"}
      </div>

      <button
        data-testid="set-component"
        onClick={() => setActiveComponent("comp1")}
      >
        Set Component
      </button>
      <button
        data-testid="set-empty-component"
        onClick={() => setActiveComponent("")}
      >
        Set Empty Component
      </button>
      <button data-testid="reset-component" onClick={resetActiveComponent}>
        Reset Component
      </button>

      <button data-testid="set-page" onClick={() => setActivePage("page1")}>
        Set Page
      </button>
      <button data-testid="reset-page" onClick={resetActivePage}>
        Reset Page
      </button>
      <button data-testid="toggle-pane" onClick={togglePropertyPane}>
        Toggle Pane
      </button>
      <button
        data-testid="toggle-panel"
        onClick={() => {
          if (togglePanel) togglePanel("panel1");
        }}
      >
        Toggle Panel
      </button>
      <div data-testid="is-panel-open">
        {isPanelOpen ? (isPanelOpen("panel1") ? "true" : "false") : "undefined"}
      </div>
    </div>
  );
};

describe("PropertyPaneContext", () => {
  it("provides default values", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
    expect(screen.getByTestId("componentId")).toHaveTextContent("null");
    expect(screen.getByTestId("pageId")).toHaveTextContent("null");
    expect(screen.getByTestId("is-panel-open")).toHaveTextContent("false");
  });

  it("sets and resets active component correctly", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );

    fireEvent.click(screen.getByTestId("set-component"));
    expect(screen.getByTestId("componentId")).toHaveTextContent("comp1");
    expect(screen.getByTestId("visible")).toHaveTextContent("true");
    expect(screen.getByTestId("pageId")).toHaveTextContent("null");

    fireEvent.click(screen.getByTestId("reset-component"));
    expect(screen.getByTestId("componentId")).toHaveTextContent("null");
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
  });

  it("ignores empty component ids", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );

    fireEvent.click(screen.getByTestId("set-empty-component"));
    expect(screen.getByTestId("componentId")).toHaveTextContent("null");
    expect(screen.getByTestId("pageId")).toHaveTextContent("null");
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
  });

  it("sets and resets active page correctly", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );
    fireEvent.click(screen.getByTestId("set-page"));
    expect(screen.getByTestId("pageId")).toHaveTextContent("page1");
    expect(screen.getByTestId("componentId")).toHaveTextContent("null");
    expect(screen.getByTestId("visible")).toHaveTextContent("true");

    fireEvent.click(screen.getByTestId("reset-page"));
    expect(screen.getByTestId("pageId")).toHaveTextContent("null");
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
  });

  it("toggles property pane visibility", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );

    expect(screen.getByTestId("visible")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("toggle-pane"));
    expect(screen.getByTestId("visible")).toHaveTextContent("true");
    expect(screen.getByTestId("componentId")).toHaveTextContent("null");

    fireEvent.click(screen.getByTestId("toggle-pane"));
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
  });

  it("toggles panel open state", () => {
    render(
      <PropertyPaneProvider>
        <TestConsumer />
      </PropertyPaneProvider>
    );

    expect(screen.getByTestId("is-panel-open")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("toggle-panel"));
    expect(screen.getByTestId("is-panel-open")).toHaveTextContent("true");

    fireEvent.click(screen.getByTestId("toggle-panel"));
    expect(screen.getByTestId("is-panel-open")).toHaveTextContent("false");
  });

  it("handles opening multiple panels independently", () => {
    const MultiPanelConsumer = () => {
      const { togglePanel, isPanelOpen } = usePropertyPane();
      return (
        <div>
          <button onClick={() => togglePanel?.("panelA")}>Toggle A</button>
          <button onClick={() => togglePanel?.("panelB")}>Toggle B</button>
          <div data-testid="panelA-status">
            {isPanelOpen?.("panelA").toString()}
          </div>
          <div data-testid="panelB-status">
            {isPanelOpen?.("panelB").toString()}
          </div>
        </div>
      );
    };

    render(
      <PropertyPaneProvider>
        <MultiPanelConsumer />
      </PropertyPaneProvider>
    );

    fireEvent.click(screen.getByText("Toggle A"));
    expect(screen.getByTestId("panelA-status")).toHaveTextContent("true");
    expect(screen.getByTestId("panelB-status")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("Toggle B"));
    expect(screen.getByTestId("panelA-status")).toHaveTextContent("true");
    expect(screen.getByTestId("panelB-status")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("Toggle A"));
    expect(screen.getByTestId("panelA-status")).toHaveTextContent("false");
    expect(screen.getByTestId("panelB-status")).toHaveTextContent("true");
  });

  it("throws error when used outside provider", () => {
    const TestWithoutProvider: React.FC = () => {
      usePropertyPane();
      return null;
    };

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<TestWithoutProvider />)).toThrow(
      "usePropertyPane must be used within a PropertyPaneProvider"
    );

    consoleSpy.mockRestore();
  });
});
