"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Tab from "./Tab";
import Tabs from "./Tabs";
import TabList from "./TabList";
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

describe("Tab Component", () => {
  const renderTab = (tabProps = {}, tabsProps = {}) =>
    render(
      <Tabs {...tabsProps}>
        <TabList>
          <Tab {...tabProps}>Test Tab</Tab>
          <Tab>Other Tab</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );

  test("renders tab with children", () => {
    renderTab();
    expect(screen.getByText("Test Tab")).toBeInTheDocument();
  });

  test("applies active class when selected", () => {
    renderTab();
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveClass("active");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("applies custom className", () => {
    renderTab({ className: "custom-tab" });
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveClass("tab");
    expect(tab).toHaveClass("custom-tab");
  });

  test("applies selectedClassName when selected", () => {
    renderTab({ selectedClassName: "my-selected" });
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveClass("my-selected");
  });

  test("applies disabled class and attribute when disabled", () => {
    renderTab({ disabled: true });
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveClass("disabled");
    expect(tab).toHaveAttribute("aria-disabled", "true");
    expect(tab).toBeDisabled();
  });

  test("applies disabledClassName when disabled", () => {
    renderTab({ disabled: true, disabledClassName: "my-disabled" });
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveClass("my-disabled");
  });

  test("does not switch tabs when disabled", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab disabled>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );

    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
    expect(screen.queryByText("Panel 2")).not.toBeInTheDocument();
  });

  test("handles Enter key to select tab", () => {
    renderTab();
    const otherTab = screen.getByText("Other Tab");
    fireEvent.keyDown(otherTab, { key: "Enter" });
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
  });

  test("handles Space key to select tab", () => {
    renderTab();
    const otherTab = screen.getByText("Other Tab");
    fireEvent.keyDown(otherTab, { key: " " });
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
  });

  test("ignores other keys", () => {
    renderTab();
    const otherTab = screen.getByText("Other Tab");
    fireEvent.keyDown(otherTab, { key: "ArrowRight" });
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
  });

  test("has correct tabIndex values", () => {
    renderTab();
    const selectedTab = screen.getByText("Test Tab");
    const unselectedTab = screen.getByText("Other Tab");
    expect(selectedTab).toHaveAttribute("tabIndex", "0");
    expect(unselectedTab).toHaveAttribute("tabIndex", "-1");
  });

  test("has correct role attribute", () => {
    renderTab();
    const tab = screen.getByText("Test Tab");
    expect(tab).toHaveAttribute("role", "tab");
  });

  test("is a button element", () => {
    renderTab();
    const tab = screen.getByText("Test Tab");
    expect(tab.tagName).toBe("BUTTON");
    expect(tab).toHaveAttribute("type", "button");
  });
});
