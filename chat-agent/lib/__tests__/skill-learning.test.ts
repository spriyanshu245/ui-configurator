/**
 * @jest-environment node
 *
 * BEFORE/AFTER DEMO (Workstream D acceptance criterion):
 *
 * BEFORE: chat-agent/knowledge/agentSkill.md documents form prefill-read
 * (storePrefillInSession/prefillApiName), ${...} interpolation, conditional
 * rendering, and navigation — but says NOTHING about the table-data-WRITE
 * pattern (storeDataInSession + apiName + pathToTableData + nameKeyIds).
 *
 * AFTER: given a confirmed patch that adds a Table configured with that
 * write pattern, the extractor recognizes it, the deterministic fallback
 * synthesizes a correctly-worded skill entry, and runSkillReflection
 * persists + compiles it — closing exactly that gap.
 */

const upsertMock = jest.fn();
const enforceBoundsMock = jest.fn();
const findAllMock = jest.fn();
const markUsedMock = jest.fn();

jest.mock("../../db/queries/skill-entries", () => ({
  skillEntries: {
    upsert: (...args: any[]) => upsertMock(...args),
    enforceBounds: (...args: any[]) => enforceBoundsMock(...args),
    findAll: (...args: any[]) => findAllMock(...args),
    markUsed: (...args: any[]) => markUsedMock(...args),
  },
}));

const sendMock = jest.fn();
jest.mock("../freellm-client", () => ({
  freeLLMClient: { send: (...args: any[]) => sendMock(...args) },
  TOOL_CAPABLE_MODEL: "auto",
}));

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  ConverseCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

// compileAgentSkill (invoked internally by runSkillReflection) writes to
// chat-agent/knowledge/agentSkill.md via fs.writeFileSync + renameSync. Mock
// the filesystem writes so tests never touch the real seed file on disk,
// while still allowing the "BEFORE" test below to read the REAL seed content
// via jest.requireActual("fs").
const writeFileSyncMock = jest.fn();
const renameSyncMock = jest.fn();
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: (...args: any[]) => writeFileSyncMock(...args),
    renameSync: (...args: any[]) => renameSyncMock(...args),
    readFileSync: actual.readFileSync,
  };
});

import * as fs from "fs";
import * as path from "path";
import {
  mineSessionBindingCandidates,
  candidateToSkillEntry,
} from "../skill-extractor";
import { runSkillReflection } from "../skill-updater";
import { compileAgentSkill } from "../skill-compiler";

const realFs = jest.requireActual("fs") as typeof fs;

// ---------------------------------------------------------------------------
// Fixture: a confirmed patch that ADDS a Table component configured with the
// table-data-WRITE session binding pattern.
// ---------------------------------------------------------------------------
const patchedDsl = {
  id: "root",
  type: "page",
  properties: {},
  components: [
    {
      id: "table-1",
      type: "Table",
      properties: {
        storeDataInSession: true,
        apiName: "loanAccountsList",
        pathToTableData: "data.accounts",
        nameKeyIds: ["lan", "loanTenure"],
        columns: [{ key: "lan", label: "LAN" }],
      },
      components: [],
    },
  ],
};

const patchApplied = [
  {
    op: "add",
    path: "/components/0",
    value: patchedDsl.components[0],
  },
];

describe("curated agentSkill.md now covers the session-data grammar (Q2 gap closed)", () => {
  it("documents both the form-prefill READ side and the table-data-WRITE / clicked-row side", () => {
    const curatedPath = path.join(process.cwd(), "chat-agent/knowledge/agentSkill.md");
    const curated = realFs.readFileSync(curatedPath, "utf-8");

    expect(curated).toContain("storePrefillInSession");
    expect(curated).toContain("prefillApiName");

    expect(curated).toContain("storeDataInSession");
    expect(curated).toContain("pathToTableData");
    expect(curated).toContain("nameKeyIds");
    expect(curated).toContain("dataTransfer");
    expect(curated).toContain("micrositeNav.");
    expect(curated).toContain("fetchFromSession");
  });
});

describe("compileAgentSkill writes the LEARNED layer, never the curated base", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findAllMock.mockResolvedValue([]);
    markUsedMock.mockResolvedValue(undefined);
  });

  it("writes learnedSkills.md and leaves agentSkill.md untouched", async () => {
    await compileAgentSkill();

    const writtenPaths = [
      ...writeFileSyncMock.mock.calls.map((c) => String(c[0])),
      ...renameSyncMock.mock.calls.flatMap((c) => [String(c[0]), String(c[1])]),
    ];

    expect(writtenPaths.some((p) => p.includes("learnedSkills.md"))).toBe(true);
    expect(writtenPaths.some((p) => p.includes("agentSkill.md"))).toBe(false);
  });
});

describe("mineSessionBindingCandidates", () => {
  it("recognizes a table_binding candidate from the confirmed patch", () => {
    const candidates = mineSessionBindingCandidates(patchApplied as any, patchedDsl);

    const tableCandidate = candidates.find((c) => c.primitive === "table_binding");
    expect(tableCandidate).toBeDefined();
    expect(tableCandidate!.componentType).toBe("Table");
    expect(tableCandidate!.exampleValue).toEqual(
      expect.objectContaining({
        storeDataInSession: true,
        apiName: "loanAccountsList",
        pathToTableData: "data.accounts",
        nameKeyIds: ["lan", "loanTenure"],
      }),
    );
  });

  it("generalizes numeric pointer indices to {n} in pathTemplate", () => {
    const candidates = mineSessionBindingCandidates(patchApplied as any, patchedDsl);
    const tableCandidate = candidates.find((c) => c.primitive === "table_binding");
    expect(tableCandidate!.pathTemplate).toBe("/components/{n}");
  });

  it("returns an empty array for a patch with no recognizable session-binding primitives", () => {
    const plainDsl = {
      id: "root",
      type: "page",
      components: [{ id: "h1", type: "Heading", properties: { text: "Hello" }, components: [] }],
    };
    const plainPatch = [{ op: "replace", path: "/components/0/properties/text", value: "Hello" }];
    const candidates = mineSessionBindingCandidates(plainPatch as any, plainDsl);
    expect(candidates).toEqual([]);
  });
});

describe("broadened recognizers (routing / popup / general fallback)", () => {
  it("recognizes a routing action on a button-v2 (routePage + routingType)", () => {
    const dsl = {
      id: "root",
      type: "page",
      components: [
        {
          id: "b1",
          type: "button-v2",
          properties: { actionType: "routing", routingType: "Internal", routePage: "m1_detail" },
          components: [],
        },
      ],
    };
    const patch = [{ op: "add", path: "/components/0/properties/routePage", value: "m1_detail" }];
    const candidates = mineSessionBindingCandidates(patch as any, dsl);
    const routing = candidates.find((c) => c.primitive === "routing_action");
    expect(routing).toBeDefined();
    expect(routing!.componentType).toBe("button-v2");

    const entry = candidateToSkillEntry(routing!);
    expect(entry.category).toBe("routing_pattern");
    expect(entry.content).toContain("routePage");
  });

  it("recognizes popup page config from a page-level showAsPopup", () => {
    const dsl = {
      id: "m1_popup",
      type: "page",
      properties: { showAsPopup: true, panePosition: "right", popupWidth: 40 },
      components: [],
    };
    const patch = [{ op: "add", path: "/properties/showAsPopup", value: true }];
    const candidates = mineSessionBindingCandidates(patch as any, dsl);
    const popup = candidates.find((c) => c.primitive === "popup_page");
    expect(popup).toBeDefined();
    expect(candidateToSkillEntry(popup!).content).toContain("showAsPopup");
  });

  it("falls back to a conservative component_config entry for an otherwise-unrecognized property (low confidence, per-prop title)", () => {
    const dsl = {
      id: "root",
      type: "page",
      components: [
        { id: "t1", type: "Table", properties: { pageSize: 25 }, components: [] },
      ],
    };
    const patch = [{ op: "replace", path: "/components/0/properties/pageSize", value: 25 }];
    const candidates = mineSessionBindingCandidates(patch as any, dsl);
    const general = candidates.find((c) => c.primitive === "component_config");
    expect(general).toBeDefined();

    const entry = candidateToSkillEntry(general!);
    expect(entry.confidence).toBe(0.4);
    expect(entry.title).toBe("Table: set pageSize");
  });

  it("does NOT emit a general entry for purely presentational leaf keys (label/text)", () => {
    const dsl = {
      id: "root",
      type: "page",
      components: [
        { id: "h1", type: "Heading", properties: { text: "Hello" }, components: [] },
      ],
    };
    const patch = [{ op: "replace", path: "/components/0/properties/text", value: "Hello" }];
    const candidates = mineSessionBindingCandidates(patch as any, dsl);
    expect(candidates).toEqual([]);
  });
});

describe("candidateToSkillEntry (LLM-free deterministic fallback)", () => {
  it("produces a 'Table session-data binding' entry mentioning the exact keys", () => {
    const candidates = mineSessionBindingCandidates(patchApplied as any, patchedDsl);
    const tableCandidate = candidates.find((c) => c.primitive === "table_binding")!;

    const entry = candidateToSkillEntry(tableCandidate);

    expect(entry.title).toBe("Table session-data binding");
    expect(entry.category).toBe("component_pattern");
    expect(entry.content).toContain("storeDataInSession");
    expect(entry.content).toContain("apiName");
    expect(entry.content).toContain("pathToTableData");
    expect(entry.content).toContain("nameKeyIds");
    expect(entry.confidence).toBe(0.7);
  });
});

describe("runSkillReflection — full AFTER flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    upsertMock.mockResolvedValue("entry-id-1");
    enforceBoundsMock.mockResolvedValue(undefined);
    findAllMock.mockResolvedValue([]);
    markUsedMock.mockResolvedValue(undefined);
  });

  it("upserts a table-binding skill entry and triggers compile+enforceBounds when the LLM call fails (fallback path)", async () => {
    sendMock.mockRejectedValue(new Error("Bedrock client has no .send-compatible chat shape / network error"));

    await runSkillReflection({
      userRequest: "Add a table showing loan accounts",
      patchApplied: patchApplied as any,
      patchedDsl,
      sourcePatchId: "patch-123",
    });

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upserted = upsertMock.mock.calls[0][0];
    expect(upserted.title).toBe("Table session-data binding");
    expect(upserted.source).toBe("agent_reflection");
    expect(upserted.sourcePatchId).toBe("patch-123");
    expect(upserted.content).toContain("storeDataInSession");
    expect(upserted.content).toContain("apiName");
    expect(upserted.content).toContain("pathToTableData");
    expect(upserted.content).toContain("nameKeyIds");

    // compileAgentSkill was invoked (real implementation) which calls findAll + markUsed.
    expect(findAllMock).toHaveBeenCalled();
    expect(enforceBoundsMock).toHaveBeenCalledTimes(1);
  });

  it("never throws even if upsert itself fails (fire-and-forget safety)", async () => {
    sendMock.mockRejectedValue(new Error("network down"));
    upsertMock.mockRejectedValue(new Error("mongo write failed"));

    await expect(
      runSkillReflection({
        patchApplied: patchApplied as any,
        patchedDsl,
        sourcePatchId: "patch-456",
      }),
    ).resolves.toBeUndefined();
  });

  it("returns early (no upsert) when no candidates are mined", async () => {
    const plainDsl = {
      id: "root",
      type: "page",
      components: [{ id: "h1", type: "Heading", properties: { text: "Hello" }, components: [] }],
    };
    const plainPatch = [{ op: "replace", path: "/components/0/properties/text", value: "Hello" }];

    await runSkillReflection({
      patchApplied: plainPatch as any,
      patchedDsl: plainDsl,
      sourcePatchId: "patch-789",
    });

    expect(upsertMock).not.toHaveBeenCalled();
    expect(enforceBoundsMock).not.toHaveBeenCalled();
  });

  it("uses the LLM summarization result when the Bedrock call succeeds", async () => {
    sendMock.mockResolvedValue({
      output: {
        message: {
          content: [
            {
              text: JSON.stringify([
                {
                  category: "component_pattern",
                  title: "Table session-data binding",
                  content:
                    "Set storeDataInSession, apiName, pathToTableData, and nameKeyIds on a Table to write rows into session.",
                  confidence: 0.85,
                },
              ]),
            },
          ],
        },
      },
    });

    await runSkillReflection({
      userRequest: "Add a table showing loan accounts",
      patchApplied: patchApplied as any,
      patchedDsl,
      sourcePatchId: "patch-999",
    });

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upserted = upsertMock.mock.calls[0][0];
    expect(upserted.confidence).toBe(0.85);
    expect(upserted.content).toContain("storeDataInSession");
  });
});
