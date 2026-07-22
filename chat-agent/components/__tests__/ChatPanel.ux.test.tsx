import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatMessage } from "../ChatMessage";

// ChatPanel is wired to the real MicrositeContext (router, API calls, etc.).
// For these UX-focused tests we mock it so we can drive `isOpen`/microsite
// state without pulling in unrelated app machinery.
const mockUseMicrosite = jest.fn();
jest.mock("../../../src/app/context/MicrositeContext", () => ({
  useMicrosite: () => mockUseMicrosite(),
}));

describe("ChatMessage UX presentation", () => {
  it("renders a streaming affordance when _isStreaming is set", () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: "1",
          role: "assistant",
          content: "Thinking",
          _isStreaming: true,
        }}
      />,
    );

    expect(container.querySelector('[class*="streamingDots"]')).not.toBeNull();
    expect(container.querySelector('[class*="bubbleStreaming"]')).not.toBeNull();
  });

  it("does not render the streaming affordance once streaming clears", () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: "1",
          role: "assistant",
          content: "Done",
          _isStreaming: false,
        }}
      />,
    );

    expect(container.querySelector('[class*="streamingDots"]')).toBeNull();
    expect(container.querySelector('[class*="bubbleStreaming"]')).toBeNull();
  });

  it("renders an error-styled bubble with a Retry affordance that calls onRetry with the retry messages", () => {
    const onRetry = jest.fn();
    const retryMessages = [{ id: "u1", role: "user", content: "hello" }];

    render(
      <ChatMessage
        message={{
          id: "2",
          role: "assistant",
          content: "Chat request failed with status 500.",
          _isError: true,
          _retryMessages: retryMessages,
        }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Something went wrong")).not.toBeNull();
    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledWith(retryMessages);
  });

  it("does not render a Retry button for non-error messages", () => {
    render(
      <ChatMessage
        message={{ id: "3", role: "assistant", content: "All good" }}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  it.each([
    ["proposed", /pending review/i],
    ["applied", /applied/i],
    ["reverted", /reverted/i],
  ])(
    "renders a %s status chip for _changeStatus=%s",
    (status, expectedText) => {
      render(
        <ChatMessage
          message={{
            id: `chip-${status}`,
            role: "assistant",
            content: "Change message",
            _changeStatus: status,
          }}
        />,
      );

      expect(screen.getByText(expectedText)).not.toBeNull();
    },
  );

  it("renders no status chip when _changeStatus is absent", () => {
    const { container } = render(
      <ChatMessage
        message={{ id: "4", role: "assistant", content: "Plain message" }}
      />,
    );

    expect(container.querySelector('[class*="statusChip"]')).toBeNull();
  });
});

describe("ChatPanel session-restore pill", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseMicrosite.mockReturnValue({
      microsite: { code: "test-microsite" },
      activePageCode: "home",
      setActivePage: jest.fn(),
    });

    global.fetch = jest.fn((url: string) => {
      if (typeof url === "string" && url.includes("/api/session/restore")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              sessionId: "session-123",
              taskContext: {},
              pageOps: {},
              messages: [{ role: "assistant", content: "Welcome back" }],
            }),
        });
      }
      // /api/chat DB-init ping on open.
      return Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
    }) as unknown as typeof fetch;

    Storage.prototype.getItem = jest.fn(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows a declarative '↩ Session restored' pill after restoring a prior session, and auto-dismisses it after ~5s", async () => {
    // Require after mocks are set up so the module picks up the mocked context.
    const { ChatPanel } = require("../ChatPanel");

    render(<ChatPanel />);

    // Open the panel — triggers the session-restore fetch.
    fireEvent.click(screen.getByRole("button"));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText("↩ Session restored")).not.toBeNull();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText("↩ Session restored")).toBeNull();
    });
  });
});
