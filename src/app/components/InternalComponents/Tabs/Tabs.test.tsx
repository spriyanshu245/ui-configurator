import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "./Tabs";

describe("Tabs Components", () => {
  test("Tabs renders its children", () => {
    render(
      <Tabs>
        <div>Test Tabs Content</div>
      </Tabs>
    );
    expect(screen.getByText("Test Tabs Content")).toBeInTheDocument();
  });

  test("TabList renders its children", () => {
    render(
      <TabList>
        <div>Test TabList Content</div>
      </TabList>
    );
    expect(screen.getByText("Test TabList Content")).toBeInTheDocument();
  });

  test("Tab calls setActiveTab on click and applies active class when active", () => {
    const setActiveTabMock = jest.fn();
    render(
      <div>
        <Tab index={0} activeTab={0} setActiveTab={setActiveTabMock}>
          Tab 1
        </Tab>
        <Tab index={1} activeTab={0} setActiveTab={setActiveTabMock}>
          Tab 2
        </Tab>
      </div>
    );
    const tab1 = screen.getByText("Tab 1");
    const tab2 = screen.getByText("Tab 2");

    // When activeTab equals the tab's index, it should include the active class.
    expect(tab1.className).toMatch(/active/);
    // The inactive tab should not have the active class.
    expect(tab2.className).not.toMatch(/active/);

    // Clicking on tab2 should call setActiveTab with its index.
    fireEvent.click(tab2);
    expect(setActiveTabMock).toHaveBeenCalledWith(1);
  });

  test("TabPanels renders its children", () => {
    render(
      <TabPanels>
        <div>Panel Container Content</div>
      </TabPanels>
    );
    expect(screen.getByText("Panel Container Content")).toBeInTheDocument();
  });

  test("TabPanel renders content when active and not when inactive", () => {
    // Render with activeTab matching the panel's index.
    const { rerender } = render(
      <TabPanel index={0} activeTab={0}>
        Active Panel Content
      </TabPanel>
    );
    expect(screen.getByText("Active Panel Content")).toBeInTheDocument();

    // Re-render with a different activeTab.
    rerender(
      <TabPanel index={0} activeTab={1}>
        Inactive Panel Content
      </TabPanel>
    );
    // Content should not be rendered when inactive.
    expect(screen.queryByText("Inactive Panel Content")).toBeNull();
  });
});
