/**
 * @jest-environment node
 */
const existsSyncMock = jest.fn();
const readFileSyncMock = jest.fn();
jest.mock("fs", () => ({
  existsSync: (...a: any[]) => existsSyncMock(...a),
  readFileSync: (...a: any[]) => readFileSyncMock(...a),
}));

const toArrayMock = jest.fn();
const findMock = jest.fn(() => ({ toArray: toArrayMock }));
const collectionMock = jest.fn(() => ({ find: findMock }));
jest.mock("../../db/client", () => ({
  db: { collection: (...a: any[]) => (collectionMock as any)(...a) },
}));

const fetchPagesMock = jest.fn();
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: (...a: any[]) => fetchPagesMock(...a),
}));

jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { buildSystemPrompt, buildSystemPromptParts, renderRegistry } from "../prompt-builder";
import { logger } from "../logger";

/** Virtual knowledge dir: file-name suffix -> contents (missing = does not exist). */
let files: Record<string, string>;

function fileFor(p: string): string | undefined {
  const key = Object.keys(files).find((k) => String(p).replace(/\\/g, "/").endsWith(k));
  return key ? files[key] : undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  files = {
    "knowledge/agentSkill.md": "CURATED SKILL BODY",
    "knowledge/learnedSkills.md": "  learned pattern one  ",
    "knowledge/component-registry.json": '{"button":{}}',
  };
  existsSyncMock.mockImplementation((p: string) => fileFor(p) !== undefined);
  readFileSyncMock.mockImplementation((p: string) => {
    const content = fileFor(p);
    if (content === undefined) throw new Error("ENOENT");
    return content;
  });
  toArrayMock.mockResolvedValue([]);
  fetchPagesMock.mockResolvedValue({ pages: [] });
});

describe("buildSystemPrompt — knowledge sources", () => {
  it("embeds the curated skill, trimmed learned skills and the component registry", async () => {
    const prompt = await buildSystemPrompt({});
    expect(prompt).toContain("═══ YOUR KNOWLEDGE BASE ═══\nCURATED SKILL BODY");
    expect(prompt).toContain("═══ LEARNED FROM PAST SESSIONS ═══");
    expect(prompt).toContain("learned pattern one\n");
    expect(prompt).not.toContain("  learned pattern one  ");
    expect(prompt).toContain("button: (no props)");
  });

  it("uses the placeholder when agentSkill.md is absent", async () => {
    delete files["knowledge/agentSkill.md"];
    expect(await buildSystemPrompt({})).toContain("# No knowledge base compiled yet.");
  });

  it("uses the placeholder when reading agentSkill.md throws", async () => {
    readFileSyncMock.mockImplementation((p: string) => {
      if (String(p).includes("agentSkill")) throw new Error("EACCES");
      return fileFor(p);
    });
    expect(await buildSystemPrompt({})).toContain("# No knowledge base compiled yet.");
  });

  it("omits the learned section when the file is missing and warns when reading it fails", async () => {
    delete files["knowledge/learnedSkills.md"];
    expect(await buildSystemPrompt({})).not.toContain("LEARNED FROM PAST SESSIONS");

    files["knowledge/learnedSkills.md"] = "x";
    readFileSyncMock.mockImplementation((p: string) => {
      if (String(p).includes("learnedSkills")) throw new Error("read fail");
      return fileFor(p);
    });
    const prompt = await buildSystemPrompt({});
    expect(prompt).not.toContain("LEARNED FROM PAST SESSIONS");
    expect(logger.warn).toHaveBeenCalledWith("Failed to read learned skills", { error: "read fail" });
  });

  it("defaults the component registry to {} when missing, and logs when reading it fails", async () => {
    delete files["knowledge/component-registry.json"];
    expect(await buildSystemPrompt({})).toContain("(* = required, [] = array, {} = object)\n\n");

    files["knowledge/component-registry.json"] = "{}";
    readFileSyncMock.mockImplementation((p: string) => {
      if (String(p).includes("component-registry")) throw new Error("bad registry");
      return fileFor(p);
    });
    await buildSystemPrompt({});
    expect(logger.error).toHaveBeenCalledWith("Failed to read component registry", {
      error: "bad registry",
    });
  });
});

describe("buildSystemPrompt — preferences", () => {
  it("queries global and per-user/microsite preferences and lists them", async () => {
    toArrayMock.mockResolvedValue([
      { key: "theme", value: "dark" },
      { key: "naming", value: "snake_case" },
    ]);
    const prompt = await buildSystemPrompt({ userId: "u1", micrositeId: "m1" });
    expect(collectionMock).toHaveBeenCalledWith("user_preferences");
    expect(findMock).toHaveBeenCalledWith({
      $or: [{ userId: "u1", micrositeId: "m1" }, { userId: "__global__" }],
    });
    expect(prompt).toContain("theme: dark\nnaming: snake_case");
  });

  it("logs and continues with no preferences when the query fails", async () => {
    toArrayMock.mockRejectedValue(new Error("mongo down"));
    const prompt = await buildSystemPrompt({});
    expect(logger.error).toHaveBeenCalledWith("Failed to fetch user preferences", {
      error: "mongo down",
    });
    expect(prompt).toContain("═══ USER PREFERENCES (learned) ═══\n\n");
  });
});

describe("buildSystemPrompt — microsite pages and context", () => {
  it("does not fetch pages without a micrositeId", async () => {
    const prompt = await buildSystemPrompt({});
    expect(fetchPagesMock).not.toHaveBeenCalled();
    expect(prompt).toContain("Microsite ID: Not provided");
    expect(prompt).toContain("Active Page Code: Not provided");
    expect(prompt).toContain("Active Page ID: Not provided");
    expect(prompt).toContain("Last task: None");
    expect(prompt).toContain("Page history: {}");
  });

  it("lists every page with its JSON when a micrositeId is given", async () => {
    fetchPagesMock.mockResolvedValue({
      pages: [
        { pageCode: "home", components: [] },
        { pageCode: "detail", components: [] },
      ],
    });
    const prompt = await buildSystemPrompt({ micrositeId: "m1", pageCode: "home", id: "p-1" });
    expect(fetchPagesMock).toHaveBeenCalledWith("m1");
    expect(prompt).toContain("Pages (2): home, detail");
    expect(prompt).not.toContain("--- PAGE:");
    expect(prompt).toContain("Microsite ID: m1");
    expect(prompt).toContain("Active Page Code: home");
    expect(prompt).toContain("Active Page ID: p-1");
  });

  it("treats a response without pages as an empty microsite", async () => {
    fetchPagesMock.mockResolvedValue(null);
    expect(await buildSystemPrompt({ micrositeId: "m1" })).toContain("Pages (0): ");
  });

  it("logs and continues when the microsite fetch fails", async () => {
    fetchPagesMock.mockRejectedValue(new Error("404"));
    const prompt = await buildSystemPrompt({ micrositeId: "m1" });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch initial microsite data for system prompt",
      { error: "404" },
    );
    expect(prompt).not.toContain("Pages (");
  });

  it("renders task context, pending patch flag and page history", async () => {
    const prompt = await buildSystemPrompt({
      taskContext: { intent: "add table", pendingPatch: true },
      pageOps: { home: ["added"] },
    });
    expect(prompt).toContain("Last task: add table");
    expect(prompt).toContain("Pending unapproved patch exists.");
    expect(prompt).toContain('Page history: {"home":["added"]}');
  });

  it("renders string and object reference DSLs / session context sections", async () => {
    const withString = await buildSystemPrompt({
      referenceDsls: "RAW REF",
      sessionContext: "RAW SESSION",
    });
    expect(withString).toContain("═══ REFERENCE DSLs ═══\nRAW REF\n");
    expect(withString).toContain("═══ SESSION DATA ═══\nRAW SESSION\n");

    const withObject = await buildSystemPrompt({
      referenceDsls: { a: 1 },
      sessionContext: { s: true },
    });
    expect(withObject).toContain('═══ REFERENCE DSLs ═══\n{\n  "a": 1\n}\n');
    expect(withObject).toContain('═══ SESSION DATA ═══\n{\n  "s": true\n}\n');
  });

  it("omits the optional sections when nothing is supplied", async () => {
    const prompt = await buildSystemPrompt({});
    expect(prompt).not.toContain("═══ REFERENCE DSLs ═══");
    expect(prompt).not.toContain("═══ SESSION DATA ═══");
  });
});

describe("buildSystemPromptParts — caching layout", () => {
  it("keeps the static part identical across turns, users and microsites", async () => {
    fetchPagesMock.mockResolvedValue({ pages: [{ pageCode: "a", pageVersion: 2 }] });
    toArrayMock.mockResolvedValue([{ key: "k", value: "v" }]);
    const one = await buildSystemPromptParts({ micrositeId: "m1", userId: "u1", taskContext: { intent: "x" } });
    const two = await buildSystemPromptParts({ micrositeId: "m2", userId: "u2", pageOps: { p: [1] } });
    expect(one.staticText).toBe(two.staticText);
    expect(one.dynamicText).not.toBe(two.dynamicText);
    expect(one.dynamicText).toContain("Pages (1): a@v2");
    expect(one.staticText).not.toContain("Microsite ID");
  });

  it("puts learned skills (without the compile timestamp) in the dynamic part", async () => {
    files["knowledge/learnedSkills.md"] = [
      "# Learned",
      "",
      "_Compiled on 2026-10-15T12:03:53.384Z from 150 entries_",
      "",
      "entry body",
    ].join("\n");
    const parts = await buildSystemPromptParts({});
    expect(parts.staticText).not.toContain("LEARNED FROM PAST SESSIONS");
    expect(parts.dynamicText).toContain("LEARNED FROM PAST SESSIONS");
    expect(parts.dynamicText).not.toContain("Compiled on");
    expect(parts.dynamicText).toContain("entry body");
  });

  it("asks for one proposal per request and points attachments at their tools", async () => {
    const { staticText } = await buildSystemPromptParts({});
    expect(staticText).not.toContain("Break multi-section changes into sequential proposals");
    expect(staticText).toContain("ONE user request = ONE proposal");
    expect(staticText).toContain("att-");
  });

  it("lists this chat's attachments", async () => {
    const { dynamicText } = await buildSystemPromptParts({
      attachments: [{ handle: "att-0123456789", name: "dev.json", kind: "dsl", summary: "page DSL JSON, 3 components" }],
    });
    expect(dynamicText).toContain("═══ ATTACHMENTS IN THIS CHAT ═══");
    expect(dynamicText).toContain('- att-0123456789 "dev.json": page DSL JSON, 3 components');
  });
});

describe("renderRegistry", () => {
  it("renders one compact block per type with markers, children and compact example", () => {
    const text = renderRegistry({
      form: {
        props: { name: { type: "string", required: true }, nameKeyIds: { type: "array" }, cfg: { type: "object" } },
        children: ["sub-section"],
        notes: "n",
        example: { id: "1", type: "form", properties: { name: "f", empty: "", list: [] } },
      },
      spacer: {},
    });
    expect(text.split("\n")).toEqual([
      "form: name*, nameKeyIds[], cfg{}",
      "  children: sub-section",
      "  notes: n",
      '  example: {"id":"1","type":"form","properties":{"name":"f"}}',
      "spacer: (no props)",
    ]);
  });
});
