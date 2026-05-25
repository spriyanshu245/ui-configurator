"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Tabs from "./Tabs";
import TabList from "./TabList";
import Tab from "./Tab";
import TabPanel from "./TabPanel";

jest.mock("./Tabs.module.scss", () => ({
  tabs: "tabs",
  tabList: "tabList",
  tab: "tab",
  active: "active",
  disabled: "disabled",
  tabPanel: "tabPanel",
  selected: "selected",
  hidden: "hidden",
}));

describe("Tabs Component", () => {
  const renderTabs = (props = {}) =>
    render(
      <Tabs {...props}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
          <Tab>Tab 3</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
        <TabPanel>Panel 3</TabPanel>
      </Tabs>
    );

  test("renders tabs with default selected index", () => {
    renderTabs();
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
  });

  test("renders tabs with custom defaultIndex", () => {
    renderTabs({ defaultIndex: 1 });
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
    expect(screen.queryByText("Panel 1")).not.toBeInTheDocument();
  });

  test("applies custom className", () => {
    const { container } = renderTabs({ className: "custom-class" });
    expect(container.firstChild).toHaveClass("tabs");
    expect(container.firstChild).toHaveClass("custom-class");
  });

  test("switches tabs on click", () => {
    renderTabs();
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
    expect(screen.queryByText("Panel 1")).not.toBeInTheDocument();
  });

  test("works in controlled mode with selectedIndex", () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <Tabs selectedIndex={0} onSelect={onSelect}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );

    expect(screen.getByText("Panel 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tab 2"));
    expect(onSelect).toHaveBeenCalledWith(1, 0);

    rerender(
      <Tabs selectedIndex={1} onSelect={onSelect}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
  });

  test("onSelect can prevent tab change by returning false", () => {
    const onSelect = jest.fn().mockReturnValue(false);
    renderTabs({ onSelect });

    fireEvent.click(screen.getByText("Tab 2"));
    expect(onSelect).toHaveBeenCalledWith(1, 0);
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
    expect(screen.queryByText("Panel 2")).not.toBeInTheDocument();
  });

  test("does not call onSelect when clicking the already selected tab", () => {
    const onSelect = jest.fn();
    renderTabs({ onSelect });

    fireEvent.click(screen.getByText("Tab 1"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("handles non-element children gracefully", () => {
    const { container } = render(
      <Tabs>
        {null}
        <TabList>
          <Tab>Tab 1</Tab>
          {null}
          {"string child"}
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        {undefined}
      </Tabs>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
  });

  test("handles children without displayName", () => {
    const CustomComponent = () => <div>Custom</div>;
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <CustomComponent />
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
  });

  test("returns non-TabList and non-TabPanel children unchanged", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <div data-testid="other-child">Other Content</div>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );
    expect(screen.getByTestId("other-child")).toBeInTheDocument();
    expect(screen.getByText("Other Content")).toBeInTheDocument();
  });

  test("handles non-Tab children inside TabList", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
          <span data-testid="separator">|</span>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );
    expect(screen.getByTestId("separator")).toBeInTheDocument();
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
  });
});
