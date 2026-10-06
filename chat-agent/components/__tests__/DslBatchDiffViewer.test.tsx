import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DslBatchDiffViewer } from "../DslBatchDiffViewer";

jest.mock("../DslDiffViewer", () => ({
  DslDiffViewer: (props: any) => (
    <div data-testid="diff" data-hide-actions={String(props.hideActions)}>
      {props.description}
    </div>
  ),
}));

const op = (pagePath: string, description?: string) => ({
  pagePath,
  description,
  currentDsl: { a: 1 },
  patchedDsl: { a: 2 },
});

const setup = (
  batch: Partial<React.ComponentProps<typeof DslBatchDiffViewer>["batch"]> = {},
) => {
  const onApproveBatch = jest.fn().mockResolvedValue(undefined);
  const onRejectBatch = jest.fn().mockResolvedValue(undefined);
  const utils = render(
    <DslBatchDiffViewer
      batch={{ id: "b1", operations: [op("p1", "one"), op("p2")], ...batch }}
      toolCallId="tc"
      onApproveBatch={onApproveBatch}
      onRejectBatch={onRejectBatch}
    />,
  );
  return { onApproveBatch, onRejectBatch, ...utils };
};

describe("DslBatchDiffViewer", () => {
  it("summarises the batch and collapses every page when there are several", () => {
    setup({ batchDescription: "Big change", navigateTo: "p2" });
    expect(screen.getByText(/Proposed Batch Change \(2 pages\)/)).toBeTruthy();
    expect(screen.getByText("Big change")).toBeTruthy();
    expect(screen.getByText(/you'll be taken to: p2/)).toBeTruthy();
    expect(screen.queryByTestId("diff")).toBeNull();
  });

  it("auto-expands a single page and uses the singular heading", () => {
    setup({ operations: [op("only", "desc")] });
    expect(screen.getByText(/\(1 page\)/)).toBeTruthy();
    const diff = screen.getByTestId("diff");
    expect(diff.dataset.hideActions).toBe("true");
    expect(diff.textContent).toBe("desc");
  });

  it("toggles a page section open and closed", () => {
    setup();
    fireEvent.click(screen.getByText("p1"));
    expect(screen.getAllByTestId("diff")).toHaveLength(1);
    fireEvent.click(screen.getByText("p1"));
    expect(screen.queryByTestId("diff")).toBeNull();
  });

  it("approves all pages with the tool call id and shows a busy label", async () => {
    let finish!: () => void;
    const { onApproveBatch } = setup();
    onApproveBatch.mockImplementation(() => new Promise<void>((r) => (finish = r)));
    fireEvent.click(screen.getByRole("button", { name: /Approve All/ }));
    expect(await screen.findByText(/Applying all pages/)).toBeTruthy();
    expect(onApproveBatch).toHaveBeenCalledWith("b1", "tc");
    finish();
    expect(await screen.findByText(/✓ Approve All/)).toBeTruthy();
  });

  it("requires a second step to reject, sending the typed reason", async () => {
    const { onRejectBatch } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Reject All/ }));
    expect(onRejectBatch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Reason (optional)"), {
      target: { value: "too risky" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onRejectBatch).toHaveBeenCalledWith("b1", "too risky"));
    // The reason input closes again once the rejection settles.
    await waitFor(() => expect(screen.queryByPlaceholderText("Reason (optional)")).toBeNull());
  });

  it("falls back to a default reason when none is typed", async () => {
    const { onRejectBatch } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Reject All/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(onRejectBatch).toHaveBeenCalledWith("b1", "User rejected batch"),
    );
  });

  it("dismisses itself on Close", () => {
    const { container } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Close/ }));
    expect(container.firstChild).toBeNull();
  });
});
