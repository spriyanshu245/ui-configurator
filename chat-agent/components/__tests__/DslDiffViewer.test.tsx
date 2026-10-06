import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { Operation } from "fast-json-patch";
import { DslDiffViewer } from "../DslDiffViewer";

let mockDiffImpl: (a: unknown, b: unknown) => unknown = () => [[], []];
jest.mock("json-diff-kit", () => ({
  Differ: jest.fn().mockImplementation(() => ({ diff: (a: unknown, b: unknown) => mockDiffImpl(a, b) })),
  // Three highlighted rows so the change navigator has something to walk.
  Viewer: () => (
    <table data-testid="whole-doc-viewer">
      <tbody>
        <tr className="json-diff-viewer-line-added" />
        <tr className="json-diff-viewer-line-deleted" />
        <tr className="json-diff-viewer-line-modified" />
      </tbody>
    </table>
  ),
}));
jest.mock("json-diff-kit/dist/viewer.css", () => ({}), { virtual: true });
jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <textarea aria-label="raw patch" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

let mockScopeImpl: (() => unknown) | null = null;
jest.mock("../../lib/scope-diff", () => {
  const actual = jest.requireActual("../../lib/scope-diff");
  return {
    ...actual,
    scopeDiffToPatch: (...args: unknown[]) =>
      mockScopeImpl ? mockScopeImpl() : (actual.scopeDiffToPatch as any)(...args),
  };
});

function makeDsl(texts: string[]) {
  return {
    id: "root",
    type: "root",
    components: texts.map((text, i) => ({ id: `c${i}`, type: "heading", properties: { text } })),
  };
}

const replaceOps = (n: number): Operation[] =>
  Array.from({ length: n }, (_, i) => ({
    op: "replace",
    path: `/components/${i}/properties/text`,
    value: "new",
  }));

const scrollIntoView = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  mockDiffImpl = () => [[], []];
  mockScopeImpl = null;
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  jest.useRealTimers();
});

// The viewer scans for highlighted rows 100ms after mounting.
const settleChangeScan = () =>
  act(() => {
    jest.advanceTimersByTime(100);
  });

describe("DslDiffViewer diff tab", () => {
  it("falls back to a whole-document diff when no patch is given and shows the description and hint", () => {
    render(
      <DslDiffViewer
        currentDsl={makeDsl(["a"])}
        patchedDsl={makeDsl(["b"])}
        description="Update heading"
        previewHint="Reload to see it"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(screen.getByText("Proposed Patch")).toBeTruthy();
    expect(screen.getByText("Update heading")).toBeTruthy();
    expect(screen.getByText("Hint: Reload to see it")).toBeTruthy();
    expect(screen.getByTestId("whole-doc-viewer")).toBeTruthy();
  });

  it("renders one scoped chunk per touched component when a patch is supplied", () => {
    const { container } = render(
      <DslDiffViewer
        currentDsl={makeDsl(["a", "b"])}
        patchedDsl={makeDsl(["a", "new"])}
        patch={replaceOps(2).slice(1).map((o) => ({ ...o, path: "/components/1/properties/text" }))}
      />,
    );
    const chunks = container.querySelectorAll("[data-chunk-key]");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].getAttribute("data-chunk-key")).toBe("/components/1");
  });

  it("collapses chunks by default once there are more than three", () => {
    const { container } = render(
      <DslDiffViewer
        currentDsl={makeDsl(["a", "b", "c", "d"])}
        patchedDsl={makeDsl(["n", "n", "n", "n"])}
        patch={replaceOps(4)}
      />,
    );
    expect(container.querySelectorAll("[data-chunk-key]")).toHaveLength(4);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(4);
  });

  it("falls back to the whole-document view when scoping fails or the diff throws", () => {
    mockScopeImpl = () => {
      throw new Error("scope");
    };
    mockDiffImpl = () => {
      throw new Error("diff");
    };
    const { container } = render(
      <DslDiffViewer currentDsl={makeDsl(["a"])} patchedDsl={makeDsl(["b"])} patch={replaceOps(1)} />,
    );
    expect(container.querySelectorAll("[data-chunk-key]")).toHaveLength(0);
    expect(screen.getByTestId("whole-doc-viewer")).toBeTruthy();
  });

  it("falls back to the whole-document view when the patch scopes to no chunks", () => {
    mockScopeImpl = () => [];
    render(<DslDiffViewer currentDsl={makeDsl(["a"])} patchedDsl={makeDsl(["b"])} patch={replaceOps(1)} />);
    expect(screen.getByTestId("whole-doc-viewer")).toBeTruthy();
  });

  it("hides approve/reject actions with hideActions (batch viewer reuse)", () => {
    render(<DslDiffViewer currentDsl={makeDsl(["a"])} patchedDsl={makeDsl(["b"])} hideActions />);
    expect(screen.queryByText(/Apply Change/)).toBeNull();
    expect(screen.queryByText(/Reject/)).toBeNull();
  });

  it("walks the highlighted changes with next/previous, wrapping around", async () => {
    render(<DslDiffViewer currentDsl={makeDsl(["a"])} patchedDsl={makeDsl(["b"])} />);
    settleChangeScan();
    expect(screen.getByText("Change 1 of 3")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const [prev, next] = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("navButton"));
    fireEvent.click(next);
    expect(screen.getByText("Change 2 of 3")).toBeTruthy();
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText("Change 1 of 3")).toBeTruthy();
    fireEvent.click(prev);
    expect(screen.getByText("Change 3 of 3")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledTimes(5);
  });
});

describe("DslDiffViewer edit tab and actions", () => {
  const setup = (props: Partial<React.ComponentProps<typeof DslDiffViewer>> = {}) => {
    const onApprove = jest.fn().mockResolvedValue(undefined);
    const onReject = jest.fn().mockResolvedValue(undefined);
    const patched = makeDsl(["b"]);
    const utils = render(
      <DslDiffViewer
        currentDsl={makeDsl(["a"])}
        patchedDsl={patched}
        patchId="p1"
        toolCallId="tc1"
        onApprove={onApprove}
        onReject={onReject}
        {...props}
      />,
    );
    return { onApprove, onReject, patched, ...utils };
  };

  it("approves the patched DSL with the patch and tool-call ids and shows a busy label", async () => {
    let finish!: () => void;
    const { onApprove, patched } = setup();
    onApprove.mockImplementation(() => new Promise<void>((r) => (finish = r)));
    fireEvent.click(screen.getByRole("button", { name: /Apply Change/ }));
    expect(await screen.findByText(/Applying\.\.\./)).toBeTruthy();
    expect(onApprove).toHaveBeenCalledWith("p1", "tc1", patched);
    await act(async () => finish());
    expect(await screen.findByText(/Apply Change/)).toBeTruthy();
  });

  it("approves edited JSON from the Edit tab and blocks approval while it is invalid", async () => {
    const { onApprove } = setup();
    fireEvent.click(screen.getByText("Edit Patch"));
    const editor = screen.getByLabelText("raw patch") as HTMLTextAreaElement;
    expect(JSON.parse(editor.value)).toEqual(makeDsl(["b"]));
    const warning = screen.getByText(/You are editing the raw patch/).closest("div")!;
    expect(warning.className).toContain("validWarning");

    fireEvent.change(editor, { target: { value: "{broken" } });
    expect(screen.getByText(/You are editing the raw patch/).closest("div")!.className).toContain("invalidWarning");
    const apply = screen.getByRole("button", { name: /Apply Change/ }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    fireEvent.click(apply);
    expect(onApprove).not.toHaveBeenCalled();

    fireEvent.change(editor, { target: { value: '{"id":"edited"}' } });
    expect(apply.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(apply);
    });
    expect(onApprove).toHaveBeenCalledWith("p1", "tc1", { id: "edited" });
  });

  it("returns to the diff tab", () => {
    setup();
    fireEvent.click(screen.getByText("Edit Patch"));
    expect(screen.queryByTestId("whole-doc-viewer")).toBeNull();
    fireEvent.click(screen.getByText("View Diff"));
    expect(screen.getByTestId("whole-doc-viewer")).toBeTruthy();
  });

  it("asks for a reason before rejecting, then rejects with it", async () => {
    const { onReject } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Reject/ }));
    expect(onReject).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("Reason (optional)"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onReject).toHaveBeenCalledWith("p1", "wrong", "tc1"));
    await waitFor(() => expect(screen.queryByPlaceholderText("Reason (optional)")).toBeNull());
  });

  it("uses a default reason when none is typed", async () => {
    const { onReject } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Reject/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onReject).toHaveBeenCalledWith("p1", "User rejected manually", "tc1"));
  });

  it("tolerates missing handlers and dismisses on Close", async () => {
    const { container } = render(
      <DslDiffViewer currentDsl={makeDsl(["a"])} patchedDsl={makeDsl(["b"])} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Apply Change/ }));
    fireEvent.click(screen.getByRole("button", { name: /Reject/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await screen.findByRole("button", { name: /Reject/ });
    fireEvent.click(screen.getByRole("button", { name: /Close/ }));
    expect(container.firstChild).toBeNull();
  });
});
