import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatMessage } from "../ChatMessage";

// Embedded cards are covered by their own suites; stub them to assert wiring.
jest.mock("../DslDiffViewer", () => ({
  DslDiffViewer: (p: any) => (
    <button onClick={() => p.onApprove(p.patchId, p.toolCallId, {})}>patch:{p.patchId}:{p.toolCallId}</button>
  ),
}));
jest.mock("../DslBatchDiffViewer", () => ({
  DslBatchDiffViewer: (p: any) => (
    <button onClick={() => p.onApproveBatch(p.batch.id)}>batch:{p.batch.id}:{p.toolCallId}</button>
  ),
}));
jest.mock("../RollbackPanel", () => ({
  RollbackPanel: (p: any) => (
    <button onClick={() => p.onRollback(p.history[0].id)}>rollback:{p.pagePath}:{p.history[0].id}</button>
  ),
}));
jest.mock("../CreatePageCard", () => ({
  CreatePageCard: (p: any) => (
    <button onClick={() => p.onCreate(p.micrositeId, p.suggestedName)}>create:{p.suggestedName}:{p.toolCallId}</button>
  ),
}));
jest.mock("../PageMapCard", () => ({
  PageMapCard: (p: any) => (
    <button onClick={() => p.onNavigate("x")}>map:{p.activePageCode}</button>
  ),
}));

const assistant = (extra: Record<string, unknown> = {}) => ({
  id: "m",
  role: "assistant",
  content: "Hello",
  ...extra,
});

describe("ChatMessage presentation", () => {
  it("labels user and assistant messages and renders assistant text as markdown", () => {
    const { rerender } = render(<ChatMessage message={assistant({ content: "**bold**" })} />);
    expect(screen.getByText("LayoutX")).toBeTruthy();
    expect(screen.getByText("bold").tagName).toBe("STRONG");

    rerender(<ChatMessage message={{ id: "u", role: "user", content: "**raw**" }} />);
    expect(screen.getByText("You")).toBeTruthy();
    expect(screen.getByText("**raw**")).toBeTruthy();
  });

  it("renders a streaming affordance only while _isStreaming is set", () => {
    const { container, rerender } = render(
      <ChatMessage message={assistant({ content: "Thinking", _isStreaming: true })} />,
    );
    expect(container.querySelector('[class*="streamingDots"]')).not.toBeNull();
    expect(container.querySelector('[class*="bubbleStreaming"]')).not.toBeNull();

    rerender(<ChatMessage message={assistant({ content: "Done", _isStreaming: false })} />);
    expect(container.querySelector('[class*="streamingDots"]')).toBeNull();
    expect(container.querySelector('[class*="bubbleStreaming"]')).toBeNull();
  });

  it("renders an error bubble whose Retry calls onRetry with the retry messages", () => {
    const onRetry = jest.fn();
    const retryMessages = [{ id: "u1", role: "user", content: "hello" }];
    render(
      <ChatMessage
        message={assistant({ content: "failed", _isError: true, _retryMessages: retryMessages })}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Something went wrong")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledWith(retryMessages);
  });

  it("omits Retry for non-error messages and when no handler is given", () => {
    const { rerender } = render(<ChatMessage message={assistant()} onRetry={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
    rerender(<ChatMessage message={assistant({ _isError: true })} />);
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  it.each([
    ["proposed", /pending review/i],
    ["applied", /applied/i],
    ["reverted", /reverted/i],
  ])("renders a status chip for _changeStatus=%s", (status, expectedText) => {
    render(<ChatMessage message={assistant({ _changeStatus: status })} />);
    expect(screen.getByText(expectedText)).not.toBeNull();
  });

  it("renders no status chip when _changeStatus is absent", () => {
    const { container } = render(<ChatMessage message={assistant()} />);
    expect(container.querySelector('[class*="statusChip"]')).toBeNull();
  });

  it("summarises attached images by name or by count", () => {
    const { rerender } = render(
      <ChatMessage message={{ id: "u", role: "user", content: "x", _attachedImageNames: ["a.png"] }} />,
    );
    expect(screen.getByText("a.png")).toBeTruthy();
    rerender(
      <ChatMessage message={{ id: "u", role: "user", content: "x", _attachedImageNames: ["a.png", "b.png"] }} />,
    );
    expect(screen.getByText("2 images attached")).toBeTruthy();
    rerender(<ChatMessage message={{ id: "u", role: "user", content: "x", _attachedImageNames: [] }} />);
    expect(screen.queryByText(/attached/)).toBeNull();
  });
});

describe("ChatMessage proposal cards", () => {
  it("shows a Preview button for patch and batch proposals that opens the preview with the message", () => {
    const onOpenPreview = jest.fn();
    const message = assistant({ type: "patch_proposed", patch: { id: "p1" }, tool_call_id: "t1" });
    const { rerender } = render(<ChatMessage message={message} onOpenPreview={onOpenPreview} onApprove={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /preview components/i }));
    expect(onOpenPreview).toHaveBeenCalledWith(message);

    rerender(
      <ChatMessage
        message={assistant({ type: "batch_proposed", batch: { id: "b1" } })}
        onOpenPreview={onOpenPreview}
      />,
    );
    expect(screen.getByRole("button", { name: /preview components/i })).toBeTruthy();

    rerender(<ChatMessage message={message} />);
    expect(screen.queryByRole("button", { name: /preview components/i })).toBeNull();
  });

  it("wires a patch proposal to the diff viewer", () => {
    const onApprove = jest.fn();
    render(
      <ChatMessage
        message={assistant({ type: "patch_proposed", patch: { id: "p1" }, tool_call_id: "t1" })}
        onApprove={onApprove}
      />,
    );
    fireEvent.click(screen.getByText("patch:p1:t1"));
    expect(onApprove).toHaveBeenCalledWith("p1", "t1", {});
  });

  it("wires a batch proposal to the batch viewer", () => {
    const onApproveBatch = jest.fn();
    render(
      <ChatMessage
        message={assistant({ type: "batch_proposed", batch: { id: "b1" }, tool_call_id: "t2" })}
        onApproveBatch={onApproveBatch}
      />,
    );
    fireEvent.click(screen.getByText("batch:b1:t2"));
    expect(onApproveBatch).toHaveBeenCalledWith("b1");
  });

  it("wires a page-creation proposal to the create card", () => {
    const onCreatePage = jest.fn();
    render(
      <ChatMessage
        message={assistant({
          type: "page_creation_proposed",
          pageCreation: { micrositeId: "ms", suggestedName: "Banks" },
          tool_call_id: "t3",
        })}
        onCreatePage={onCreatePage}
      />,
    );
    fireEvent.click(screen.getByText("create:Banks:t3"));
    expect(onCreatePage).toHaveBeenCalledWith("ms", "Banks");
  });

  it("wires a rollback proposal to a single-entry rollback panel", () => {
    const onRollback = jest.fn();
    render(
      <ChatMessage
        message={assistant({
          type: "rollback_proposed",
          rollback: { historyId: "h1", micrositeId: "ms", pagePath: "home", createdAt: "now" },
        })}
        onRollback={onRollback}
      />,
    );
    fireEvent.click(screen.getByText("rollback:home:h1"));
    expect(onRollback).toHaveBeenCalledWith("h1");
  });

  it("wires a page map to navigation and the active page", () => {
    const onNavigatePage = jest.fn();
    render(
      <ChatMessage
        message={assistant({ type: "page_map", pageMap: { nodes: [] } })}
        onNavigatePage={onNavigatePage}
        activePageCode="home"
      />,
    );
    fireEvent.click(screen.getByText("map:home"));
    expect(onNavigatePage).toHaveBeenCalledWith("x");
  });

  it("renders no card when the proposal payload is missing", () => {
    render(<ChatMessage message={assistant({ type: "patch_proposed" })} />);
    expect(screen.queryByText(/^patch:/)).toBeNull();
  });
});
