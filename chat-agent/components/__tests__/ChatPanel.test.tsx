import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { ChatPanel } from "../ChatPanel";

const mockUseMicrosite = jest.fn();
jest.mock("../../../src/app/context/MicrositeContext", () => ({
  useMicrosite: () => mockUseMicrosite(),
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ workspaceCode: "ws1" }),
}));
jest.mock("../../lib/added-components", () => ({
  extractAddedComponents: jest.fn((ops: any[] = []) =>
    ops.map((o) => ({ type: o.type, fields: [], children: [], op: "add" })),
  ),
  extractAddedRawNodes: jest.fn((ops: any[] = []) => ops.map((o) => ({ type: o.type }))),
}));

// The message renderer is covered by ChatMessage.test; here it exposes the
// ChatPanel callbacks as buttons on a message whose content is "ACTIONS".
jest.mock("../ChatMessage", () => ({
  ChatMessage: (p: any) => (
    <div data-testid="msg" data-error={p.message._isError ? "1" : ""}>
      <span>{p.message.content}</span>
      {p.message._isError && (
        <button onClick={() => p.onRetry(p.message._retryMessages)}>retry</button>
      )}
      {p.message.content === "ACTIONS" && (
        <>
          <button onClick={() => p.onApprove("pid", "tc", { x: 1 })}>approve</button>
          <button onClick={() => p.onReject("pid", "nope", "tc")}>reject</button>
          <button onClick={() => p.onApproveBatch("bid", "tc")}>approveBatch</button>
          <button onClick={() => p.onRejectBatch("bid", "why")}>rejectBatch</button>
          <button onClick={() => p.onRejectBatch("bid")}>rejectBatchNoReason</button>
          <button onClick={() => p.onCreatePage("ms-card", "  New Page ", true, "tc")}>createPage</button>
          <button onClick={() => p.onCreatePage("", "New", false, "tc")}>createPageFallbackMs</button>
          <button onClick={() => p.onCreatePage("ms", "   ", false)}>createBlank</button>
          <button onClick={() => p.onCancelCreatePage()}>cancelCreate</button>
          <button onClick={() => p.onRollback("h1")}>rollback</button>
          <button onClick={() => p.onOpenPreview(p.message)}>preview</button>
          <button onClick={() => p.onNavigatePage("target")}>navigate</button>
          <button onClick={() => p.onRetry(undefined)}>retryFallback</button>
        </>
      )}
    </div>
  ),
}));
jest.mock("../PatchPreviewPanel", () => ({
  PatchPreviewPanel: (p: any) =>
    p.open ? (
      <div data-testid="preview">
        <span>{p.title}</span>
        <span>{p.subtitle}</span>
        <button onClick={p.onClose}>close-preview</button>
      </div>
    ) : null,
}));

const setActivePage = jest.fn();
const addPage = jest.fn();
let microsite: { code?: string };

const res = (body: unknown, ok = true, status = ok ? 200 : 500) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
});

const encoder = new TextEncoder();
const streamRes = (...events: unknown[]) => {
  const queue = [
    encoder.encode(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("")),
  ];
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    body: {
      getReader: () => ({
        read: async () =>
          queue.length ? { value: queue.shift(), done: false } : { value: undefined, done: true },
      }),
    },
  };
};

type Handler = (url: string, init?: RequestInit) => unknown;
let restored: any;
let handler: Handler;
const defaultHandler: Handler = (url) => {
  if (url.startsWith("/api/session/restore")) return res(restored);
  return res({ ok: true });
};

const calls = (prefix: string) =>
  (global.fetch as jest.Mock).mock.calls.filter(([u]) => String(u).startsWith(prefix));
const lastBody = (prefix: string) => JSON.parse(calls(prefix).at(-1)![1].body);

const ACTIONS_MESSAGE = {
  role: "assistant",
  content: "ACTIONS",
  type: "patch_proposed",
  patch: { id: "p", patch: [{ type: "form" }], description: "Add form" },
};

const open = async () => {
  const utils = render(<ChatPanel />);
  fireEvent.click(screen.getByRole("button"));
  await screen.findByText("LayoutX");
  return utils;
};
const openWithActions = async () => {
  restored = { sessionId: "canon", taskContext: { t: 1 }, pageOps: { home: [] }, messages: [ACTIONS_MESSAGE] };
  const utils = await open();
  await screen.findByText("ACTIONS");
  return utils;
};
const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
};
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  microsite = { code: "ms" };
  restored = { messages: [] };
  handler = defaultHandler;
  mockUseMicrosite.mockImplementation(() => ({
    microsite,
    activePageCode: "home",
    setActivePage,
    addPage,
  }));
  global.fetch = jest.fn(async (url: string, init?: RequestInit) =>
    handler(url, init),
  ) as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  setActivePage.mockClear();
  addPage.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

describe("launcher and panel chrome", () => {
  it("greets on hover, opens on click and closes again", async () => {
    render(<ChatPanel />);
    const launcher = screen.getByRole("button");
    fireEvent.mouseEnter(launcher);
    expect(screen.getByText("Ask LayoutX")).toBeTruthy();
    fireEvent.mouseLeave(launcher);
    expect(screen.queryByText("Ask LayoutX")).toBeNull();

    fireEvent.click(launcher);
    expect(await screen.findByText("LayoutX")).toBeTruthy();
    expect(calls("/api/chat")).toHaveLength(1);

    fireEvent.click(document.querySelector('[class*="closeButton"]')!);
    expect(screen.queryByText("LayoutX")).toBeNull();
  });

  it("resizes by dragging the handle within bounds and ignores out-of-range drags", async () => {
    const { container } = await open();
    const panel = container.querySelector("#chat-panel-container") as HTMLElement;
    const handle = container.querySelector('[class*="resizeHandle"]') as HTMLElement;
    expect(panel.style.width).toBe("450px");

    fireEvent.mouseEnter(handle);
    fireEvent.mouseDown(handle);
    expect(container.querySelector('[class*="resizeOverlay"]')).not.toBeNull();
    fireEvent.mouseMove(document, { clientX: window.innerWidth - 600 });
    expect(panel.style.width).toBe("600px");
    fireEvent.mouseMove(document, { clientX: window.innerWidth - 100 });
    expect(panel.style.width).toBe("600px");

    fireEvent.mouseUp(document);
    expect(container.querySelector('[class*="resizeOverlay"]')).toBeNull();
    fireEvent.mouseLeave(handle);
    fireEvent.mouseMove(document, { clientX: window.innerWidth - 700 });
    expect(panel.style.width).toBe("600px");
  });

  it("without a microsite the input is disabled and no starter pills appear", async () => {
    microsite = { code: "  " };
    await open();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByPlaceholderText(/Open a microsite configurator page/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Attach files" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Try")).toBeNull();
    // No session restore without a microsite.
    expect(calls("/api/session/restore")).toHaveLength(0);
  });
});

describe("session restore", () => {
  beforeEach(() => {
    sessionStorage.setItem("accessToken", "tok");
  });

  it("restores messages, shows the pill for 5s and reuses the canonical session id", async () => {
    jest.useFakeTimers();
    try {
      restored = {
        sessionId: "canon",
        taskContext: { t: 1 },
        pageOps: { home: [] },
        messages: [{ role: "assistant", content: "Welcome back" }],
      };
      render(<ChatPanel />);
      fireEvent.click(screen.getByRole("button"));
      expect(await screen.findByText("↩ Session restored")).toBeTruthy();
      expect(screen.getByText("Welcome back")).toBeTruthy();
      expect(calls("/api/session/restore")[0][1].headers).toEqual({ Authorization: "Bearer tok" });
      expect(String(calls("/api/session/restore")[0][0])).toContain("micrositeId=ms");

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.queryByText("↩ Session restored")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("sends the canonical session id, task context and workspace on the next turn", async () => {
    restored = {
      sessionId: "canon",
      taskContext: { t: 1 },
      pageOps: { home: [] },
      messages: [{ role: "assistant", content: "Hi" }],
    };
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "ok" }) : defaultHandler(url));
    await open();
    await screen.findByText("Hi");
    send("hello");
    await screen.findByText("ok");

    const body = lastBody("/api/chat");
    expect(body).toMatchObject({
      sessionId: "canon",
      micrositeId: "ms",
      pageCode: "home",
      id: "home",
      workspaceCode: "ws1",
      taskContext: { t: 1 },
      pageOps: { home: [] },
    });
    expect(body.clientSessionId).toBeTruthy();
    expect(body.clientSessionId).not.toBe("canon");
    expect(body.messages.map((m: any) => m.content)).toEqual(["Hi", "hello"]);
  });

  it("does not overwrite an existing conversation or show the pill when nothing was saved", async () => {
    await open();
    await waitFor(() => expect(calls("/api/session/restore")).toHaveLength(1));
    expect(screen.queryByText("↩ Session restored")).toBeNull();
  });

  it("logs when the restore request fails", async () => {
    handler = (url) => {
      if (url.startsWith("/api/session/restore")) throw new Error("down");
      return res({});
    };
    await open();
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith("Failed to restore session", expect.anything()),
    );
  });

  it("logs when the DB warm-up ping fails", async () => {
    handler = (url) => {
      if (url === "/api/chat") throw new Error("db");
      return defaultHandler(url);
    };
    await open();
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Failed to init DB connection on window open:",
        expect.anything(),
      ),
    );
  });
});

describe("sending messages", () => {
  it("streams the reply with auth headers, then offers suggestion pills that send their value", async () => {
    sessionStorage.setItem("accessToken", "tok");
    sessionStorage.setItem("global.login.userDetails", JSON.stringify({ userId: 7 }));
    handler = (url, init) => {
      if (init?.method !== "POST") return defaultHandler(url);
      return streamRes(
        { type: "text_chunk", content: "Hi " },
        { type: "text_chunk", content: "there" },
        { type: "suggestions", suggestions: [{ id: "s", label: "Do more", value: "more please" }] },
      );
    };
    await open();
    // Starter pills show on an empty conversation.
    expect(screen.getByText("Try")).toBeTruthy();

    send("  hello  ");
    expect(await screen.findByText("Hi there")).toBeTruthy();
    expect(screen.getByText("hello")).toBeTruthy();
    expect(calls("/api/chat").at(-1)![1].headers).toMatchObject({
      Authorization: "Bearer tok",
      "x-user-id": "7",
      "Content-Type": "application/json",
    });
    expect(lastBody("/api/chat").attachments).toBeUndefined();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");

    fireEvent.click(await screen.findByRole("button", { name: "Do more" }));
    await waitFor(() => expect(lastBody("/api/chat").messages.at(-1).content).toBe("more please"));
  });

  it("starter pills send their prompt as the first message", async () => {
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "ok" }) : defaultHandler(url));
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Add a form" }));
    await screen.findByText("ok");
    expect(lastBody("/api/chat").messages[0].content).toMatch(/Add a form/);
  });

  it("sends on Enter, not on Shift+Enter, and never for blank input", async () => {
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "ok" }) : defaultHandler(url));
    await open();
    const box = screen.getByRole("textbox");
    expect((screen.getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.keyDown(box, { key: "Enter" });
    expect(calls("/api/chat").filter(([, i]) => i?.method === "POST")).toHaveLength(0);

    fireEvent.change(box, { target: { value: "line" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(calls("/api/chat").filter(([, i]) => i?.method === "POST")).toHaveLength(0);

    fireEvent.keyDown(box, { key: "Enter" });
    await screen.findByText("ok");
    expect(calls("/api/chat").filter(([, i]) => i?.method === "POST")).toHaveLength(1);
  });

  it("shows progress while waiting, locks the input, and Stop cancels the request", async () => {
    handler = (url, init) => {
      if (init?.method !== "POST") return defaultHandler(url);
      return new Promise((_, reject) =>
        init.signal!.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        ),
      );
    };
    await open();
    send("slow");
    expect(await screen.findByText("Agent is thinking...")).toBeTruthy();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByLabelText("Request in progress")).toBeTruthy();

    click("Stop generating");
    expect(await screen.findByText("Request stopped.")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Agent is thinking...")).toBeNull());
    expect(screen.queryByText(/went wrong|Sorry/)).toBeNull();
  });

  it.each([
    ["an error body with a message", res({ message: "Quota exceeded" }, false, 429), "Quota exceeded"],
    ["an unparseable error body", { ok: false, status: 503, json: () => Promise.reject(new Error("x")) }, "Chat request failed with status 503."],
    ["a missing stream", { ok: true, status: 200, body: null }, "Chat response stream was empty."],
  ])("shows an error bubble for %s and Retry re-sends the same messages", async (_label, failure, expected) => {
    let attempt = 0;
    handler = (url, init) => {
      if (init?.method !== "POST") return defaultHandler(url);
      attempt += 1;
      return attempt === 1 ? failure : streamRes({ type: "text_chunk", content: "recovered" });
    };
    await open();
    send("go");
    expect(await screen.findByText(expected)).toBeTruthy();

    click("retry");
    expect(await screen.findByText("recovered")).toBeTruthy();
    const posts = calls("/api/chat").filter(([, i]) => i?.method === "POST");
    expect(JSON.parse(posts[1][1].body).messages).toEqual(JSON.parse(posts[0][1].body).messages);
  });

  it("falls back to a generic message when a non-Error is thrown", async () => {
    handler = (url, init) => {
      if (init?.method !== "POST") return defaultHandler(url);
      return Promise.reject("weird");
    };
    await open();
    send("go");
    expect(await screen.findByText("Sorry, I encountered an error.")).toBeTruthy();
  });

  it("applies navigate events from the stream", async () => {
    handler = (url, init) =>
      init?.method === "POST"
        ? streamRes({ type: "navigate", pageCode: "other", reason: "r" }, { type: "text_chunk", content: "done" })
        : defaultHandler(url);
    await open();
    send("go there");
    await screen.findByText("done");
    expect(setActivePage).toHaveBeenCalledWith("other");
  });

  it("Retry without stored retry messages resends the visible history", async () => {
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "again" }) : defaultHandler(url));
    await openWithActions();
    click("retryFallback");
    await screen.findByText("again");
    expect(lastBody("/api/chat").messages.map((m: any) => m.content)).toEqual(["ACTIONS"]);
  });
});

describe("attachments", () => {
  const fileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;
  const pick = (container: HTMLElement, files: File[]) =>
    fireEvent.change(fileInput(container), { target: { files } });
  const png = (name = "a.png") => new File(["x"], name, { type: "image/png" });
  const txt = (name = "a.txt") => new File(["x"], name, { type: "text/plain" });

  it("previews images and documents, lets the user remove them, and rejects unsupported or oversized files", async () => {
    const { container } = await open();
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 50 * 1024 * 1024 });
    pick(container, [png(), txt(), new File(["x"], "evil.exe", { type: "application/x-msdownload" }), big]);

    expect(await screen.findByAltText("a.png")).toBeTruthy();
    expect(screen.getByText("TXT · 1 B")).toBeTruthy();
    expect(await screen.findByText(/"evil.exe" is not a supported file type/)).toBeTruthy();
    expect(screen.getByText(/"big.png" is too large/)).toBeTruthy();
    expect(screen.getByPlaceholderText(/attached file/)).toBeTruthy();

    click("Remove a.png");
    expect(screen.queryByAltText("a.png")).toBeNull();
    click("Remove a.txt");
    expect(screen.queryByText("TXT · 1 B")).toBeNull();
  });

  it("sends an image-only message with a default prompt and the encoded attachment", async () => {
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "ok" }) : defaultHandler(url));
    const { container } = await open();
    pick(container, [png()]);
    await screen.findByAltText("a.png");
    click("Send message");
    await screen.findByText("ok");

    const body = lastBody("/api/chat");
    expect(body.messages[0].content).toBe("Configure this page to match the attached design.");
    expect(body.attachments).toEqual([{ kind: "image", format: "png", name: "a.png", dataBase64: "eA==" }]);
    // Attachments are cleared after sending.
    expect(screen.queryByAltText("a.png")).toBeNull();
  });

  it("uses a document-specific prompt when only documents are attached", async () => {
    handler = (url, init) => (init?.method === "POST" ? streamRes({ type: "text_chunk", content: "ok" }) : defaultHandler(url));
    const { container } = await open();
    pick(container, [txt("a.txt"), txt("b.txt")]);
    await screen.findByText("TXT · 1 B", { selector: "span" }).catch(() => null);
    await waitFor(() => expect(screen.getAllByText("TXT · 1 B")).toHaveLength(2));
    click("Send message");
    await screen.findByText("ok");
    expect(lastBody("/api/chat").messages[0].content).toBe("Use the attached files as input.");
  });

  it("caps attachments and tells the user which file was skipped", async () => {
    const { container } = await open();
    pick(container, ["1", "2", "3", "4", "5", "6"].map((n) => txt(`f${n}.txt`)));
    expect(await screen.findByText(/up to 5 files.*"f6.txt" was skipped/)).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("TXT · 1 B")).toHaveLength(5));
    expect((screen.getByRole("button", { name: "Attach files" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores an empty selection and opens the picker from the attach button", async () => {
    const { container } = await open();
    const clickSpy = jest.spyOn(fileInput(container), "click").mockImplementation(() => {});
    pick(container, []);
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    click("Attach files");
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe("proposal actions", () => {
  const failWith = (prefix: string, body: unknown, ok = false) => {
    handler = (url, init) => (url.startsWith(prefix) ? res(body, ok) : defaultHandler(url, init));
  };

  it("approves a patch with the edited DSL and records the outcome", async () => {
    handler = (url) => (url === "/api/patch/approve" ? res({ ok: true }) : defaultHandler(url));
    await openWithActions();
    click("preview");
    expect(screen.getByTestId("preview")).toBeTruthy();

    click("approve");
    expect(await screen.findByText(/DSL patch approved and saved/)).toBeTruthy();
    expect(JSON.parse(calls("/api/patch/approve")[0][1].body)).toEqual({
      patchId: "pid",
      toolCallId: "tc",
      editedDsl: { x: 1 },
    });
    expect(screen.queryByTestId("preview")).toBeNull();
  });

  it.each([
    ["a server error message", { error: "Conflict" }, "Conflict"],
    ["a non-string error", { error: { code: 1 } }, "Patch approval failed."],
  ])("surfaces patch approval failure with %s", async (_l, body, expected) => {
    failWith("/api/patch/approve", body);
    await openWithActions();
    click("approve");
    expect(await screen.findByText(expected)).toBeTruthy();
  });

  it("rejects a patch, returns the tool result to the agent and lets it respond", async () => {
    handler = (url, init) => {
      if (url === "/api/patch/reject") return res({ rejected: true });
      return init?.method === "POST" ? streamRes({ type: "text_chunk", content: "Understood" }) : defaultHandler(url);
    };
    await openWithActions();
    click("reject");
    expect(await screen.findByText("Understood")).toBeTruthy();
    expect(JSON.parse(calls("/api/patch/reject")[0][1].body)).toEqual({ patchId: "pid", reason: "nope" });
    const toolMsg = lastBody("/api/chat").messages.find((m: any) => m.role === "tool");
    expect(toolMsg).toMatchObject({ tool_call_id: "tc", name: "propose_dsl_patch", content: '{"rejected":true}' });
  });

  it("surfaces patch rejection failure", async () => {
    failWith("/api/patch/reject", { error: "Cannot reject" });
    await openWithActions();
    click("reject");
    expect(await screen.findByText("Cannot reject")).toBeTruthy();
  });

  it("applies a batch and navigates when the server asks for it", async () => {
    handler = (url) =>
      url === "/api/patch/approve-batch" ? res({ success: true, navigateTo: "page2" }) : defaultHandler(url);
    await openWithActions();
    click("approveBatch");
    expect(await screen.findByText(/DSL batch approved and saved/)).toBeTruthy();
    expect(setActivePage).toHaveBeenCalledWith("page2");
    expect(JSON.parse(calls("/api/patch/approve-batch")[0][1].body)).toEqual({ batchId: "bid", toolCallId: "tc" });
  });

  it("does not navigate after a batch without navigateTo", async () => {
    handler = (url) => (url === "/api/patch/approve-batch" ? res({ success: true }) : defaultHandler(url));
    await openWithActions();
    click("approveBatch");
    await screen.findByText(/DSL batch approved/);
    expect(setActivePage).not.toHaveBeenCalled();
  });

  it.each([
    [
      "lists pages whose compensation failed",
      { success: false, error: "Page p2 failed", compensationErrors: [{ pagePath: "p1" }, { pagePath: "p3" }] },
      "Page p2 failed Compensation also failed on: p1, p3. Manual verification required.",
    ],
    ["falls back to a generic message", { success: false }, "Batch approval failed."],
  ])("batch approval failure %s", async (_l, body, expected) => {
    failWith("/api/patch/approve-batch", body, true);
    await openWithActions();
    click("approveBatch");
    expect(await screen.findByText(expected)).toBeTruthy();
  });

  it("rejects a batch with and without a reason", async () => {
    handler = (url) => (url === "/api/patch/reject-batch" ? res({ ok: true }) : defaultHandler(url));
    await openWithActions();
    click("rejectBatch");
    click("rejectBatchNoReason");
    await waitFor(() => expect(calls("/api/patch/reject-batch")).toHaveLength(2));
    expect(calls("/api/patch/reject-batch").map(([, i]) => JSON.parse(i.body))).toEqual([
      { batchId: "bid", reason: "why" },
      { batchId: "bid" },
    ]);
    expect(document.querySelector('[data-error="1"]')).toBeNull();
  });

  it("surfaces batch rejection failure", async () => {
    failWith("/api/patch/reject-batch", {});
    await openWithActions();
    click("rejectBatch");
    expect(await screen.findByText("Batch rejection failed.")).toBeTruthy();
  });

  it("creates a popup page, syncs the editor, and hands the result back to the agent", async () => {
    handler = (url, init) => {
      if (url === "/api/page/create") {
        return res({ success: true, pageCode: "ms_new_page", pageVersion: 1, isPopup: true });
      }
      return init?.method === "POST" ? streamRes({ type: "text_chunk", content: "Routed" }) : defaultHandler(url);
    };
    await openWithActions();
    click("createPage");
    expect(await screen.findByText("Routed")).toBeTruthy();

    expect(JSON.parse(calls("/api/page/create")[0][1].body)).toEqual({
      micrositeId: "ms-card",
      name: "New Page",
      isPopup: true,
      workspaceCode: "ws1",
    });
    expect(addPage).toHaveBeenCalledWith("ms_new_page");
    expect(setActivePage).toHaveBeenCalledWith("ms_new_page");
    expect(screen.getByText(/Created page "New Page" \(code: ms_new_page\).*popup/)).toBeTruthy();
    const toolMsg = lastBody("/api/chat").messages.find((m: any) => m.role === "tool");
    expect(JSON.parse(toolMsg.content)).toEqual({ success: true, pageCode: "ms_new_page", pageVersion: 1, isPopup: true });
  });

  it.each([
    ["a popup warning", { popupWarning: "could not style" }, /Note: could not style/],
    ["no popup note", {}, /navigated to it\.$/],
  ])("page creation with %s", async (_l, extra, pattern) => {
    handler = (url, init) => {
      if (url === "/api/page/create") return res({ success: true, pageCode: "ms_p", isPopup: false, ...extra });
      return init?.method === "POST" ? streamRes() : defaultHandler(url);
    };
    await openWithActions();
    click("createPageFallbackMs");
    expect(await screen.findByText(pattern)).toBeTruthy();
    expect(JSON.parse(calls("/api/page/create")[0][1].body).micrositeId).toBe("ms");
  });

  it("asks for a name when the page name is blank, without calling the API", async () => {
    await openWithActions();
    click("createBlank");
    expect(await screen.findByText("Please enter a page name.")).toBeTruthy();
    expect(calls("/api/page/create")).toHaveLength(0);
  });

  it("surfaces page creation failure", async () => {
    failWith("/api/page/create", { success: false, error: "Name taken" }, true);
    await openWithActions();
    click("createPage");
    expect(await screen.findByText("Name taken")).toBeTruthy();
    expect(addPage).not.toHaveBeenCalled();
  });

  it("cancelling page creation keeps the conversation without calling the API", async () => {
    await openWithActions();
    click("cancelCreate");
    expect(screen.getByText("ACTIONS")).toBeTruthy();
    expect(calls("/api/page/create")).toHaveLength(0);
  });

  it("rolls back the active page", async () => {
    handler = (url) => (url === "/api/patch/rollback" ? res({ ok: true }) : defaultHandler(url));
    await openWithActions();
    click("rollback");
    expect(await screen.findByText(/Rollback applied successfully/)).toBeTruthy();
    expect(JSON.parse(calls("/api/patch/rollback")[0][1].body)).toEqual({
      micrositeId: "ms",
      pagePath: "home",
      historyId: "h1",
    });
  });

  it("surfaces rollback failure", async () => {
    failWith("/api/patch/rollback", { error: "No such history" });
    await openWithActions();
    click("rollback");
    expect(await screen.findByText("No such history")).toBeTruthy();
  });

  it("navigates to a page chosen in a message card", async () => {
    await openWithActions();
    click("navigate");
    expect(setActivePage).toHaveBeenCalledWith("target");
  });

  it("opens the preview with the change summary and closes it again", async () => {
    await openWithActions();
    click("preview");
    const preview = screen.getByTestId("preview");
    expect(within(preview).getByText("Preview · 1 component")).toBeTruthy();
    expect(within(preview).getByText("Add form")).toBeTruthy();
    click("close-preview");
    expect(screen.queryByTestId("preview")).toBeNull();
  });

  it("explains itself when the microsite disappears before retry or rollback", async () => {
    const { rerender } = await openWithActions();
    microsite = { code: "" };
    rerender(<ChatPanel />);
    click("retryFallback");
    expect(await screen.findByText("Open a microsite configurator page before using the assistant.")).toBeTruthy();
    click("rollback");
    expect(await screen.findByText("Open a microsite configurator page before rolling back.")).toBeTruthy();
  });
});
