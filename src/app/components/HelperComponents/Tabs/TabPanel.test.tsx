"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TabPanel from "./TabPanel";
import Tabs from "./Tabs";
import TabList from "./TabList";
import Tab from "./Tab";

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

describe("TabPanel Component", () => {
  test("renders selected panel content", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1 Content</TabPanel>
        <TabPanel>Panel 2 Content</TabPanel>
      </Tabs>
    );

    expect(screen.getByText("Panel 1 Content")).toBeInTheDocument();
    expect(screen.queryByText("Panel 2 Content")).not.toBeInTheDocument();
  });

  test("does not render unselected panel by default", () => {
    render(
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel>Panel 2</TabPanel>
      </Tabs>
    );

    expect(screen.queryByText("Panel 2")).not.toBeInTheDocument();
  });

  test("renders unselected panel with forceRender", () => {
    render(
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel forceRender>Panel 2</TabPanel>
      </Tabs>
    );

    expect(screen.getByText("Panel 1")).toBeInTheDocument();
    expect(screen.getByText("Panel 2")).toBeInTheDocument();
  });

  test("applies hidden class when forceRender but not selected", () => {
    render(
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel forceRender>
          <span data-testid="panel2-content">Panel 2</span>
        </TabPanel>
      </Tabs>
    );

    const panel2Content = screen.getByTestId("panel2-content");
    const panel2 = panel2Content.closest('[role="tabpanel"]');
    expect(panel2).toHaveClass("hidden");
  });

  test("applies tabpanel role", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );

    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  test("applies tabPanel and selected class when selected", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
      </Tabs>
    );

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveClass("tabPanel");
    expect(panel).toHaveClass("selected");
  });

  test("applies custom className", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel className="custom-panel">Panel 1</TabPanel>
      </Tabs>
    );

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveClass("tabPanel");
    expect(panel).toHaveClass("custom-panel");
  });

  test("applies selectedClassName when selected", () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab 1</Tab>
        </TabList>
        <TabPanel selectedClassName="my-selected">Panel 1</TabPanel>
      </Tabs>
    );

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveClass("my-selected");
  });

  test("has correct displayName", () => {
    expect(TabPanel.displayName).toBe("TabPanel");
  });

  test("removes hidden when panel becomes selected", () => {
    render(
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
        </TabList>
        <TabPanel>Panel 1</TabPanel>
        <TabPanel forceRender>Panel 2</TabPanel>
      </Tabs>
    );

    fireEvent.click(screen.getByText("Tab 2"));

    const panel2 = screen.getByText("Panel 2").parentElement;
    expect(panel2).not.toHaveAttribute("hidden");
    expect(panel2).not.toHaveClass("hidden");
  });
});
