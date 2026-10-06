/**
 * @jest-environment node
 *
 * Chat route: read-only tool calls in one agent step run concurrently (results
 * still in order); side-effect tools stay sequential. Also: only the current
 * turn is sent to the model, while sync_messages keeps the full history.
 */

jest.mock("../lib/freellm-client", () => ({
  TOOL_CAPABLE_MODEL: "test-model",
  freeLLMClient: new (class BedrockRuntimeClient {})(),
}));

const callBedrockWithTools = jest.fn();
jest.mock("../lib/aws-bedrock-helper", () => ({
  callBedrockWithTools: (...a: any[]) => callBedrockWithTools(...a),
}));

jest.mock("../lib/prompt-builder", () => ({
  buildSystemPrompt: jest.fn().mockResolvedValue("SYSTEM"),
}));

const executeTool = jest.fn();
jest.mock("../lib/tool-executor", () => ({
  executeTool: (...a: any[]) => executeTool(...a),
}));

jest.mock("../lib/dsl-patcher", () => ({ queuePatch: jest.fn(), queueBatch: jest.fn() }));
jest.mock("../db/queries/pending-patches", () => ({ pendingPatchesDB: { save: jest.fn() } }));
jest.mock("../db/queries/pending-batches", () => ({ pendingBatchesDB: { save: jest.fn() } }));
jest.mock("../db/queries/sessions", () => ({
  sessionsOps: { resolve: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("../db/queries/dsl-history", () => ({
  sessionOps: {
    saveMessage: jest.fn().mockResolvedValue(undefined),
    saveTask: jest.fn().mockResolvedValue(undefined),
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
  toolUse: { toolUseId: id, name, input },
});

async function runChat(messages: any[]) {
  const req = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, micrositeId: "m" }),
  });
  const res = await POST(req);
  // The route enqueues plain strings, so read the stream directly.
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("chat route tool execution", () => {
  it("runs read-only tool calls concurrently and keeps result order", async () => {
    callBedrockWithTools
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [
              toolUse("t1", "get_page_dsl", { microsite_id: "m", page_path: "a" }),
              toolUse("t2", "query_dsl_path", { tempDslId: "dsl:m:a", path: "/x" }),
              toolUse("t3", "find_components", { microsite_id: "m", page_paths: ["a"] }),
            ],
          },
        },
      })
      .mockResolvedValueOnce({ output: { message: { content: [{ text: "done" }] } } });

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
    // Second model call receives the three tool results in the original order.
    const secondCallMessages = callBedrockWithTools.mock.calls[1][1];
    const toolMsgs = secondCallMessages.filter((m: any) => m.role === "tool");
    expect(toolMsgs.map((m: any) => m.tool_call_id)).toEqual(["t1", "t2", "t3"]);
    expect(JSON.parse(toolMsgs[2].content)).toEqual({ tool: "find_components" });
  });

  it("keeps side-effect tools sequential", async () => {
    callBedrockWithTools
      .mockResolvedValueOnce({
        output: {
          message: {
            content: [
              toolUse("s1", "log_user_preference", { key: "k", value: "v", reason: "r" }),
              toolUse("s2", "record_skill", { category: "dsl_rule", title: "t", content: "c" }),
            ],
          },
        },
      })
      .mockResolvedValueOnce({ output: { message: { content: [{ text: "ok" }] } } });

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

  it("sends the model only the current turn, but syncs the full history to the client", async () => {
    callBedrockWithTools.mockResolvedValueOnce({ output: { message: { content: [{ text: "hi" }] } } });

    const history = [
      { role: "user", content: "old prompt" },
      { role: "assistant", content: "old answer" },
      { role: "user", content: "new prompt" },
    ];
    const events = await runChat(history);

    const sentToModel = callBedrockWithTools.mock.calls[0][1].filter((m: any) => m.role !== "system");
    expect(sentToModel).toEqual([{ role: "user", content: "new prompt" }]);

    const sync = events.find((e) => e.type === "sync_messages");
    expect(sync.messages.map((m: any) => m.content)).toEqual(["old prompt", "old answer", "new prompt", "hi"]);
  });
});
