/**
 * @jest-environment node
 *
 * Chat route: read-only tool calls in one agent step run concurrently (results
 * still in order); side-effect tools stay sequential. Earlier turns reach the
 * model as collapsed text history; attachments are stored and referenced by
 * handle; proposals are persisted before the turn ends awaiting approval.
 */

jest.mock("../lib/freellm-client", () => ({
  TOOL_CAPABLE_MODEL: "test-model",
  freeLLMClient: new (class BedrockRuntimeClient {})(),
}));

const streamBedrockTurn = jest.fn();
jest.mock("../lib/aws-bedrock-helper", () => ({
  streamBedrockTurn: (...a: any[]) => streamBedrockTurn(...a),
}));

const buildSystemPromptParts = jest.fn();
jest.mock("../lib/prompt-builder", () => ({
  buildSystemPromptParts: (...a: any[]) => buildSystemPromptParts(...a),
}));

const executeTool = jest.fn();
jest.mock("../lib/tool-executor", () => ({
  executeTool: (...a: any[]) => executeTool(...a),
}));

const queuePatch = jest.fn();
jest.mock("../lib/dsl-patcher", () => ({
  queuePatch: (...a: any[]) => queuePatch(...a),
  queueBatch: jest.fn(),
}));
jest.mock("../db/queries/pending-patches", () => ({ pendingPatchesDB: { save: jest.fn() } }));
jest.mock("../db/queries/pending-batches", () => ({ pendingBatchesDB: { save: jest.fn() } }));
jest.mock("../db/queries/sessions", () => ({
  sessionsOps: { resolve: jest.fn().mockResolvedValue(undefined) },
}));
const saveMessage = jest.fn().mockResolvedValue(undefined);
jest.mock("../db/queries/dsl-history", () => ({
  sessionOps: {
    saveMessage: (...a: any[]) => saveMessage(...a),
    saveTask: jest.fn().mockResolvedValue(undefined),
  },
}));
const saveAttachment = jest.fn().mockResolvedValue(undefined);
const listForSession = jest.fn().mockResolvedValue([]);
jest.mock("../db/queries/chat-attachments", () => ({
  chatAttachmentsOps: {
    save: (...a: any[]) => saveAttachment(...a),
    listForSession: (...a: any[]) => listForSession(...a),
    getByHandle: jest.fn(),
  },
}));
jest.mock("../db/client", () => ({
  db: {
    command: jest.fn(),
    collection: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue({ taskContext: { intent: "fresh" } }),
      find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })),
    })),
  },
}));

import { POST } from "../../src/app/api/chat/route";

const toolUse = (id: string, name: string, input: object) => ({
  id,
  type: "function",
  function: { name, arguments: JSON.stringify(input) },
});
const turn = (content: string, toolCalls: any[] = []) => ({
  content,
  toolCalls,
  bedrockContent: [{ reasoning: { text: "r", signature: "s" } }],
  usage: { inputTokens: 1, outputTokens: 1 },
  stopReason: toolCalls.length ? "tool_use" : "end_turn",
});

async function runChat(messages: any[], extra: Record<string, unknown> = {}) {
  const req = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, micrositeId: "m", clientSessionId: "sess", ...extra }),
  });
  const res = await POST(req);
  const reader = res.body!.getReader();
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += typeof value === "string" ? value : new TextDecoder().decode(value);
  }
  return text
    .split("\n\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => JSON.parse(l.slice(6)));
}

const modelRequest = (call: number) => streamBedrockTurn.mock.calls[call][1];

beforeEach(() => {
  jest.clearAllMocks();
  buildSystemPromptParts.mockResolvedValue({ staticText: "STATIC", dynamicText: "DYNAMIC" });
});

describe("chat route tool execution", () => {
  it("runs read-only tool calls concurrently and keeps result order", async () => {
    streamBedrockTurn
      .mockResolvedValueOnce(
        turn("", [
          toolUse("t1", "get_page_dsl", { microsite_id: "m", page_path: "a" }),
          toolUse("t2", "query_dsl_path", { tempDslId: "dsl:m:a", path: "/x" }),
          toolUse("t3", "find_components", { microsite_id: "m", page_paths: ["a"] }),
        ]),
      )
      .mockResolvedValueOnce(turn("done"));

    let inFlight = 0;
    let maxInFlight = 0;
    executeTool.mockImplementation(async (name: string) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return { tool: name };
    });

    await runChat([{ role: "user", content: "look around" }]);

    expect(maxInFlight).toBe(3);
    const toolMsgs = modelRequest(1).messages.filter((m: any) => m.role === "tool");
    expect(toolMsgs.map((m: any) => m.tool_call_id)).toEqual(["t1", "t2", "t3"]);
    expect(JSON.parse(toolMsgs[2].content)).toEqual({ tool: "find_components" });
    // Reasoning blocks of the previous step are replayed to the model.
    const assistant = modelRequest(1).messages.find((m: any) => m.role === "assistant");
    expect(assistant._bedrockContent).toEqual([{ reasoning: { text: "r", signature: "s" } }]);
  });

  it("keeps side-effect tools sequential", async () => {
    streamBedrockTurn
      .mockResolvedValueOnce(
        turn("", [
          toolUse("s1", "log_user_preference", { key: "k", value: "v", reason: "r" }),
          toolUse("s2", "record_skill", { category: "dsl_rule", title: "t", content: "c" }),
        ]),
      )
      .mockResolvedValueOnce(turn("ok"));

    let inFlight = 0;
    let maxInFlight = 0;
    executeTool.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return { success: true };
    });

    await runChat([{ role: "user", content: "remember this" }]);
    expect(maxInFlight).toBe(1);
  });

  it("sends earlier turns as collapsed history (cacheable) and builds the system prompt once", async () => {
    streamBedrockTurn
      .mockResolvedValueOnce(turn("", [toolUse("q", "get_page_dsl", { microsite_id: "m", page_path: "p" })]))
      .mockResolvedValueOnce(turn("hi"));
    executeTool.mockResolvedValue({ outline: "/a x" });

    const prior = [
      { role: "user", content: "old prompt" },
      { role: "assistant", content: "old answer", tool_calls: [toolUse("o1", "get_page_dsl", { page_path: "p" })] },
      { role: "tool", tool_call_id: "o1", content: JSON.stringify({ outline: "/a x\n/b y" }) },
      { role: "user", content: "new prompt" },
    ];
    const events = await runChat(prior);

    const req = modelRequest(0);
    expect(req.system).toEqual({ staticText: "STATIC", dynamicText: "DYNAMIC" });
    expect(req.historyLength).toBe(2);
    expect(req.messages.slice(0, 3)).toEqual([
      { role: "user", content: "old prompt" },
      { role: "assistant", content: "old answer\n[get_page_dsl page_path=p → outline, 2 nodes]" },
      { role: "user", content: "new prompt" },
    ]);
    expect(buildSystemPromptParts).toHaveBeenCalledTimes(1);
    expect(buildSystemPromptParts.mock.calls[0][0]).toMatchObject({ attachments: [], micrositeId: "m" });
    expect(listForSession).toHaveBeenCalledWith("sess");

    const sync = events.find((e) => e.type === "sync_messages");
    expect(sync.messages.map((m: any) => m.content).slice(-1)).toEqual(["hi"]);
    expect(JSON.stringify(sync)).not.toContain("_bedrockContent");
    // The final answer is persisted too.
    expect(saveMessage).toHaveBeenCalledWith(expect.any(String), "m", expect.objectContaining({ role: "assistant", content: "hi" }));
  });

  it("stores an attached page DSL, sends the model a handle instead of the file, and syncs no bytes", async () => {
    streamBedrockTurn.mockResolvedValueOnce(turn("got it"));
    const json = JSON.stringify({ components: [{ id: "a", type: "input-table" }] });
    const events = await runChat([{ role: "user", content: "copy interceptors" }], {
      attachments: [{ kind: "document", format: "txt", name: "dev.json", dataBase64: Buffer.from(json).toString("base64") }],
    });

    const userMsg = modelRequest(0).messages[0];
    expect(userMsg.content[0]).toEqual({ type: "text", text: "copy interceptors" });
    expect(userMsg.content[1].text).toMatch(/Attachment att-[0-9a-f]{10} "dev.json"/);
    expect(JSON.stringify(userMsg)).not.toContain("dataBase64");
    expect(saveAttachment).toHaveBeenCalledWith(expect.objectContaining({ kind: "dsl", sessionId: "sess" }));

    const sync = events.find((e) => e.type === "sync_messages");
    expect(sync.messages[0].content).toBe("copy interceptors");
    expect(sync.messages[0]._attachments).toEqual([
      { handle: expect.stringMatching(/^att-/), name: "dev.json", kind: "page DSL" },
    ]);
    expect(JSON.stringify(sync)).not.toContain(Buffer.from(json).toString("base64"));
  });

  it("persists the proposing step before ending the turn for approval", async () => {
    streamBedrockTurn.mockResolvedValueOnce(
      turn("Proposing.", [toolUse("p1", "propose_dsl_patch", { microsite_id: "m", page_path: "p", patch: [], description: "d" })]),
    );
    queuePatch.mockResolvedValueOnce({ id: "patch-1", description: "Add 6/6 interceptors\nmore", patch: [] });

    const events = await runChat([{ role: "user", content: "do it" }]);
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["sync_messages", "patch_proposed", "awaiting_approval"]));
    const saved = saveMessage.mock.calls.map((c) => c[2]);
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "assistant", content: "Proposing." }),
        expect.objectContaining({ role: "tool", tool_call_id: "p1", content: expect.stringContaining("Patch ID: patch-1. Add 6/6 interceptors") }),
      ]),
    );
  });
});
