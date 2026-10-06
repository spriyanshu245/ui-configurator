import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageMapCard } from "../PageMapCard";

type Props = React.ComponentProps<typeof PageMapCard>["pageMap"];

const node = (pageCode: string, extra: Partial<Props["nodes"][number]> = {}) => ({
  pageCode,
  isPopup: false,
  isFirst: false,
  ...extra,
});

describe("PageMapCard", () => {
  it("renders the first page as root with routed children, using slug labels", () => {
    const pageMap: Props = {
      firstPageCode: "ms_home",
      nodes: [node("ms_home", { isFirst: true }), node("ms_detail"), node("ms_help", { isPopup: true })],
      edges: [
        { from: "ms_home", to: "ms_detail", via: "route" },
        { from: "ms_home", to: "ms_help", via: "tab" },
      ],
      unknownTargets: [],
    };
    render(<PageMapCard pageMap={pageMap} />);

    expect(screen.getByText("3 pages")).toBeTruthy();
    expect(screen.getByText("home")).toBeTruthy();
    expect(screen.getByText("detail")).toBeTruthy();
    expect(screen.getByText("route")).toBeTruthy();
    expect(screen.getByText("tab")).toBeTruthy();
    expect(screen.getByText("popup")).toBeTruthy();
    expect(screen.queryByText("Unlinked pages")).toBeNull();
  });

  it("navigates and highlights the active page", () => {
    const onNavigate = jest.fn();
    const pageMap: Props = {
      firstPageCode: "ms_home",
      nodes: [node("ms_home", { isFirst: true }), node("ms_a")],
      edges: [{ from: "ms_home", to: "ms_a", via: "route" }],
      unknownTargets: [],
    };
    render(<PageMapCard pageMap={pageMap} activePageCode="ms_a" onNavigate={onNavigate} />);

    const active = screen.getByTitle("ms_a");
    expect(active.className).toContain("nodeActive");
    expect(screen.getByTitle("ms_home").className).not.toContain("nodeActive");
    fireEvent.click(active);
    expect(onNavigate).toHaveBeenCalledWith("ms_a");
  });

  it("does not throw when clicked without an onNavigate handler", () => {
    render(
      <PageMapCard
        pageMap={{ firstPageCode: "p", nodes: [node("p", { isFirst: true })], edges: [], unknownTargets: [] }}
      />,
    );
    fireEvent.click(screen.getByTitle("p"));
  });

  it("marks cycles instead of recursing forever", () => {
    const pageMap: Props = {
      firstPageCode: "ms_a",
      nodes: [node("ms_a", { isFirst: true }), node("ms_b")],
      edges: [
        { from: "ms_a", to: "ms_b", via: "route" },
        { from: "ms_b", to: "ms_a", via: "route" },
      ],
      unknownTargets: [],
    };
    render(<PageMapCard pageMap={pageMap} />);
    expect(screen.getByText("↻")).toBeTruthy();
  });

  it("treats unreferenced pages as extra roots, ignores edges to missing nodes and lists unknown targets", () => {
    const pageMap: Props = {
      firstPageCode: "ms_home",
      nodes: [node("ms_home", { isFirst: true }), node("ms_lonely"), node("ms_child")],
      edges: [
        { from: "ms_lonely", to: "ms_child", via: "route" },
        { from: "ms_home", to: "ms_ghost", via: "route" },
      ],
      unknownTargets: ["ms_ghost", "ms_x"],
    };
    render(<PageMapCard pageMap={pageMap} />);
    expect(screen.getByText("lonely")).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
    expect(screen.queryByText("Unlinked pages")).toBeNull();
    expect(screen.getByText("Links to unknown pages: ms_ghost, ms_x")).toBeTruthy();
  });

  it("falls back to the first node when all pages are in cycles, listing unreachable ones as unlinked", () => {
    const pageMap: Props = {
      firstPageCode: null,
      nodes: [node("ms_a"), node("ms_b"), node("ms_c")],
      edges: [
        { from: "ms_a", to: "ms_b", via: "route" },
        { from: "ms_b", to: "ms_a", via: "route" },
        { from: "ms_c", to: "ms_c", via: "tab" },
      ],
      unknownTargets: [],
    };
    render(<PageMapCard pageMap={pageMap} />);
    expect(screen.getByText("Unlinked pages")).toBeTruthy();
    expect(screen.getAllByTitle("ms_c").length).toBeGreaterThan(0);
  });

  it("uses the full code as label when there is no usable prefix", () => {
    render(
      <PageMapCard
        pageMap={{ firstPageCode: null, nodes: [node("plain"), node("trailing_")], edges: [], unknownTargets: [] }}
      />,
    );
    expect(screen.getByText("plain")).toBeTruthy();
    expect(screen.getByText("trailing_")).toBeTruthy();
  });
});
