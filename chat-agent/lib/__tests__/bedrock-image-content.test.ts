/**
 * @jest-environment node
 *
 * Verifies how callBedrockWithTools / toBedrockContentBlocks turn chat
 * messages into Bedrock Converse messages: multimodal (image + document)
 * input, tool-use/tool-result pairing, role merging and model selection. We
 * invoke the exported functions with a mock client and inspect the
 * ConverseCommand input it builds.
 */

const sendMock = jest.fn();
let mockModel = "auto";

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: class {},
  // Capture the command input so we can assert on the built messages.
  ConverseCommand: class {
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

import { callBedrockWithTools, toBedrockContentBlocks } from "../aws-bedrock-helper";
import { logger } from "../logger";

const client: any = { send: sendMock };
const B64 = Buffer.from("hello file").toString("base64");
// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

beforeEach(() => {
  jest.clearAllMocks();
  mockModel = "auto";
  sendMock.mockResolvedValue({ output: { message: { content: [] } } });
});

async function convert(messages: any[]) {
  await callBedrockWithTools(client, messages);
  return sendMock.mock.calls[0][0].input;
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
    // Name is sanitized to Bedrock's rules (no dots).
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
    expect(logger.warn).toHaveBeenCalledWith("Skipping document with unsupported format", {
      format: "",
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

describe("callBedrockWithTools — request shape", () => {
  it("converts a text+image user message into text and image blocks", async () => {
    const input = await convert([
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

  it("advertises the DSL tools with auto tool choice", async () => {
    const input = await convert([{ role: "user", content: "hi" }]);
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
  });

  it("joins system messages into the system prompt, or omits it when none", async () => {
    const withSystem = await convert([
      { role: "system", content: "rule one" },
      { role: "system", content: "rule two" },
      { role: "user", content: "hi" },
    ]);
    expect(withSystem.system).toEqual([{ text: "rule one\nrule two\n" }]);
    expect(withSystem.messages).toHaveLength(1);

    sendMock.mockClear();
    const without = await convert([{ role: "user", content: "hi" }]);
    expect(without.system).toBeUndefined();
  });

  it.each([
    ["auto", undefined],
    ["", undefined],
    ["anthropic.claude-x", "anthropic.claude-x"],
  ])("maps TOOL_CAPABLE_MODEL %p to modelId %p", async (model, expected) => {
    mockModel = model;
    const input = await convert([{ role: "user", content: "hi" }]);
    expect(input.modelId).toBe(expected);
  });

  it("returns the client's response", async () => {
    const response = { output: { message: { content: [{ text: "ok" }] } } };
    sendMock.mockResolvedValue(response);
    await expect(callBedrockWithTools(client, [{ role: "user", content: "x" }])).resolves.toBe(
      response,
    );
  });

  it("skips messages that produce no content blocks (empty or unknown role)", async () => {
    const input = await convert([
      { role: "user", content: "" },
      { role: "assistant", content: "" },
      { role: "weird", content: "x" },
      { role: "user", content: "real" },
    ]);
    expect(input.messages).toEqual([{ role: "user", content: [{ text: "real" }] }]);
  });

  it("merges adjacent messages with the same role", async () => {
    const input = await convert([
      { role: "user", content: "a" },
      { role: "user", content: "b" },
    ]);
    expect(input.messages).toEqual([{ role: "user", content: [{ text: "a" }, { text: "b" }] }]);
  });
});

describe("callBedrockWithTools — tool use pairing", () => {
  const toolCall = (id: string, args: any = { pageCode: "home" }) => ({
    id,
    function: { name: "get_page_dsl", arguments: args },
  });

  it("emits toolUse (parsing string args) and pairs results into a user turn", async () => {
    const input = await convert([
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
    // Both tool results are merged into one user turn; object content is stringified.
    expect(input.messages[2]).toEqual({
      role: "user",
      content: [
        { toolResult: { toolUseId: "t1", content: [{ text: "result one" }] } },
        { toolResult: { toolUseId: "t2", content: [{ text: '{"ok":true}' }] } },
      ],
    });
  });

  it("turns a duplicate tool result into a plain text update (Bedrock forbids duplicate ids)", async () => {
    const input = await convert([
      { role: "assistant", content: "", tool_calls: [toolCall("t1")] },
      { role: "tool", tool_call_id: "t1", content: "queued" },
      { role: "tool", tool_call_id: "t1", content: "approved" },
    ]);
    const blocks = input.messages[1].content;
    expect(blocks[0].toolResult.toolUseId).toBe("t1");
    expect(blocks[1]).toEqual({ text: "[Update for tool t1]: approved" });
  });

  it("answers still-pending tool calls with synthetic errors before a new user message", async () => {
    const input = await convert([
      { role: "assistant", content: "", tool_calls: [toolCall("t1")] },
      { role: "user", content: "never mind" },
    ]);
    const userBlocks = input.messages[1].content;
    expect(userBlocks[0].toolResult).toMatchObject({ toolUseId: "t1", status: "error" });
    expect(userBlocks[0].toolResult.content[0].text).toContain("User ignored or interrupted");
    expect(userBlocks[1]).toEqual({ text: "never mind" });
  });

  it("closes trailing pending tool calls in a new user turn after an assistant message", async () => {
    const input = await convert([
      { role: "user", content: "go" },
      { role: "assistant", content: "", tool_calls: [toolCall("t9")] },
    ]);
    expect(input.messages).toHaveLength(3);
    expect(input.messages[2].role).toBe("user");
    expect(input.messages[2].content[0].toolResult).toMatchObject({
      toolUseId: "t9",
      status: "error",
    });
    expect(input.messages[2].content[0].toolResult.content[0].text).toContain("Please proceed");
  });

  it("appends trailing pending tool errors to the last user turn when it is already a user turn", async () => {
    const input = await convert([
      { role: "assistant", content: "", tool_calls: [toolCall("a"), toolCall("b")] },
      { role: "tool", tool_call_id: "a", content: "done" },
    ]);
    expect(input.messages).toHaveLength(2);
    const blocks = input.messages[1].content;
    expect(blocks[0].toolResult.toolUseId).toBe("a");
    expect(blocks[1].toolResult).toMatchObject({ toolUseId: "b", status: "error" });
  });
});
