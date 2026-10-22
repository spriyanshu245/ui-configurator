/**
 * @jest-environment node
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
import {
  bedrockUsageDetails,
  maskTraceData,
  sanitizeForTrace,
  traceChatTurn,
  traceGeneration,
  traceTool,
} from "../tracing";

// The real Langfuse processor (propagation + masking) in front of an in-memory exporter,
// so these tests exercise the same pipeline production uses.
const exporter = new InMemorySpanExporter();
const processor = new LangfuseSpanProcessor({
  publicKey: "pk-lf-test",
  secretKey: "sk-lf-test",
  exporter,
  mask: maskTraceData,
});
const attr = (span: ReadableSpan, key: string) => span.attributes[key];
const json = (span: ReadableSpan, key: string) => {
  const value = attr(span, key);
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const byName = async (name: string) => {
  await processor.forceFlush();
  return exporter.getFinishedSpans().filter((s) => s.name === name);
};

beforeAll(() => {
  context.setGlobalContextManager(
    new AsyncLocalStorageContextManager().enable(),
  );
  setLangfuseTracerProvider(
    new BasicTracerProvider({ spanProcessors: [processor] }),
  );
});

afterAll(async () => {
  setLangfuseTracerProvider(null);
  await processor.shutdown();
});
beforeEach(() => exporter.reset());

describe("chat turn trace structure", () => {
  it("nests generations and tools under one agent root with user/session attributes", async () => {
    await traceChatTurn(
      {
        userId: "u1",
        sessionId: "s1",
        input: "add a button",
        metadata: { micrositeId: "m1", pageCode: undefined },
      },
      async (turn) => {
        await traceGeneration(
          "generate-response",
          { model: "claude-x", input: [{ role: "user", content: "add a button" }] },
          async (generation) => {
            generation.update({
              output: { role: "assistant", content: null },
              usageDetails: { input: 10, output: 5, total: 15 },
            });
          },
        );
        await traceTool("get_page_dsl", { page: "home" }, async () => ({ ok: true }));
        turn.setOutput("done");
      },
    );

    const [root] = await byName("chat-turn");
    const [generation] = await byName("generate-response");
    const [tool] = await byName("get_page_dsl");

    expect(attr(root, "langfuse.observation.type")).toBe("agent");
    expect(attr(root, "user.id")).toBe("u1");
    expect(attr(root, "session.id")).toBe("s1");
    expect(attr(root, "langfuse.trace.name")).toBe("chat-turn");
    expect(JSON.stringify(attr(root, "langfuse.trace.tags"))).toContain("chat-agent");
    expect(json(root, "langfuse.observation.input")).toBe("add a button");
    expect(json(root, "langfuse.observation.output")).toBe("done");

    // Generation and tool are siblings under the root, not nested in each other.
    expect(generation.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
    expect(tool.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
    expect(attr(generation, "langfuse.observation.type")).toBe("generation");
    expect(attr(generation, "langfuse.observation.model.name")).toBe("claude-x");
    expect(json(generation, "langfuse.observation.usage_details")).toEqual({
      input: 10,
      output: 5,
      total: 15,
    });
    // Propagated trace attributes reach child observations, not just the root.
    for (const child of [generation, tool]) {
      expect(attr(child, "user.id")).toBe("u1");
      expect(attr(child, "session.id")).toBe("s1");
      expect(attr(child, "langfuse.trace.metadata.micrositeId")).toBe("m1");
    }
    expect(attr(tool, "langfuse.observation.type")).toBe("tool");
    expect(json(tool, "langfuse.observation.output")).toEqual({ ok: true });
  });

  it("drops undefined metadata and keeps the root output/error on failure", async () => {
    await traceChatTurn(
      { input: "x", metadata: { micrositeId: "m1", pageCode: undefined } },
      async (turn) => {
        turn.setError("rate limited");
        turn.setOutput({ status: "error" });
      },
    );
    const [root] = await byName("chat-turn");
    expect(attr(root, "langfuse.observation.level")).toBe("ERROR");
    expect(attr(root, "langfuse.observation.status_message")).toBe("rate limited");
    expect(attr(root, "langfuse.trace.metadata.micrositeId")).toBe("m1");
    expect(Object.keys(root.attributes).join()).not.toContain("pageCode");
  });

  it("runs concurrent tools as siblings of the same root", async () => {
    await traceChatTurn({ input: "x", metadata: {} }, async () => {
      await Promise.all([
        traceTool("get_page_dsl", { page: "a" }, async () => "a"),
        traceTool("get_page_dsl", { page: "b" }, async () => "b"),
      ]);
    });
    const [root] = await byName("chat-turn");
    const tools = await byName("get_page_dsl");
    expect(tools).toHaveLength(2);
    for (const tool of tools) {
      expect(tool.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
    }
  });
});

describe("error handling", () => {
  it("marks a failed generation as ERROR, rethrows, and still ends the span", async () => {
    await expect(
      traceGeneration("generate-response", { input: "hi" }, async () => {
        throw new Error("throttled");
      }),
    ).rejects.toThrow("throttled");
    const [span] = await byName("generate-response");
    expect(attr(span, "langfuse.observation.level")).toBe("ERROR");
    expect(attr(span, "langfuse.observation.status_message")).toBe("throttled");
  });

  it("marks a failed tool as ERROR and rethrows non-Error values", async () => {
    await expect(
      traceTool("propose_dsl_patch", { a: 1 }, async () => {
        throw "boom";
      }),
    ).rejects.toBe("boom");
    const [span] = await byName("propose_dsl_patch");
    expect(attr(span, "langfuse.observation.level")).toBe("ERROR");
    expect(attr(span, "langfuse.observation.status_message")).toBe("boom");
  });
});

describe("data hygiene", () => {
  it("replaces attachment bytes with a descriptor, recursively, without mutating the input", () => {
    const input = [
      {
        role: "user",
        content: [
          { type: "text", text: "see file" },
          { type: "image", format: "png", dataBase64: "A".repeat(500) },
          { type: "document", dataBase64: "B".repeat(10) },
        ],
      },
    ];
    const clean = sanitizeForTrace(input);
    const serialized = JSON.stringify(clean);
    expect(serialized).not.toContain("AAAA");
    expect(serialized).toContain("image:png, 500 base64 chars omitted");
    expect(serialized).toContain("document, 10 base64 chars omitted");
    expect(input[0].content[1].dataBase64).toHaveLength(500);
  });

  it("never exports attachment bytes through a generation's input", async () => {
    await traceGeneration(
      "generate-response",
      { input: [{ type: "image", dataBase64: "Z".repeat(100) }] },
      async () => undefined,
    );
    const [span] = await byName("generate-response");
    expect(String(attr(span, "langfuse.observation.input"))).not.toContain("ZZZZ");
  });

  it("masks secrets end-to-end through the exporter", async () => {
    await traceTool("get_page_dsl", { note: "Bearer abcdefghijklmnop1234" }, async () => "ok");
    const [span] = await byName("get_page_dsl");
    expect(String(attr(span, "langfuse.observation.input"))).toContain("Bearer ***REDACTED***");
    expect(String(attr(span, "langfuse.observation.input"))).not.toContain("abcdefghijklmnop");
  });

  it.each([
    ["Authorization: Bearer abcdefghijklmnop1234", "Bearer ***REDACTED***"],
    ["key AKIAABCDEFGHIJKLMNOP end", "***REDACTED_AWS_KEY***"],
    ["sk-lf-abcdef123456", "***REDACTED_LANGFUSE_KEY***"],
  ])("masks secrets in %s", (data, expected) => {
    expect(maskTraceData({ data })).toContain(expected);
  });

  it("truncates oversized payloads and passes non-strings through", () => {
    const masked = maskTraceData({ data: "x".repeat(250_000) }) as string;
    expect(masked.length).toBeLessThan(201_000);
    expect(masked).toContain("[truncated 50000 chars]");
    expect(maskTraceData({ data: { a: 1 } })).toEqual({ a: 1 });
    expect(maskTraceData({ data: "short" })).toBe("short");
  });
});

describe("bedrockUsageDetails", () => {
  it("maps exclusive Bedrock buckets and sums the total", () => {
    expect(
      bedrockUsageDetails({
        inputTokens: 100,
        outputTokens: 20,
        cacheReadInputTokens: 900,
        cacheWriteInputTokens: 50,
      }),
    ).toEqual({
      input: 100,
      output: 20,
      input_cached_tokens: 900,
      input_cache_write_tokens: 50,
      total: 1070,
    });
  });

  it("omits zero cache buckets and returns undefined without usable usage", () => {
    expect(bedrockUsageDetails({ inputTokens: 3, outputTokens: 4 })).toEqual({
      input: 3,
      output: 4,
      total: 7,
    });
    expect(bedrockUsageDetails(undefined)).toBeUndefined();
    expect(bedrockUsageDetails({})).toBeUndefined();
  });
});
