/**
 * @jest-environment node
 */

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    toString: () => "session=abc",
  }),
}));

jest.mock("../db/queries/pending-patches", () => ({
  pendingPatchesDB: {
    get: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../db/queries/dsl-history", () => ({
  dslHistory: {
    saveSnapshot: jest.fn().mockResolvedValue("history-id-1"),
  },
  sessionOps: {
    appendOp: jest.fn().mockResolvedValue(undefined),
    saveTask: jest.fn().mockResolvedValue(undefined),
    saveMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../db/queries/sessions", () => ({
  sessionsOps: {
    appendHistoryRef: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../lib/backend-sync", () => ({
  putPageDsl: jest.fn().mockResolvedValue({ latestDsl: {} }),
}));

// Skill reflection is fire-and-forget and lives behind its own module chain
// (which ultimately reaches the real MongoDB client). Mock it at the
// boundary the route imports so this test never touches the DB layer.
jest.mock("../lib/skill-updater", () => ({
  runSkillReflection: jest.fn().mockResolvedValue(undefined),
}));

import { POST } from "../../src/app/api/patch/approve/route";
import { pendingPatchesDB } from "../db/queries/pending-patches";
import { dslHistory, sessionOps } from "../db/queries/dsl-history";
import { sessionsOps } from "../db/queries/sessions";
import { putPageDsl } from "../lib/backend-sync";
import { runSkillReflection } from "../lib/skill-updater";

const getMock = pendingPatchesDB.get as jest.Mock;
const deleteMock = pendingPatchesDB.delete as jest.Mock;
const saveSnapshotMock = dslHistory.saveSnapshot as jest.Mock;
const appendOpMock = sessionOps.appendOp as jest.Mock;
const saveTaskMock = sessionOps.saveTask as jest.Mock;
const saveMessageMock = sessionOps.saveMessage as jest.Mock;
const appendHistoryRefMock = sessionsOps.appendHistoryRef as jest.Mock;
const putPageDslMock = putPageDsl as jest.Mock;
const runSkillReflectionMock = runSkillReflection as jest.Mock;

function makeReq(body: any) {
  return new Request("https://example.test/api/patch/approve", {
    method: "POST",
    headers: { "x-user-id": "u1" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/patch/approve — integrity fix", () => {
  beforeEach(() => {
    getMock.mockReset();
    deleteMock.mockClear();
    saveSnapshotMock.mockClear();
    saveSnapshotMock.mockResolvedValue("history-id-1");
    appendOpMock.mockClear();
    saveTaskMock.mockClear();
    saveMessageMock.mockClear();
    appendHistoryRefMock.mockClear();
    putPageDslMock.mockClear();
    putPageDslMock.mockResolvedValue({ latestDsl: {} });
    runSkillReflectionMock.mockClear();
    runSkillReflectionMock.mockResolvedValue(undefined);
  });

  it("records patchApplied = pending.patch and wasEdited:false when no editedDsl is supplied", async () => {
    const currentDsl = { id: "root", type: "page", components: [{ id: "a", type: "text", properties: { value: "old" } }] };
    const originalPatch = [{ op: "replace", path: "/components/0/properties/value", value: "new" }];

    getMock.mockResolvedValue({
      id: "patch1",
      micrositeId: "m1",
      pagePath: "/home",
      patch: originalPatch,
      currentDsl,
      description: "Change text",
      sessionId: "s1",
    });

    const res = await POST(makeReq({ patchId: "patch1" }));
    expect(res.status).toBe(200);

    expect(saveSnapshotMock).toHaveBeenCalledTimes(1);
    const snapshotArg = saveSnapshotMock.mock.calls[0][0];
    expect(snapshotArg.patchApplied).toEqual(originalPatch);
    expect(snapshotArg.wasEdited).toBe(false);
  });

  it("recomputes patchApplied via jsonpatch.compare(current, edited) and sets wasEdited:true when editedDsl is hand-edited", async () => {
    const currentDsl = {
      id: "root",
      type: "page",
      components: [{ id: "a", type: "text", properties: { value: "old" } }],
    };
    const originalPatch = [
      { op: "replace", path: "/components/0/properties/value", value: "new" },
    ];
    // The user hand-edited the proposed DSL to something DIFFERENT from what the
    // original patch would have produced.
    const editedDsl = {
      id: "root",
      type: "page",
      components: [
        { id: "a", type: "text", properties: { value: "hand-edited-value" } },
      ],
    };

    getMock.mockResolvedValue({
      id: "patch2",
      micrositeId: "m1",
      pagePath: "/home",
      patch: originalPatch,
      currentDsl,
      description: "Change text",
      sessionId: "s1",
    });

    const res = await POST(makeReq({ patchId: "patch2", editedDsl }));
    expect(res.status).toBe(200);

    expect(saveSnapshotMock).toHaveBeenCalledTimes(1);
    const snapshotArg = saveSnapshotMock.mock.calls[0][0];

    // patchApplied must NOT equal the original (stale) patch...
    expect(snapshotArg.patchApplied).not.toEqual(originalPatch);
    // ...it must be the actual diff between currentDsl and the edited DSL.
    expect(snapshotArg.patchApplied).toEqual([
      { op: "replace", path: "/components/0/properties/value", value: "hand-edited-value" },
    ]);
    expect(snapshotArg.wasEdited).toBe(true);

    // putPageDsl must have been called with the edited DSL, not a re-derivation
    // of the original patch.
    expect(putPageDslMock).toHaveBeenCalledWith(
      "/home",
      editedDsl,
      expect.objectContaining({ version: 1 }),
    );
  });

  it("appends a session history ref using the id returned by saveSnapshot", async () => {
    const currentDsl = { id: "root", type: "page", components: [] };
    getMock.mockResolvedValue({
      id: "patch3",
      micrositeId: "m1",
      pagePath: "/home",
      patch: [],
      currentDsl,
      description: "No-op",
      sessionId: "s1",
    });

    await POST(makeReq({ patchId: "patch3" }));

    expect(appendHistoryRefMock).toHaveBeenCalledWith(
      "u1",
      "m1",
      expect.objectContaining({
        historyId: "history-id-1",
        patchId: "patch3",
        pagePath: "/home",
      }),
    );
  });

  it("fires skill reflection (fire-and-forget) with the pending patch's description/patch/patchedDsl/id", async () => {
    const currentDsl = { id: "root", type: "page", components: [{ id: "a", type: "text", properties: { value: "old" } }] };
    const patch = [{ op: "replace", path: "/components/0/properties/value", value: "new" }];
    const patchedDsl = { id: "root", type: "page", components: [{ id: "a", type: "text", properties: { value: "new" } }] };

    getMock.mockResolvedValue({
      id: "patch4",
      micrositeId: "m1",
      pagePath: "/home",
      patch,
      currentDsl,
      patchedDsl,
      description: "Change text",
      sessionId: "s1",
    });

    const res = await POST(makeReq({ patchId: "patch4" }));
    expect(res.status).toBe(200);

    expect(runSkillReflectionMock).toHaveBeenCalledWith({
      userRequest: "Change text",
      patchApplied: patch,
      patchedDsl,
      sourcePatchId: "patch4",
    });
  });

  it("passes a userId to putPageDsl so the backend has a user in context (bug fix)", async () => {
    // Build a Bearer JWT whose payload has preferred_username "emp-778899" and
    // NO x-user-id header, exercising the getUserId JWT-decode fallback.
    const payload = Buffer.from(
      JSON.stringify({ preferred_username: "emp-778899" }),
    ).toString("base64");
    const jwt = `header.${payload}.sig`;

    const req = new Request("https://example.test/api/patch/approve", {
      method: "POST",
      headers: { authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ patchId: "patch6" }),
    });

    getMock.mockResolvedValue({
      id: "patch6",
      micrositeId: "m1",
      pagePath: "/home",
      patch: [],
      currentDsl: { id: "root", type: "page", components: [] },
      description: "No-op",
      sessionId: "s1",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // putPageDsl must receive userId "778899" (digits of preferred_username).
    expect(putPageDslMock).toHaveBeenCalledWith(
      "/home",
      expect.anything(),
      expect.objectContaining({ userId: "778899" }),
    );
  });

  it("does not fail or block the approval response when skill reflection rejects", async () => {
    const currentDsl = { id: "root", type: "page", components: [] };
    getMock.mockResolvedValue({
      id: "patch5",
      micrositeId: "m1",
      pagePath: "/home",
      patch: [],
      currentDsl,
      description: "No-op",
      sessionId: "s1",
    });
    runSkillReflectionMock.mockRejectedValue(new Error("reflection boom"));

    const res = await POST(makeReq({ patchId: "patch5" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
