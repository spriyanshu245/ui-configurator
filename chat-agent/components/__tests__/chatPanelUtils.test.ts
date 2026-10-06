import {
  attachmentOnlyContent,
  buildAuthHeaders,
  buildChatRequestBody,
  buildPreviewData,
  checkAttachment,
  clampPanelWidth,
  createMessage,
  createStreamSession,
  describeFailedResponse,
  errorMessageOf,
  errorText,
  inputPlaceholder,
  postJson,
  toAttachedFile,
  tooManyFilesNote,
  toRouteMessages,
  withoutStatusMessages,
  type AttachedFile,
  type ChatPanelMessage,
} from "../chatPanelUtils";

jest.mock("../../lib/added-components", () => ({
  extractAddedComponents: jest.fn((ops: any[] = []) =>
    ops.map((o) => ({ type: o.type, fields: [], children: [], op: "add" })),
  ),
  extractAddedRawNodes: jest.fn((ops: any[] = []) => ops.map((o) => ({ type: o.type }))),
}));

const file = (name: string, type: string, size = 10) => {
  const f = new File(["abc"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("buildAuthHeaders", () => {
  afterEach(() => sessionStorage.clear());

  it("returns just the base headers when nothing is stored", () => {
    expect(buildAuthHeaders({ A: "1" })).toEqual({ A: "1" });
    expect(buildAuthHeaders()).toEqual({});
  });

  it("adds the bearer token and x-user-id (stringified)", () => {
    sessionStorage.setItem("accessToken", "tok");
    sessionStorage.setItem("global.login.userDetails", JSON.stringify({ userId: 42 }));
    expect(buildAuthHeaders()).toEqual({ Authorization: "Bearer tok", "x-user-id": "42" });
  });

  it.each([
    ["empty userId", JSON.stringify({ userId: "" })],
    ["null userId", JSON.stringify({ userId: null })],
    ["missing userId", JSON.stringify({})],
  ])("omits x-user-id for %s", (_label, raw) => {
    sessionStorage.setItem("global.login.userDetails", raw);
    expect(buildAuthHeaders()).toEqual({});
  });

  it("keeps what it has when stored user details are not valid JSON", () => {
    sessionStorage.setItem("accessToken", "tok");
    sessionStorage.setItem("global.login.userDetails", "{not json");
    expect(buildAuthHeaders()).toEqual({ Authorization: "Bearer tok" });
  });
});

describe("postJson / error helpers", () => {
  it("POSTs JSON with auth headers and returns response + parsed body", async () => {
    sessionStorage.setItem("accessToken", "t");
    const response = { ok: true, json: () => Promise.resolve({ done: 1 }) };
    global.fetch = jest.fn().mockResolvedValue(response) as any;
    const result = await postJson("/x", { a: 1 });
    expect(result).toEqual({ response, data: { done: 1 } });
    expect(global.fetch).toHaveBeenCalledWith("/x", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer t" },
      body: '{"a":1}',
    });
    sessionStorage.clear();
  });

  it("errorText prefers a string server error", () => {
    expect(errorText({ error: "bad" }, "fb")).toBe("bad");
    expect(errorText({ error: 5 }, "fb")).toBe("fb");
    expect(errorText(null, "fb")).toBe("fb");
  });

  it("errorMessageOf unwraps Error instances only", () => {
    expect(errorMessageOf(new Error("e"), "fb")).toBe("e");
    expect(errorMessageOf("str", "fb")).toBe("fb");
  });

  it.each([
    [{ message: "m", error: "e" }, "m"],
    [{ error: "e" }, "e"],
    [{}, "Chat request failed with status 502."],
  ])("describeFailedResponse reads %j", async (body, expected) => {
    const res = { status: 502, json: () => Promise.resolve(body) } as unknown as Response;
    expect(await describeFailedResponse(res)).toBe(expected);
  });

  it("describeFailedResponse falls back when the body is not JSON", async () => {
    const res = { status: 500, json: () => Promise.reject(new Error("x")) } as unknown as Response;
    expect(await describeFailedResponse(res)).toBe("Chat request failed with status 500.");
  });
});

describe("message helpers", () => {
  it("createMessage assigns unique ids", () => {
    const a = createMessage({ role: "user", content: "a" });
    const b = createMessage({ role: "user", content: "a" });
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });

  it("withoutStatusMessages and toRouteMessages strip UI-only fields", () => {
    const msgs = [
      createMessage({ role: "assistant", content: "s", _isStatus: true }),
      createMessage({ role: "user", content: "u", _attachedImageNames: ["a"] }),
    ];
    const kept = withoutStatusMessages(msgs);
    expect(kept).toHaveLength(1);
    expect(toRouteMessages(kept)).toEqual([
      { role: "user", content: "u", name: undefined, tool_call_id: undefined, tool_calls: undefined },
    ]);
  });

  it("buildChatRequestBody maps attachments and omits them when empty", () => {
    const base = {
      messages: [createMessage({ role: "user", content: "hi" })],
      micrositeId: "ms",
      activePageCode: "home",
      sessionId: "s",
      clientSessionId: "c",
    };
    const files: AttachedFile[] = [
      { id: "1", name: "a.png", kind: "image", format: "png", size: 1, dataBase64: "AAA", previewUrl: "data:" },
    ];
    const withFiles = JSON.parse(buildChatRequestBody({ ...base, files }));
    expect(withFiles.attachments).toEqual([
      { kind: "image", format: "png", name: "a.png", dataBase64: "AAA" },
    ]);
    expect(withFiles.pageCode).toBe("home");
    expect(withFiles.id).toBe("home");
    expect(JSON.parse(buildChatRequestBody({ ...base, files: [] })).attachments).toBeUndefined();
  });

  it.each([
    [[{ kind: "image" }], "Configure this page to match the attached design."],
    [[{ kind: "image" }, { kind: "document" }], "Configure this page to match the attached designs."],
    [[{ kind: "document" }], "Use the attached file as input."],
    [[{ kind: "document" }, { kind: "document" }], "Use the attached files as input."],
  ])("attachmentOnlyContent(%j)", (files, expected) => {
    expect(attachmentOnlyContent(files as AttachedFile[])).toBe(expected);
  });

  it.each([
    [true, true, false, /Waiting for the agent/],
    [false, false, false, /Open a microsite/],
    [false, true, true, /attached file/],
    [false, true, false, /modify the layout/],
  ])("inputPlaceholder(loading=%s, microsite=%s, files=%s)", (l, m, f, re) => {
    expect(inputPlaceholder(l, m, f)).toMatch(re as RegExp);
  });

  it("clampPanelWidth only accepts widths within [320, 1200]", () => {
    expect(clampPanelWidth(400, 1000)).toBe(600);
    expect(clampPanelWidth(900, 1000)).toBeNull();
    expect(clampPanelWidth(-500, 1000)).toBeNull();
  });
});

describe("buildPreviewData", () => {
  const msg = (extra: Partial<ChatPanelMessage>) =>
    createMessage({ role: "assistant", content: "", ...extra });

  it("summarises a patch proposal", () => {
    const patch: any = { id: "p", description: "Add form", patch: [{ type: "form" }] };
    const data = buildPreviewData(msg({ type: "patch_proposed", patch }));
    expect(data.title).toBe("Preview · 1 component");
    expect(data.subtitle).toBe("Add form");
    expect(data.rawNodes).toEqual([{ type: "form" }]);
  });

  it("aggregates every operation of a batch proposal", () => {
    const batch: any = {
      id: "b",
      batchDescription: "Two pages",
      operations: [{ patch: [{ type: "a" }] }, { patch: [{ type: "b" }, { type: "c" }] }],
    };
    const data = buildPreviewData(msg({ type: "batch_proposed", batch }));
    expect(data.title).toBe("Preview · 3 components");
    expect(data.subtitle).toBe("Two pages");
  });

  it("falls back to a plain title for empty or unrelated messages", () => {
    expect(buildPreviewData(msg({ type: "batch_proposed", batch: { id: "b" } as any })).title).toBe("Preview");
    expect(buildPreviewData(msg({})).components).toEqual([]);
  });
});

describe("attachments", () => {
  it("checkAttachment accepts supported files and explains rejections", () => {
    expect(checkAttachment(file("a.png", "image/png"))).toEqual({
      classified: { kind: "image", format: "png" },
    });
    expect((checkAttachment(file("a.exe", "application/x-msdownload")) as any).error).toMatch(
      /"a.exe" is not a supported file type/,
    );
    expect((checkAttachment(file("big.png", "image/png", 50 * 1024 * 1024)) as any).error).toMatch(
      /"big.png" is too large \(max .* for images\)/,
    );
  });

  it("toAttachedFile reads base64 and only previews images", async () => {
    const img = await toAttachedFile(file("a.png", "image/png"), { kind: "image", format: "png" });
    expect(img.dataBase64).toBe("YWJj");
    expect(img.previewUrl).toMatch(/^data:/);
    const doc = await toAttachedFile(file("a.txt", "text/plain"), { kind: "document", format: "txt" });
    expect(doc.previewUrl).toBeUndefined();
    expect(doc.name).toBe("a.txt");
  });

  it("tooManyFilesNote names the skipped file", () => {
    expect(tooManyFilesNote("x.png")).toMatch(/"x.png" was skipped/);
  });
});

describe("createStreamSession", () => {
  const encoder = new TextEncoder();

  const bodyOf = (...chunks: string[]) => {
    const queue = chunks.map((c) => encoder.encode(c));
    return {
      getReader: () => ({
        read: async () =>
          queue.length ? { value: queue.shift(), done: false } : { value: undefined, done: true },
      }),
    } as unknown as ReadableStream<Uint8Array>;
  };
  const sse = (...events: unknown[]) =>
    events.map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`).join("");

  const setup = (currentMessages: ChatPanelMessage[] = []) => {
    const ctx = {
      currentMessages,
      micrositeId: "ms",
      setMessages: jest.fn(),
      setSuggestions: jest.fn(),
      setActivePage: jest.fn(),
      addStatusMessage: jest.fn(),
      appendErrorMessage: jest.fn(),
    };
    return { ctx, session: createStreamSession(ctx) };
  };
  const lastMessages = (ctx: { setMessages: jest.Mock }): ChatPanelMessage[] =>
    ctx.setMessages.mock.calls.at(-1)![0];

  it("start() shows an empty streaming assistant bubble after the history", () => {
    const user = createMessage({ role: "user", content: "hi" });
    const { ctx, session } = setup([user]);
    session.start();
    const [first, bubble] = lastMessages(ctx);
    expect(first).toBe(user);
    expect(bubble).toMatchObject({ role: "assistant", content: "", _isStreaming: true });
  });

  it("accumulates text chunks, including ones split across reads", async () => {
    const { ctx, session } = setup();
    const full = sse({ type: "text_chunk", content: "Hel" }, { type: "text_chunk", content: "lo" });
    await session.consume(bodyOf(full.slice(0, 10), full.slice(10)));
    expect(lastMessages(ctx).at(-1)!.content).toBe("Hello");
  });

  it("ignores text chunks without string content and non-event frames", async () => {
    const { ctx, session } = setup();
    await session.consume(bodyOf(": keep-alive\n\n", "retry: 100\n\n", sse({ type: "text_chunk", content: 5 })));
    expect(ctx.setMessages).not.toHaveBeenCalled();
  });

  it.each([
    ["patch_proposed", { patch: { id: "p" } }, "patch", "proposed"],
    ["batch_proposed", { batch: { id: "b" } }, "batch", "proposed"],
    ["rollback_proposed", { rollback: { historyId: "h" } }, "rollback", "proposed"],
    ["page_map", { pageMap: { nodes: [] } }, "pageMap", undefined],
  ])("turns a %s event into a finished proposal message", async (type, payload, key, status) => {
    const { ctx, session } = setup();
    await session.consume(bodyOf(sse({ type, tool_call_id: "tc", ...payload })));
    const msg: any = lastMessages(ctx).at(-1);
    expect(msg).toMatchObject({ type, tool_call_id: "tc", _isStreaming: false });
    expect(msg._changeStatus).toBe(status);
    expect(msg[key]).toEqual(Object.values(payload)[0]);
  });

  it("builds a page-creation proposal, defaulting micrositeId and purpose", async () => {
    const { ctx, session } = setup();
    await session.consume(
      bodyOf(sse({ type: "page_creation_proposed", suggestedName: "Banks" })),
    );
    expect((lastMessages(ctx).at(-1) as any).pageCreation).toEqual({
      micrositeId: "ms",
      suggestedName: "Banks",
      purpose: null,
    });

    await session.consume(
      bodyOf(sse({ type: "page_creation_proposed", suggestedName: "B", micrositeId: "other", purpose: "why" })),
    );
    expect((lastMessages(ctx).at(-1) as any).pageCreation).toEqual({
      micrositeId: "other",
      suggestedName: "B",
      purpose: "why",
    });
  });

  it.each([
    ["patch_proposed"],
    ["batch_proposed"],
    ["rollback_proposed"],
    ["page_creation_proposed"],
    ["page_map"],
    ["unknown_type"],
  ])("ignores a %s event lacking its payload", async (type) => {
    const { ctx, session } = setup();
    await session.consume(bodyOf(sse({ type })));
    expect(ctx.setMessages).not.toHaveBeenCalled();
  });

  it("navigates and reports it, with or without a reason", async () => {
    const { ctx, session } = setup();
    await session.consume(
      bodyOf(
        sse(
          { type: "navigate", pageCode: "p1", reason: "because" },
          { type: "navigate", pageCode: "p2" },
          { type: "navigate" },
        ),
      ),
    );
    expect(ctx.setActivePage.mock.calls).toEqual([["p1"], ["p2"]]);
    expect(ctx.addStatusMessage.mock.calls).toEqual([
      ['Navigated to "p1" — because'],
      ['Navigated to "p2".'],
    ]);
  });

  it("forwards suggestions only when they are an array", async () => {
    const { ctx, session } = setup();
    const suggestions = [{ id: "a", label: "A", value: "a" }];
    await session.consume(bodyOf(sse({ type: "suggestions", suggestions }, { type: "suggestions", suggestions: "no" })));
    expect(ctx.setSuggestions).toHaveBeenCalledTimes(1);
    expect(ctx.setSuggestions).toHaveBeenCalledWith(suggestions);
  });

  it("replaces the history on sync_messages and then updates the last assistant message in place", async () => {
    const { ctx, session } = setup();
    await session.consume(
      bodyOf(
        sse(
          {
            type: "sync_messages",
            messages: [
              { role: "user", content: "q" },
              { role: "assistant", content: 7 },
              { content: "no role" },
            ],
          },
          { type: "text_chunk", content: "streamed" },
          { type: "sync_messages" },
        ),
      ),
    );
    const synced = ctx.setMessages.mock.calls[0][0] as ChatPanelMessage[];
    expect(synced.map((m) => [m.role, m.content])).toEqual([
      ["user", "q"],
      ["assistant", ""],
      ["assistant", "no role"],
    ]);
    const after = lastMessages(ctx);
    expect(after).toHaveLength(3);
    // The streaming content lands on the last synced assistant message, keeping its id.
    expect(after[2].content).toBe("streamed");
    expect(after[2].id).toBe(synced[2].id);
  });

  it("leaves history unchanged when a synced history has no assistant message to update", async () => {
    const { ctx, session } = setup();
    await session.consume(
      bodyOf(
        sse(
          { type: "sync_messages", messages: [{ role: "user", content: "q" }] },
          { type: "text_chunk", content: "x" },
        ),
      ),
    );
    expect(lastMessages(ctx).map((m) => m.role)).toEqual(["user"]);
  });

  it("reports stream errors with the original messages for retry", async () => {
    const history = [createMessage({ role: "user", content: "q" })];
    const { ctx, session } = setup(history);
    await session.consume(bodyOf(sse({ type: "error", message: "bad" }, { type: "error" })));
    expect(ctx.appendErrorMessage).toHaveBeenCalledTimes(1);
    expect(ctx.appendErrorMessage).toHaveBeenCalledWith("bad", history);
  });

  it("logs and survives malformed event data", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { ctx, session } = setup();
    await session.consume(bodyOf(sse("{oops", { type: "text_chunk", content: "ok" })));
    expect(spy).toHaveBeenCalledWith("Error parsing SSE event data", expect.any(SyntaxError));
    expect(lastMessages(ctx).at(-1)!.content).toBe("ok");
    spy.mockRestore();
  });
});
