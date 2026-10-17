/**
 * @jest-environment node
 *
 * Chat route → Langfuse trace shape: one `chat-turn` agent per request, one
 * `generate-response` generation per model call, one tool observation per tool
 * call (siblings, never nested), attachments never exported.
 */
import { context } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { setLangfuseTracerProvider } from "@langfuse/tracing";
import { maskTraceData } from "../lib/tracing";

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

const exporter = new InMemorySpanExporter();
const processor = new LangfuseSpanProcessor({
  publicKey: "pk-lf-test",
  secretKey: "sk-lf-test",
  exporter,
  mask: maskTraceData,
});

const attr = (span: ReadableSpan, key: string) => span.attributes[key];
const parse = (span: ReadableSpan, key: string) => {
  const value = attr(span, key);
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

async function spans() {
  await processor.forceFlush();
  const all = exporter.getFinishedSpans();
  const root = all.find((s) => s.name === "chat-turn")!;
  const byStart = (a: ReadableSpan, b: ReadableSpan) =>
    a.startTime[0] - b.startTime[0] || a.startTime[1] - b.startTime[1];
  return {
    root,
    generations: all.filter((s) => s.name === "generate-response").sort(byStart),
    tools: all.filter((s) => attr(s, "langfuse.observation.type") === "tool"),
    all,
  };
}

async function runChat(body: object, headers: Record<string, string> = {}) {
  const req = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ micrositeId: "m1", ...body }),
  });
  const res = await POST(req);
  const reader = res.body!.getReader();
  for (;;) {
    const { done } = await reader.read();
    if (done) break;
  }
}

const toolUse = (id: string, name: string, input: object) => ({
  toolUse: { toolUseId: id, name, input },
});

beforeAll(() => {
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  setLangfuseTracerProvider(new BasicTracerProvider({ spanProcessors: [processor] }));
});
afterAll(async () => {
  setLangfuseTracerProvider(null);
  await processor.shutdown();
});
beforeEach(() => {
  jest.clearAllMocks();
  exporter.reset();
});

describe("chat route tracing", () => {
  it("traces a two-step turn as one agent with sibling generations and tools", async () => {
    callBedrockWithTools
      .mockResolvedValueOnce({
        output: { message: { content: [toolUse("t1", "get_page_dsl", { page_path: "a" })] } },
        usage: { inputTokens: 100, outputTokens: 10 },
        stopReason: "tool_use",
      })
      .mockResolvedValueOnce({
        output: { message: { content: [{ text: "all done" }] } },
        usage: { inputTokens: 120, outputTokens: 4, cacheReadInputTokens: 900 },
        stopReason: "end_turn",
      });
    executeTool.mockResolvedValue({ components: 3 });

    await runChat(
      { messages: [{ role: "user", content: "look around" }], clientSessionId: "sess-1" },
      { "x-user-id": "42" },
    );
    const { root, generations, tools } = await spans();

    expect(attr(root, "langfuse.observation.type")).toBe("agent");
    expect(attr(root, "user.id")).toBe("42");
    expect(attr(root, "session.id")).toBe("sess-1");
    expect(attr(root, "langfuse.trace.metadata.micrositeId")).toBe("m1");
    expect(parse(root, "langfuse.observation.input")).toBe("look around");
    expect(parse(root, "langfuse.observation.output")).toBe("all done");

    // One generation per model call — the loop is NOT collapsed into one generation.
    expect(generations).toHaveLength(2);
    for (const generation of generations) {
      expect(attr(generation, "langfuse.observation.type")).toBe("generation");
      expect(attr(generation, "langfuse.observation.model.name")).toBe("test-model");
      expect(generation.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
      expect(attr(generation, "session.id")).toBe("sess-1");
    }
    expect(parse(generations[0], "langfuse.observation.usage_details")).toEqual({
      input: 100,
      output: 10,
      total: 110,
    });
    expect(parse(generations[1], "langfuse.observation.usage_details")).toEqual({
      input: 120,
      output: 4,
      input_cached_tokens: 900,
      total: 1024,
    });
    // Output is the assistant message in OpenAI format, so tool calls render as cards.
    expect(parse(generations[0], "langfuse.observation.output")).toMatchObject({
      role: "assistant",
      tool_calls: [{ id: "t1", type: "function", function: { name: "get_page_dsl" } }],
    });
    // The second call's input shows the model what the tool returned.
    const secondInput = parse(generations[1], "langfuse.observation.input") as any[];
    expect(secondInput.find((m) => m.role === "tool")?.tool_call_id).toBe("t1");

    // Tool observation is a sibling of the generation that requested it.
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("get_page_dsl");
    expect(tools[0].parentSpanContext?.spanId).toBe(root.spanContext().spanId);
    expect(parse(tools[0], "langfuse.observation.input")).toEqual({ page_path: "a" });
    expect(parse(tools[0], "langfuse.observation.output")).toEqual({ components: 3 });
  });

  it("never exports attachment bytes", async () => {
    callBedrockWithTools.mockResolvedValueOnce({
      output: { message: { content: [{ text: "seen" }] } },
    });
    await runChat({
      messages: [{ role: "user", content: "use this wireframe" }],
      attachments: [{ kind: "image", format: "png", dataBase64: "Q".repeat(400) }],
    });
    const { all, root } = await spans();
    for (const span of all) {
      expect(JSON.stringify(span.attributes)).not.toContain("QQQQQQ");
    }
    expect(parse(root, "langfuse.observation.input")).toBe("use this wireframe");
    expect(attr(root, "langfuse.trace.metadata.attachmentCount")).toBe("1");
  });

  it("records a model failure as ERROR on both the generation and the turn", async () => {
    callBedrockWithTools.mockRejectedValueOnce(new Error("ThrottlingException 429"));
    await runChat({ messages: [{ role: "user", content: "hi" }] });
    const { root, generations } = await spans();

    expect(attr(generations[0], "langfuse.observation.level")).toBe("ERROR");
    expect(attr(generations[0], "langfuse.observation.status_message")).toContain("429");
    expect(attr(root, "langfuse.observation.level")).toBe("ERROR");
    expect(parse(root, "langfuse.observation.output")).toMatchObject({ status: "error" });
  });

  it("closes the turn with an awaiting-approval output when a gated tool ends the loop", async () => {
    callBedrockWithTools.mockResolvedValueOnce({
      output: {
        message: {
          content: [
            toolUse("c1", "propose_create_page", { suggested_name: "Pricing", purpose: "plans" }),
          ],
        },
      },
    });
    await runChat({ messages: [{ role: "user", content: "add a pricing page" }] });
    const { root, tools, generations } = await spans();

    expect(generations).toHaveLength(1);
    expect(tools.map((t) => t.name)).toEqual(["propose_create_page"]);
    expect(parse(root, "langfuse.observation.output")).toEqual({
      status: "awaiting_approval",
      proposal: "create_page",
      suggestedName: "Pricing",
    });
    expect(attr(root, "langfuse.observation.level")).toBeUndefined();
  });
});
