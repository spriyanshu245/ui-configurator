/**
 * @jest-environment node
 *
 * Branch-level behaviour of runSkillReflection's LLM summarization step. The
 * end-to-end Table/fallback flow lives in skill-learning.test.ts.
 */
const upsertMock = jest.fn();
const enforceBoundsMock = jest.fn();
jest.mock("../../db/queries/skill-entries", () => ({
  skillEntries: {
    upsert: (...a: any[]) => upsertMock(...a),
    enforceBounds: (...a: any[]) => enforceBoundsMock(...a),
  },
}));

const compileMock = jest.fn();
jest.mock("../skill-compiler", () => ({
  compileAgentSkill: (...a: any[]) => compileMock(...a),
}));

const sendMock = jest.fn();
let mockModel = "auto";
jest.mock("../freellm-client", () => ({
  freeLLMClient: { send: (...a: any[]) => sendMock(...a) },
  get TOOL_CAPABLE_MODEL() {
    return mockModel;
  },
}));

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  ConverseCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { runSkillReflection } from "../skill-updater";
import { logger } from "../logger";

const dsl = {
  type: "page",
  components: [{ id: "b", type: "button-v2", properties: { routePage: "p2" } }],
};
const patch = [{ op: "add", path: "/components/0/properties/routePage", value: "p2" }];

function reflect(extra: Record<string, any> = {}) {
  return runSkillReflection({
    patchApplied: patch as any,
    patchedDsl: dsl,
    sourcePatchId: "pp-1",
    ...extra,
  });
}

function llmReturns(text: unknown) {
  sendMock.mockResolvedValue({ output: { message: { content: [{ text }] } } });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockModel = "auto";
  upsertMock.mockResolvedValue("id");
  enforceBoundsMock.mockResolvedValue(undefined);
  compileMock.mockResolvedValue(undefined);
});

describe("runSkillReflection — LLM request", () => {
  it("uses the default Sonnet model for 'auto' and includes the user request in the prompt", async () => {
    llmReturns("[]");
    await reflect({ userRequest: "route the button" });
    const input = sendMock.mock.calls[0][0].input;
    expect(input.modelId).toBe("anthropic.claude-3-5-sonnet-20240620-v1:0");
    expect(input.messages[0].content[0].text).toContain('USER REQUEST: "route the button"');
    expect(input.messages[0].content[0].text).toContain("routing_action");
  });

  it("uses a configured model and omits the USER REQUEST line without one", async () => {
    mockModel = "custom-model";
    llmReturns("[]");
    await reflect();
    const input = sendMock.mock.calls[0][0].input;
    expect(input.modelId).toBe("custom-model");
    expect(input.messages[0].content[0].text).not.toContain("USER REQUEST");
  });
});

describe("runSkillReflection — LLM response handling", () => {
  const good = { category: "routing_pattern", title: "T", content: "C", confidence: 0.9 };

  it("strips a markdown code fence around the JSON", async () => {
    llmReturns("```json\n" + JSON.stringify([good]) + "\n```");
    await reflect();
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0][0]).toMatchObject({ title: "T", confidence: 0.9 });
  });

  it("filters invalid entries, defaults confidence to 0.7 and keeps at most 3", async () => {
    llmReturns(
      JSON.stringify([
        { ...good, title: "A", confidence: undefined },
        { ...good, title: "B" },
        null,
        { title: "no content" },
        { ...good, title: "C" },
        { ...good, title: "D" },
      ]),
    );
    await reflect();
    const titles = upsertMock.mock.calls.map((c) => c[0].title);
    expect(titles).toEqual(["A", "B", "C"]);
    expect(upsertMock.mock.calls[0][0].confidence).toBe(0.7);
  });

  it.each([
    ["no text block", { output: { message: { content: [{ toolUse: {} }] } } }],
    ["empty text", { output: { message: { content: [{ text: "" }] } } }],
    ["no output", {}],
    ["a non-array JSON payload", { output: { message: { content: [{ text: '{"a":1}' }] } } }],
    ["an empty array", { output: { message: { content: [{ text: "[]" }] } } }],
    [
      "only invalid entries",
      { output: { message: { content: [{ text: '[{"title":1}]' }] } } },
    ],
  ])("falls back to the deterministic template on %s", async (_label, response) => {
    sendMock.mockResolvedValue(response);
    await reflect();
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const saved = upsertMock.mock.calls[0][0];
    expect(saved.title).toBe("Route a control to a page");
    expect(saved.category).toBe("routing_pattern");
    expect(saved.source).toBe("agent_reflection");
    expect(saved.sourcePatchId).toBe("pp-1");
  });

  it("warns and falls back when the response is not valid JSON", async () => {
    llmReturns("not json at all");
    await reflect();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("falling back to deterministic template"),
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(upsertMock.mock.calls[0][0].title).toBe("Route a control to a page");
  });
});

describe("runSkillReflection — orchestration", () => {
  it("compiles then enforces bounds after upserting every entry", async () => {
    llmReturns(JSON.stringify([{ category: "dsl_rule", title: "T", content: "C" }]));
    await reflect();
    expect(compileMock).toHaveBeenCalledTimes(1);
    expect(enforceBoundsMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.invocationCallOrder[0]).toBeLessThan(compileMock.mock.invocationCallOrder[0]);
    expect(compileMock.mock.invocationCallOrder[0]).toBeLessThan(
      enforceBoundsMock.mock.invocationCallOrder[0],
    );
  });

  it("logs an error and resolves when compile fails", async () => {
    llmReturns("[]");
    compileMock.mockRejectedValue(new Error("fs"));
    await expect(reflect()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith("Skill reflection failed", { error: "fs" });
    expect(enforceBoundsMock).not.toHaveBeenCalled();
  });
});
