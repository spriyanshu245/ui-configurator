/**
 * @jest-environment node
 *
 * Verifies the wireframe/design-image input path: that callBedrockWithTools
 * turns multimodal user content into Bedrock Converse image blocks. We invoke
 * the exported function with a mock client and inspect the ConverseCommand it
 * builds, rather than testing the private helper directly.
 */

const sendMock = jest.fn().mockResolvedValue({ output: { message: { content: [] } } });

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

jest.mock("../freellm-client", () => ({ TOOL_CAPABLE_MODEL: "auto" }));
jest.mock("../tool-definitions", () => ({ DSL_TOOLS: [] }));

import { callBedrockWithTools } from "../aws-bedrock-helper";

function getSentMessages() {
  const command = sendMock.mock.calls[0][0];
  return command.input.messages;
}

describe("callBedrockWithTools — image content", () => {
  const client: any = { send: sendMock };
  // 1x1 transparent PNG
  const PNG_B64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  beforeEach(() => sendMock.mockClear());

  it("converts a text+image user message into text and image Converse blocks", async () => {
    await callBedrockWithTools(client, [
      {
        role: "user",
        content: [
          { type: "text", text: "Match this wireframe" },
          { type: "image", format: "png", dataBase64: PNG_B64 },
        ],
      },
    ]);

    const messages = getSentMessages();
    const userBlocks = messages[0].content;

    expect(userBlocks.some((b: any) => b.text === "Match this wireframe")).toBe(true);
    const imageBlock = userBlocks.find((b: any) => b.image);
    expect(imageBlock).toBeDefined();
    expect(imageBlock.image.format).toBe("png");
    expect(Buffer.isBuffer(imageBlock.image.source.bytes)).toBe(true);
    // Bytes must decode from the supplied base64.
    expect(imageBlock.image.source.bytes.equals(Buffer.from(PNG_B64, "base64"))).toBe(true);
  });

  it("still handles a plain string user message as a single text block", async () => {
    await callBedrockWithTools(client, [
      { role: "user", content: "just text" },
    ]);
    const userBlocks = getSentMessages()[0].content;
    expect(userBlocks).toEqual([{ text: "just text" }]);
  });

  it("skips images with an unsupported format", async () => {
    await callBedrockWithTools(client, [
      {
        role: "user",
        content: [
          { type: "text", text: "hi" },
          { type: "image", format: "tiff", dataBase64: PNG_B64 },
        ],
      },
    ]);
    const userBlocks = getSentMessages()[0].content;
    expect(userBlocks.some((b: any) => b.image)).toBe(false);
    expect(userBlocks.some((b: any) => b.text === "hi")).toBe(true);
  });
});
