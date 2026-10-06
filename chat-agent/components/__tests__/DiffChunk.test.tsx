import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiffChunk } from "../DiffChunk";

let mockDiffImpl: () => unknown = () => [[], []];
jest.mock("json-diff-kit", () => ({
  Differ: jest.fn().mockImplementation(() => ({ diff: () => mockDiffImpl() })),
  Viewer: ({ diff }: any) => <div data-testid="viewer">{JSON.stringify(diff)}</div>,
}));
jest.mock("json-diff-kit/dist/viewer.css", () => ({}), { virtual: true });

const chunk = (opCount: number) => ({
  key: "/components/0",
  label: "Heading",
  before: { a: 1 },
  after: { a: 2 },
  ops: Array.from({ length: opCount }, () => ({ op: "replace", path: "/a", value: 2 })),
});

describe("DiffChunk", () => {
  beforeEach(() => {
    mockDiffImpl = () => [[], []];
  });

  it("pluralises the change badge and toggles the body", () => {
    render(<DiffChunk chunk={chunk(2) as any} />);
    expect(screen.getByText("2 changes")).toBeTruthy();
    expect(screen.getByTestId("viewer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { expanded: true }));
    expect(screen.queryByTestId("viewer")).toBeNull();
    expect(screen.getByRole("button", { expanded: false })).toBeTruthy();
  });

  it("uses the singular badge and a generic one when no ops are listed", () => {
    const { rerender } = render(<DiffChunk chunk={chunk(1) as any} />);
    expect(screen.getByText("1 change")).toBeTruthy();
    rerender(<DiffChunk chunk={chunk(0) as any} />);
    expect(screen.getByText("changes")).toBeTruthy();
  });

  it("starts collapsed when defaultOpen is false", () => {
    render(<DiffChunk chunk={chunk(1) as any} defaultOpen={false} />);
    expect(screen.queryByTestId("viewer")).toBeNull();
  });

  it("falls back to an empty diff when the differ throws", () => {
    mockDiffImpl = () => {
      throw new Error("circular");
    };
    render(<DiffChunk chunk={chunk(1) as any} />);
    expect(screen.getByTestId("viewer").textContent).toBe("[[],[]]");
  });
});
