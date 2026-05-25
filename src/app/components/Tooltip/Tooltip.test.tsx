import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Tooltip from "./Tooltip";

describe("Tooltip Component", () => {
  test("renders children and does not show tooltip initially", () => {
    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByText("Tooltip text")).toBeNull();
  });

  test("shows tooltip on mouse enter and updates position on mouse move", () => {
    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );
    const child = screen.getByTestId("child");
    const wrapper = child.parentElement;
    expect(wrapper).toBeInTheDocument();
    fireEvent.mouseEnter(wrapper!);
    fireEvent.mouseMove(wrapper!, { clientX: 50, clientY: 100 });
    const tooltip = screen.getByText("Tooltip text");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveStyle({ top: "110px", left: "60px" });
    fireEvent.mouseLeave(wrapper!);
    expect(screen.queryByText("Tooltip text")).toBeNull();
  });

  test("shows tooltip at the cursor position even without mouse move after mouse enter", () => {
    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );

    const child = screen.getByTestId("child");
    const wrapper = child.parentElement;

    expect(wrapper).toBeInTheDocument();

    fireEvent.mouseEnter(wrapper!, { clientX: 120, clientY: 80 });

    const tooltip = screen.getByText("Tooltip text");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveStyle({ top: "90px", left: "130px" });
  });

  test("does not show tooltip when visibilityCondition is false", () => {
    render(
      <Tooltip text="Tooltip text" visibilityCondition={false}>
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );
    const child = screen.getByTestId("child");
    const wrapper = child.parentElement;
    expect(wrapper).toBeInTheDocument();
    fireEvent.mouseEnter(wrapper!);
    fireEvent.mouseMove(wrapper!, { clientX: 50, clientY: 100 });
    expect(screen.queryByText("Tooltip text")).toBeNull();
  });

  test("tooltip remains hidden if rapidly entering and leaving the element", () => {
    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Rapid Hover</div>
      </Tooltip>,
    );
    const child = screen.getByTestId("child");
    const wrapper = child.parentElement;
    fireEvent.mouseEnter(wrapper!);
    fireEvent.mouseLeave(wrapper!);
    expect(screen.queryByText("Tooltip text")).toBeNull();
  });

  test("repositions the tooltip when it would overflow the right edge", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 200,
    });

    const rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            width: 80,
            height: 20,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      );

    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );

    const wrapper = screen.getByTestId("child").parentElement;
    fireEvent.mouseEnter(wrapper!, { clientX: 190, clientY: 20 });

    const tooltip = screen.getByText("Tooltip text");
    expect(tooltip).toHaveStyle({ left: "112px", top: "30px" });

    rectSpy.mockRestore();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
  });

  test("repositions the tooltip when it would overflow the bottom edge", () => {
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 120,
    });

    const rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            width: 40,
            height: 30,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      );

    render(
      <Tooltip text="Tooltip text">
        <div data-testid="child">Hover me</div>
      </Tooltip>,
    );

    const wrapper = screen.getByTestId("child").parentElement;
    fireEvent.mouseEnter(wrapper!, { clientX: 20, clientY: 110 });

    const tooltip = screen.getByText("Tooltip text");
    expect(tooltip).toHaveStyle({ left: "30px", top: "70px" });

    rectSpy.mockRestore();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalHeight,
    });
  });
});
