"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import TabList from "./TabList";
import Tabs from "./Tabs";
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

describe("TabList Component", () => {
  test("renders children", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
  });

  test("has tablist role", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  test("applies tabList class", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("tabList");
  });

  test("applies custom className", () => {
    render(
      <Tabs>
        <TabList className="custom-list">
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("tabList");
    expect(tablist).toHaveClass("custom-list");
  });

  test("has correct displayName", () => {
    expect(TabList.displayName).toBe("TabList");
  });
});
