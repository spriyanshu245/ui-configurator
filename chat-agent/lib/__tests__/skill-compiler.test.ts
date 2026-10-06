/**
 * @jest-environment node
 */
const findAllMock = jest.fn();
const markUsedMock = jest.fn();
jest.mock("../../db/queries/skill-entries", () => ({
  skillEntries: {
    findAll: (...a: any[]) => findAllMock(...a),
    markUsed: (...a: any[]) => markUsedMock(...a),
  },
}));

const existsSyncMock = jest.fn();
const mkdirSyncMock = jest.fn();
const writeFileSyncMock = jest.fn();
const renameSyncMock = jest.fn();
jest.mock("fs", () => ({
  existsSync: (...a: any[]) => existsSyncMock(...a),
  mkdirSync: (...a: any[]) => mkdirSyncMock(...a),
  writeFileSync: (...a: any[]) => writeFileSyncMock(...a),
  renameSync: (...a: any[]) => renameSyncMock(...a),
}));

jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { compileAgentSkill } from "../skill-compiler";
import { logger } from "../logger";

function entry(over: Record<string, any>) {
  return {
    id: "e",
    category: "dsl_rule",
    title: "T",
    content: "C",
    confidence: 0.5,
    usageCount: 0,
    ...over,
  };
}

function written(): string {
  return writeFileSyncMock.mock.calls[0][1];
}

beforeEach(() => {
  jest.clearAllMocks();
  existsSyncMock.mockReturnValue(true);
  markUsedMock.mockResolvedValue(undefined);
  findAllMock.mockResolvedValue([]);
});

describe("compileAgentSkill", () => {
  it("queries entries ordered by category then usage", async () => {
    await compileAgentSkill();
    expect(findAllMock).toHaveBeenCalledWith({
      orderBy: { category: "asc", usageCount: "desc" },
    });
  });

  it("writes an atomic temp file then renames it onto learnedSkills.md", async () => {
    await compileAgentSkill();
    const tmp = String(writeFileSyncMock.mock.calls[0][0]).replace(/\\/g, "/");
    const [from, to] = renameSyncMock.mock.calls[0].map((p: string) => String(p).replace(/\\/g, "/"));
    expect(tmp.endsWith("chat-agent/knowledge/learnedSkills.md.tmp")).toBe(true);
    expect(from).toBe(tmp);
    expect(to.endsWith("chat-agent/knowledge/learnedSkills.md")).toBe(true);
  });

  it("creates the knowledge directory when it does not exist", async () => {
    existsSyncMock.mockReturnValue(false);
    await compileAgentSkill();
    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("does not create the directory when it exists", async () => {
    await compileAgentSkill();
    expect(mkdirSyncMock).not.toHaveBeenCalled();
  });

  it("renders a header and no category sections for zero entries; nothing is marked used", async () => {
    await compileAgentSkill();
    expect(written()).toContain("# Learned DSL Knowledge (compiled from past sessions)");
    expect(written()).toContain("from 0 entries");
    expect(written()).not.toContain("##");
    expect(markUsedMock).not.toHaveBeenCalled();
  });

  it("groups by uppercase category (sorted) and orders by confidence then usage", async () => {
    findAllMock.mockResolvedValue([
      entry({ id: "1", category: "routing_pattern", title: "Low", confidence: 0.2 }),
      entry({ id: "2", category: "dsl_rule", title: "HighA", confidence: 0.9, usageCount: 1 }),
      entry({ id: "3", category: "dsl_rule", title: "HighB", confidence: 0.9, usageCount: 5 }),
      entry({ id: "4", category: "dsl_rule", title: "HighC", confidence: 0.9, usageCount: undefined }),
    ]);
    await compileAgentSkill();
    const md = written();
    expect(md.indexOf("## DSL_RULE")).toBeLessThan(md.indexOf("## ROUTING_PATTERN"));
    const order = ["HighB", "HighA", "HighC"].map((t) => md.indexOf(`### ${t} (Confidence: 0.9)`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(markUsedMock).toHaveBeenCalledWith(["3", "2", "4", "1"]);
  });

  it("treats a missing usageCount as 0 when confidences tie", async () => {
    findAllMock.mockResolvedValue([
      entry({ id: "n1", title: "N1", usageCount: undefined }),
      entry({ id: "u2", title: "U2", usageCount: 2 }),
      entry({ id: "n3", title: "N3", usageCount: undefined }),
      entry({ id: "u4", title: "U4", usageCount: 1 }),
    ]);
    await compileAgentSkill();
    expect(markUsedMock.mock.calls[0][0].slice(0, 2)).toEqual(["u2", "u4"]);
  });

  it("renders at most 20 entries per category", async () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      entry({ id: `id${i}`, title: `Title${i}`, confidence: 1 - i / 100 }),
    );
    findAllMock.mockResolvedValue(many);
    await compileAgentSkill();
    expect(markUsedMock.mock.calls[0][0]).toHaveLength(20);
    expect(written()).toContain("### Title19 ");
    expect(written()).not.toContain("### Title20 ");
  });

  it("logs but does not throw when markUsed fails", async () => {
    findAllMock.mockResolvedValue([entry({ id: "1" })]);
    markUsedMock.mockRejectedValue(new Error("db"));
    await expect(compileAgentSkill()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith("Failed to mark skill entries as used", { error: "db" });
  });
});
