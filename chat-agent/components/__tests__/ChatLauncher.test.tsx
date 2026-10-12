/**
 * @jest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatLauncher } from "../ChatPanelParts";
import { LAUNCHER_STORAGE_KEY } from "../../lib/launcher-position";

// jsdom has no PointerEvent; a MouseEvent subclass carries clientX/button.
class PointerEventPolyfill extends MouseEvent {
  pointerId: number;
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 1;
  }
}
(window as any).PointerEvent = PointerEventPolyfill;

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});

const launcher = () => screen.getByTestId("chat-launcher");
const logo = () => screen.getByRole("button", { name: /open layoutx chat/i });

function drag(dx: number, dy: number) {
  const start = { x: 950, y: 750 };
  fireEvent.pointerDown(logo(), { clientX: start.x, clientY: start.y, button: 0, pointerId: 1 });
  fireEvent.pointerMove(logo(), { clientX: start.x + dx, clientY: start.y + dy, pointerId: 1 });
  fireEvent.pointerUp(logo(), { clientX: start.x + dx, clientY: start.y + dy, pointerId: 1 });
  fireEvent.click(logo());
}

describe("ChatLauncher", () => {
  it("sits in the bottom-right corner by default and opens on click", () => {
    const onOpen = jest.fn();
    render(<ChatLauncher onOpen={onOpen} />);
    expect(launcher().style.left).toBe("916px");
    expect(launcher().style.top).toBe("716px");
    fireEvent.click(logo());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("drags anywhere, does NOT open on drag, and remembers the spot", () => {
    const onOpen = jest.fn();
    render(<ChatLauncher onOpen={onOpen} />);
    drag(-600, -500);
    expect(onOpen).not.toHaveBeenCalled();
    expect(launcher().style.left).toBe("316px");
    expect(launcher().style.top).toBe("216px");
    expect(JSON.parse(localStorage.getItem(LAUNCHER_STORAGE_KEY)!)).toEqual({
      pos: { x: 316, y: 216 },
      pinned: false,
    });
  });

  it("a tiny jitter still counts as a click", () => {
    const onOpen = jest.fn();
    render(<ChatLauncher onOpen={onOpen} />);
    drag(2, 1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(launcher().style.left).toBe("916px");
  });

  it("pinning locks the position until unpinned", () => {
    render(<ChatLauncher onOpen={jest.fn()} />);
    fireEvent.mouseEnter(launcher());
    fireEvent.click(screen.getByRole("button", { name: /^pin chat button/i }));
    expect(launcher()).toHaveAttribute("data-pinned", "true");

    drag(-600, -500);
    expect(launcher().style.left).toBe("916px");

    fireEvent.click(screen.getByRole("button", { name: /unpin chat button/i }));
    drag(-600, -500);
    expect(launcher().style.left).toBe("316px");
  });

  it("restores a saved position and pin state", () => {
    localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify({ pos: { x: 40, y: 30 }, pinned: true }));
    render(<ChatLauncher onOpen={jest.fn()} />);
    expect(launcher().style.left).toBe("40px");
    expect(launcher().style.top).toBe("30px");
    expect(screen.getByRole("button", { name: /unpin chat button/i })).toBeInTheDocument();
  });

  it("shows the greeting bubble on the side with room", () => {
    localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify({ pos: { x: 20, y: 300 }, pinned: false }));
    render(<ChatLauncher onOpen={jest.fn()} />);
    fireEvent.mouseEnter(launcher());
    expect(screen.getByText("Ask LayoutX").className).toMatch(/floatingBubbleRight/);
  });
});
