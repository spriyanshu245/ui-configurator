/**
 * @jest-environment node
 *
 * Bedrock ConverseStream helper: content conversion (images, documents),
 * tool-use pairing, role merging, model selection, prompt-cache placement,
 * stream parsing (text / tool input / reasoning / usage) and retries.
 */

const sendMock = jest.fn();
let mockModel = "auto";

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: class {},
  ConverseStreamCommand: class {
    input: any;
    constructor(input: any) {
      this.input = input;
    }
  },
}));

jest.mock("../freellm-client", () => ({
  get TOOL_CAPABLE_MODEL() {
    return mockModel;
  },
}));
jest.mock("../tool-definitions", () => ({
  DSL_TOOLS: [
    {
      function: {
        name: "get_page_dsl",
        description: "Fetch a page",
        parameters: { type: "object", properties: {} },
      },
    },
  ],
}));
jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  buildConverseInput,
  streamBedrockTurn,
  toBedrockContentBlocks,
  __resetEffortRejection,
} from "../aws-bedrock-helper";
import { logger } from "../logger";

const client: any = { send: sendMock };
const B64 = Buffer.from("hello file").toString("base64");
// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const ENV = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  mockModel = "auto";
  process.env = { ...ENV, LLM_PROMPT_CACHE: "off" };
  delete process.env.LLM_EFFORT;
  delete process.env.LLM_MAX_OUTPUT_TOKENS;
  __resetEffortRejection();
});
afterAll(() => {
  process.env = ENV;
});

const convert = (messages: any[], system: any = "", historyLength = 0) =>
  buildConverseInput({ system, messages, historyLength }) as any;

async function* events(list: any[]) {
  for (const e of list) yield e;
}

describe("toBedrockContentBlocks — scalar inputs", () => {
  it.each([
    ["a string", "hi", [{ text: "hi" }]],
    ["an empty string", "", []],
    ["a falsy non-array", null, []],
    ["an object", { a: 1 }, [{ text: '{"a":1}' }]],
  ])("converts %s", (_label, input, expected) => {
    expect(toBedrockContentBlocks(input)).toEqual(expected);
  });
});

describe("toBedrockContentBlocks — array parts", () => {
  it("keeps strings and non-empty text parts, drops empty/unknown/falsy parts", () => {
    const blocks = toBedrockContentBlocks([
      "plain",
      "",
      null,
      { type: "text", text: "txt" },
      { type: "text", text: "" },
      { type: "text", text: 5 },
      { type: "image" },
      { type: "document", format: "pdf" },
      { type: "video", dataBase64: B64 },
    ]);
    expect(blocks).toEqual([{ text: "plain" }, { text: "txt" }]);
  });

  it("converts an image part, defaulting the format to png and lower-casing it", () => {
    const [def, upper] = toBedrockContentBlocks([
      { type: "image", dataBase64: PNG_B64 },
      { type: "image", format: "JPEG", dataBase64: PNG_B64 },
    ]);
    expect(def.image.format).toBe("png");
    expect(upper.image.format).toBe("jpeg");
    expect(def.image.source.bytes.equals(Buffer.from(PNG_B64, "base64"))).toBe(true);
  });

  it("skips images with an unsupported format and logs a warning", () => {
    const blocks = toBedrockContentBlocks([
      { type: "text", text: "hi" },
      { type: "image", format: "tiff", dataBase64: PNG_B64 },
    ]);
    expect(blocks).toEqual([{ text: "hi" }]);
    expect(logger.warn).toHaveBeenCalledWith("Skipping image with unsupported format", {
      format: "tiff",
    });
  });

  it("converts a document part with a sanitized name", () => {
    const [doc] = toBedrockContentBlocks([
      { type: "document", format: "pdf", name: "Loan Report.pdf", dataBase64: B64 },
    ]);
    expect(doc.document.format).toBe("pdf");
    expect(doc.document.name).toBe("Loan Report pdf");
    expect(doc.document.source.bytes.equals(Buffer.from(B64, "base64"))).toBe(true);
  });

  it("skips documents with an unsupported (or missing) format and logs a warning", () => {
    expect(
      toBedrockContentBlocks([
        { type: "document", format: "exe", name: "x", dataBase64: B64 },
        { type: "document", name: "y", dataBase64: B64 },
      ]),
    ).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith("Skipping document with unsupported format", {
      format: "exe",
    });
  });

  it("de-duplicates document names within one request", () => {
    const blocks = toBedrockContentBlocks([
      { type: "document", format: "txt", name: "notes", dataBase64: B64 },
      { type: "document", format: "txt", name: "notes", dataBase64: B64 },
      { type: "document", format: "txt", name: "notes", dataBase64: B64 },
    ]);
    const names = blocks.map((b: any) => b.document.name);
    expect(new Set(names).size).toBe(3);
    expect(names[0]).toBe("notes");
  });
});

describe("buildConverseInput — request shape", () => {
  it("converts a text+image user message into text and image blocks", () => {
    const input = convert([
      {
        role: "user",
        content: [
          { type: "text", text: "Match this wireframe" },
          { type: "image", format: "png", dataBase64: PNG_B64 },
        ],
      },
    ]);
    const blocks = input.messages[0].content;
    expect(blocks[0]).toEqual({ text: "Match this wireframe" });
    expect(blocks[1].image.format).toBe("png");
  });

  it("advertises the DSL tools with auto tool choice and a generous output ceiling", () => {
    const input = convert([{ role: "user", content: "hi" }]);
    expect(input.toolConfig).toEqual({
      tools: [
        {
          toolSpec: {
            name: "get_page_dsl",
            description: "Fetch a page",
            inputSchema: { json: { type: "object", properties: {} } },
          },
        },
      ],
      toolChoice: { auto: {} },
    });
    expect(input.inferenceConfig).toEqual({ maxTokens: 64000 });
    process.env.LLM_MAX_OUTPUT_TOKENS = "1000";
    expect(convert([{ role: "user", content: "hi" }]).inferenceConfig).toEqual({ maxTokens: 1000 });
  });

  it("builds system blocks from static + dynamic parts, or omits them", () => {
    const parts = convert([{ role: "user", content: "hi" }], {
      staticText: "rules",
      dynamicText: "context",
    });
    expect(parts.system).toEqual([{ text: "rules" }, { text: "context" }]);
    expect(convert([{ role: "user", content: "hi" }], "plain").system).toEqual([{ text: "plain" }]);
    expect(convert([{ role: "user", content: "hi" }]).system).toBeUndefined();
  });

  it.each([
    ["auto", undefined],
    ["", undefined],
    ["us.anthropic.claude-opus-5-5", "us.anthropic.claude-opus-5-5"],
  ])("maps TOOL_CAPABLE_MODEL %p to modelId %p", (model, expected) => {
    mockModel = model;
    expect(convert([{ role: "user", content: "hi" }]).modelId).toBe(expected);
  });

  it("passes LLM_EFFORT through additionalModelRequestFields only when set", () => {
    expect(convert([{ role: "user", content: "hi" }]).additionalModelRequestFields).toBeUndefined();
    process.env.LLM_EFFORT = "high";
    expect(convert([{ role: "user", content: "hi" }]).additionalModelRequestFields).toEqual({
      output_config: { effort: "high" },
    });
  });

  it("skips empty messages, unknown roles and anything before the first user message", () => {
    const input = convert([
      { role: "assistant", content: "stray greeting" },
      { role: "user", content: "" },
      { role: "weird", content: "x" },
      { role: "user", content: "real" },
    ]);
    expect(input.messages).toEqual([{ role: "user", content: [{ text: "real" }] }]);
  });

  it("merges adjacent messages with the same role", () => {
    const input = convert([
      { role: "user", content: "a" },
      { role: "user", content: "b" },
    ]);
    expect(input.messages).toEqual([{ role: "user", content: [{ text: "a" }, { text: "b" }] }]);
  });
});

describe("buildConverseInput — tool use pairing", () => {
  const toolCall = (id: string, args: any = { pageCode: "home" }) => ({
    id,
    function: { name: "get_page_dsl", arguments: args },
  });

  it("emits toolUse (parsing string args) and pairs results into a user turn", () => {
    const input = convert([
      { role: "user", content: "show home" },
      {
        role: "assistant",
        content: "looking",
        tool_calls: [toolCall("t1", JSON.stringify({ pageCode: "home" })), toolCall("t2")],
      },
      { role: "tool", tool_call_id: "t1", content: "result one" },
      { role: "tool", tool_call_id: "t2", content: { ok: true } },
    ]);
    expect(input.messages).toHaveLength(3);
    expect(input.messages[1]).toEqual({
      role: "assistant",
      content: [
        { text: "looking" },
        { toolUse: { toolUseId: "t1", name: "get_page_dsl", input: { pageCode: "home" } } },
        { toolUse: { toolUseId: "t2", name: "get_page_dsl", input: { pageCode: "home" } } },
      ],
    });
    expect(input.messages[2]).toEqual({
      role: "user",
      content: [
        { toolResult: { toolUseId: "t1", content: [{ text: "result one" }] } },
        { toolResult: { toolUseId: "t2", content: [{ text: '{"ok":true}' }] } },
      ],
    });
  });

  it("replays streamed blocks (reasoning first) verbatim within a turn", () => {
    const input = convert([
      { role: "user", content: "go" },
      {
        role: "assistant",
        content: "x",
        tool_calls: [toolCall("t1")],
        _bedrockContent: [
          { reasoning: { text: "think", signature: "sig" } },
          { reasoning: { redacted: Buffer.from("r").toString("base64") } },
          { text: "x" },
          { toolUse: { toolUseId: "t1", name: "get_page_dsl", input: {} } },
        ],
      },
      { role: "tool", tool_call_id: "t1", content: "ok" },
    ]);
    const blocks = input.messages[1].content;
    expect(blocks[0]).toEqual({
      reasoningContent: { reasoningText: { text: "think", signature: "sig" } },
    });
    expect(Buffer.from(blocks[1].reasoningContent.redactedContent).toString()).toBe("r");
    expect(blocks[3].toolUse.toolUseId).toBe("t1");
    expect(input.messages[2].content[0].toolResult.toolUseId).toBe("t1");
  });

  it("turns a duplicate tool result into a plain text update (Bedrock forbids duplicate ids)", () => {
    const input = convert([
      { role: "user", content: "go" },
      { role: "assistant", content: "", tool_calls: [toolCall("t1")] },
      { role: "tool", tool_call_id: "t1", content: "queued" },
      { role: "tool", tool_call_id: "t1", content: "approved" },
    ]);
    const blocks = input.messages[2].content;
    expect(blocks[0].toolResult.toolUseId).toBe("t1");
    expect(blocks[1]).toEqual({ text: "[Update for tool t1]: approved" });
  });

  it("answers still-pending tool calls with synthetic errors before a new user message", () => {
    const input = convert([
      { role: "user", content: "go" },
      { role: "assistant", content: "", tool_calls: [toolCall("t1")] },
      { role: "user", content: "never mind" },
    ]);
    const userBlocks = input.messages[2].content;
    expect(userBlocks[0].toolResult).toMatchObject({ toolUseId: "t1", status: "error" });
    expect(userBlocks[1]).toEqual({ text: "never mind" });
  });

  it("closes trailing pending tool calls in a new user turn", () => {
    const input = convert([
      { role: "user", content: "go" },
      { role: "assistant", content: "", tool_calls: [toolCall("t9")] },
    ]);
    expect(input.messages).toHaveLength(3);
    expect(input.messages[2].content[0].toolResult).toMatchObject({ toolUseId: "t9", status: "error" });
    expect(input.messages[2].content[0].toolResult.content[0].text).toContain("Please proceed");
  });
});

describe("buildConverseInput — prompt caching", () => {
  beforeEach(() => {
    process.env.LLM_PROMPT_CACHE = "on";
  });

  const countPoints = (input: any) =>
    JSON.stringify([input.toolConfig.tools, input.system, input.messages]).split('"cachePoint"').length - 1;

  it("caches tools and the static system prompt for 1h, keeping dynamic text after the point", () => {
    const input = convert([{ role: "user", content: "hi" }], { staticText: "S", dynamicText: "D" });
    expect(input.toolConfig.tools.at(-1)).toEqual({ cachePoint: { type: "default", ttl: "1h" } });
    expect(input.system).toEqual([
      { text: "S" },
      { cachePoint: { type: "default", ttl: "1h" } },
      { text: "D" },
    ]);
  });

  it("puts a 5m point after the prior history and a rolling one on the newest message (max 4)", () => {
    const input = convert(
      [
        { role: "user", content: "earlier question" },
        { role: "assistant", content: "earlier answer" },
        { role: "user", content: "now" },
        { role: "assistant", content: "", tool_calls: [{ id: "t", function: { name: "get_page_dsl", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "t", content: "res" },
      ],
      { staticText: "S" },
      2,
    );
    expect(input.messages[1].content).toEqual([{ text: "earlier answer" }, { cachePoint: { type: "default" } }]);
    expect(input.messages.at(-1).content.at(-1)).toEqual({ cachePoint: { type: "default" } });
    expect(countPoints(input)).toBe(4);
  });

  it("does not duplicate the point when the history ends at the newest message", () => {
    const input = convert([{ role: "user", content: "only" }], { staticText: "S" }, 1);
    expect(input.messages[0].content).toEqual([{ text: "only" }, { cachePoint: { type: "default" } }]);
    expect(countPoints(input)).toBe(3);
  });

  it("supports a 5m static TTL override and switching caching off", () => {
    process.env.LLM_STATIC_CACHE_TTL = "5m";
    expect(convert([{ role: "user", content: "x" }], "S").system[1]).toEqual({
      cachePoint: { type: "default", ttl: "5m" },
    });
    delete process.env.LLM_STATIC_CACHE_TTL;
    process.env.LLM_PROMPT_CACHE = "off";
    expect(countPoints(convert([{ role: "user", content: "x" }], "S"))).toBe(0);
  });
});

describe("streamBedrockTurn", () => {
  const req = (extra: any = {}) => ({
    system: "S",
    messages: [{ role: "user", content: "hi" }],
    ...extra,
  });

  it("streams text, assembles tool input deltas, keeps reasoning and returns usage", async () => {
    sendMock.mockResolvedValue({
      stream: events([
        { messageStart: { role: "assistant" } },
        { contentBlockDelta: { contentBlockIndex: 0, delta: { reasoningContent: { text: "plan" } } } },
        { contentBlockDelta: { contentBlockIndex: 0, delta: { reasoningContent: { signature: "sig" } } } },
        { contentBlockDelta: { contentBlockIndex: 1, delta: { text: "Hel" } } },
        { contentBlockDelta: { contentBlockIndex: 1, delta: { text: "lo" } } },
        { contentBlockStart: { contentBlockIndex: 2, start: { toolUse: { toolUseId: "t1", name: "get_page_dsl" } } } },
        { contentBlockDelta: { contentBlockIndex: 2, delta: { toolUse: { input: '{"page_' } } } },
        { contentBlockDelta: { contentBlockIndex: 2, delta: { toolUse: { input: 'path":"p"}' } } } },
        { messageStop: { stopReason: "tool_use" } },
        { metadata: { usage: { inputTokens: 10, outputTokens: 5, cacheReadInputTokens: 900 }, metrics: { latencyMs: 7 } } },
      ]),
    });
    const onText = jest.fn();
    const result = await streamBedrockTurn(client, req({ onText }));
    expect(onText.mock.calls.map((c) => c[0])).toEqual(["Hel", "lo"]);
    expect(result.content).toBe("Hello");
    expect(result.toolCalls).toEqual([
      { id: "t1", type: "function", function: { name: "get_page_dsl", arguments: '{"page_path":"p"}' } },
    ]);
    expect(result.bedrockContent[0]).toEqual({ reasoning: { text: "plan", signature: "sig" } });
    expect(result.stopReason).toBe("tool_use");
    expect(result.usage).toMatchObject({ cacheReadInputTokens: 900 });
    expect(sendMock.mock.calls[0][0].input.messages[0].content[0]).toEqual({ text: "hi" });
  });

  it("retries a throttled call before any output, then succeeds", async () => {
    const throttled = Object.assign(new Error("slow down"), { name: "ThrottlingException" });
    sendMock
      .mockRejectedValueOnce(throttled)
      .mockResolvedValueOnce({ stream: events([{ contentBlockDelta: { contentBlockIndex: 0, delta: { text: "ok" } } }]) });
    const result = await streamBedrockTurn(client, req(), { backoffMs: 0 });
    expect(result.content).toBe("ok");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry once text has streamed, nor non-retryable errors", async () => {
    sendMock.mockResolvedValueOnce({
      stream: events([
        { contentBlockDelta: { contentBlockIndex: 0, delta: { text: "partial" } } },
        { modelStreamErrorException: { message: "boom" } },
      ]),
    });
    await expect(streamBedrockTurn(client, req(), { backoffMs: 0 })).rejects.toThrow("boom");
    expect(sendMock).toHaveBeenCalledTimes(1);

    sendMock.mockReset();
    sendMock.mockRejectedValueOnce(Object.assign(new Error("bad"), { name: "ValidationException" }));
    await expect(streamBedrockTurn(client, req(), { backoffMs: 0 })).rejects.toThrow("bad");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("drops LLM_EFFORT after the model rejects it and retries without it", async () => {
    process.env.LLM_EFFORT = "high";
    sendMock
      .mockRejectedValueOnce(
        Object.assign(new Error("extraneous key [output_config] is not permitted"), { name: "ValidationException" }),
      )
      .mockResolvedValueOnce({ stream: events([]) });
    await streamBedrockTurn(client, req(), { backoffMs: 0 });
    expect(sendMock.mock.calls[0][0].input.additionalModelRequestFields).toBeDefined();
    expect(sendMock.mock.calls[1][0].input.additionalModelRequestFields).toBeUndefined();
  });
});
