import React from "react";
import { render, screen } from "@testing-library/react";
import type { Operation } from "fast-json-patch";
import { DslDiffViewer } from "../DslDiffViewer";

function makeDsl(apiUrl: string) {
  return {
    id: "root",
    type: "root",
    components: [
      { id: "c0", type: "heading", properties: { text: "Welcome" } },
      { id: "c1", type: "table", properties: { apiUrl } },
    ],
  };
}

describe("DslDiffViewer", () => {
  it("renders without throwing when no `patch` prop is supplied (whole-doc fallback)", () => {
    const currentDsl = makeDsl("/api/old");
    const patchedDsl = makeDsl("/api/new");

    expect(() =>
      render(
        <DslDiffViewer
          currentDsl={currentDsl}
          patchedDsl={patchedDsl}
          description="Update API URL"
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />,
      ),
    ).not.toThrow();

    expect(screen.getByText("Proposed Patch")).not.toBeNull();
    expect(screen.getByText("View Diff")).not.toBeNull();
  });

  it("renders scoped chunk containers when a `patch` prop is supplied", () => {
    const currentDsl = makeDsl("/api/old");
    const patchedDsl = makeDsl("/api/new");
    const patch: Operation[] = [
      { op: "replace", path: "/components/1/properties/apiUrl", value: "/api/new" },
    ];

    const { container } = render(
      <DslDiffViewer
        currentDsl={currentDsl}
        patchedDsl={patchedDsl}
        patch={patch}
        description="Update API URL"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    const chunkNodes = container.querySelectorAll("[data-chunk-key]");
    expect(chunkNodes.length).toBe(1);
    expect(chunkNodes[0].getAttribute("data-chunk-key")).toBe("/components/1");
  });

  it("does not render chunk containers when hideActions is set but patch is absent (batch viewer reuse)", () => {
    const currentDsl = makeDsl("/api/old");
    const patchedDsl = makeDsl("/api/new");

    const { container } = render(
      <DslDiffViewer
        currentDsl={currentDsl}
        patchedDsl={patchedDsl}
        description="Update API URL"
        hideActions
      />,
    );

    expect(container.querySelectorAll("[data-chunk-key]").length).toBe(0);
    // Approve/Reject actions should be hidden.
    expect(screen.queryByText(/Apply Change/)).toBeNull();
  });
});
