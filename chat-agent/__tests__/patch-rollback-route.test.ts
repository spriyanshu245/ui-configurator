/**
 * @jest-environment node
 */

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    toString: () => "session=abc",
  }),
}));

jest.mock("../db/queries/dsl-history", () => ({
  dslHistory: {
    getEntry: jest.fn(),
    saveSnapshot: jest.fn().mockResolvedValue("new-history-id"),
  },
  sessionOps: {
    appendOp: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../lib/dsl-patcher", () => ({
  validateAndAssignIds: jest.fn(),
}));

jest.mock("../lib/backend-sync", () => ({
  putPageDsl: jest.fn().mockResolvedValue({ latestDsl: {} }),
}));

jest.mock("../lib/microsite-loader", () => ({
  // Page /home is at backend version 5 — the rollback GET/PUT must use it, not 1.
  fetchMicrositePages: jest
    .fn()
    .mockResolvedValue({ pages: [{ pageCode: "/home", pageVersion: 5 }] }),
}));

jest.mock("../../src/app/utils/utils", () => ({
  getApiBaseUrl: () => "https://api.test.example",
}));

import { POST } from "../../src/app/api/patch/rollback/route";
import { dslHistory, sessionOps } from "../db/queries/dsl-history";
import { validateAndAssignIds } from "../lib/dsl-patcher";
import { putPageDsl } from "../lib/backend-sync";

const getEntryMock = dslHistory.getEntry as jest.Mock;
const saveSnapshotMock = dslHistory.saveSnapshot as jest.Mock;
const appendOpMock = sessionOps.appendOp as jest.Mock;
const putPageDslMock = putPageDsl as jest.Mock;
const validateAndAssignIdsMock = validateAndAssignIds as jest.Mock;

function makeReq(body: any) {
  return new Request("https://example.test/api/patch/rollback", {
    method: "POST",
    headers: { "x-user-id": "u1" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/patch/rollback", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    getEntryMock.mockReset();
    saveSnapshotMock.mockClear();
    saveSnapshotMock.mockResolvedValue("new-history-id");
    appendOpMock.mockClear();
    putPageDslMock.mockClear();
    putPageDslMock.mockResolvedValue({ latestDsl: {} });
    validateAndAssignIdsMock.mockReset();
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: true }),
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 404 when the snapshot is missing", async () => {
    getEntryMock.mockResolvedValue(null);

    const res = await POST(
      makeReq({ micrositeId: "m1", pagePath: "/home", historyId: "h1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/Snapshot no longer available/);
    expect(putPageDslMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the snapshot fails validation", async () => {
    getEntryMock.mockResolvedValue({
      id: "h1",
      micrositeId: "m1",
      pagePath: "/home",
      dslSnapshot: { id: "root", type: "page", components: [] },
      createdAt: "2026-01-01T00:00:00.000Z",
      sessionId: "s1",
    });
    validateAndAssignIdsMock.mockImplementation(() => {
      throw new Error("Component type is not registered.");
    });

    const res = await POST(
      makeReq({ micrositeId: "m1", pagePath: "/home", historyId: "h1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/failed validation/);
    expect(putPageDslMock).not.toHaveBeenCalled();
  });

  it("happy path: calls putPageDsl with the target snapshot and saveSnapshot with operation rollback", async () => {
    const targetSnapshot = { id: "root", type: "page", components: [] };
    getEntryMock.mockResolvedValue({
      id: "h1",
      micrositeId: "m1",
      pagePath: "/home",
      dslSnapshot: targetSnapshot,
      createdAt: "2026-01-01T00:00:00.000Z",
      sessionId: "s1",
    });
    validateAndAssignIdsMock.mockImplementation(() => {});

    const res = await POST(
      makeReq({ micrositeId: "m1", pagePath: "/home", historyId: "h1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    expect(putPageDslMock).toHaveBeenCalledTimes(1);
    const [pagePathArg, dslArg, optsArg] = putPageDslMock.mock.calls[0];
    expect(pagePathArg).toBe("/home");
    expect(dslArg).toEqual(targetSnapshot);
    // The PUT must use the page's real backend version (5), not a hardcoded 1.
    expect(optsArg).toEqual(expect.objectContaining({ version: 5 }));

    expect(saveSnapshotMock).toHaveBeenCalledTimes(1);
    const snapshotArg = saveSnapshotMock.mock.calls[0][0];
    expect(snapshotArg.operation).toBe("rollback");
    expect(snapshotArg.micrositeId).toBe("m1");
    expect(snapshotArg.pagePath).toBe("/home");
    expect(snapshotArg.patchApplied).toBeNull();

    expect(appendOpMock).toHaveBeenCalledWith(
      "u1",
      "m1",
      "/home",
      expect.objectContaining({ summary: "Rolled back", outcome: "success" }),
    );
  });
});
