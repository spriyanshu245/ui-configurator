"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import TabsContext, { useTabsContext } from "./TabsContext";

describe("TabsContext", () => {
  test("useTabsContext throws error when used outside Tabs", () => {
    const TestComponent = () => {
      useTabsContext();
      return <div>Test</div>;
    };

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "Tabs compound components must be used within <Tabs>"
    );

    consoleSpy.mockRestore();
  });

  test("useTabsContext returns context value when inside provider", () => {
    const TestComponent = () => {
      const { selectedIndex, setSelectedIndex } = useTabsContext();
      return (
        <div>
          <span data-testid="index">{selectedIndex}</span>
          <button onClick={() => setSelectedIndex(1)}>Change</button>
        </div>
      );
    };

    const mockSetSelectedIndex = jest.fn();

    render(
      <TabsContext.Provider
        value={{ selectedIndex: 5, setSelectedIndex: mockSetSelectedIndex }}
      >
        <TestComponent />
      </TabsContext.Provider>
    );

    expect(screen.getByTestId("index")).toHaveTextContent("5");
  });
});
