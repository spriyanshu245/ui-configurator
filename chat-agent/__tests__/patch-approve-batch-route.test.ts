/**
 * @jest-environment node
 */

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    toString: () => "session=abc",
  }),
}));

jest.mock("../db/queries/pending-batches", () => ({
  pendingBatchesDB: {
    get: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    updateOpStatus: jest.fn().mockResolvedValue(undefined),
    findApplyingForMicrosite: jest.fn().mockResolvedValue(null),
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

import { POST } from "../../src/app/api/patch/approve-batch/route";
import { pendingBatchesDB } from "../db/queries/pending-batches";
import { dslHistory, sessionOps } from "../db/queries/dsl-history";
import { sessionsOps } from "../db/queries/sessions";
import { putPageDsl } from "../lib/backend-sync";

const getMock = pendingBatchesDB.get as jest.Mock;
const deleteMock = pendingBatchesDB.delete as jest.Mock;
const updateStatusMock = pendingBatchesDB.updateStatus as jest.Mock;
const updateOpStatusMock = pendingBatchesDB.updateOpStatus as jest.Mock;
const findApplyingForMicrositeMock = pendingBatchesDB.findApplyingForMicrosite as jest.Mock;
const saveSnapshotMock = dslHistory.saveSnapshot as jest.Mock;
const appendHistoryRefMock = sessionsOps.appendHistoryRef as jest.Mock;
const putPageDslMock = putPageDsl as jest.Mock;
const saveTaskMock = sessionOps.saveTask as jest.Mock;
const saveMessageMock = sessionOps.saveMessage as jest.Mock;

function makeReq(body: any) {
  return new Request("https://example.test/api/patch/approve-batch", {
    method: "POST",
    headers: { "x-user-id": "u1" },
    body: JSON.stringify(body),
  });
}

function makeBatch(overrides: Partial<any> = {}) {
  return {
    id: "batch-1",
    sessionId: "s1",
    micrositeId: "m1",
    batchDescription: "Batch desc",
    navigateTo: "/about",
    status: "pending",
    operations: [
      {
        pagePath: "/home",
        pageVersion: 2,
        description: "Update home",
        previewHint: "hint1",
        currentDsl: { page: "home-old" },
        patchedDsl: { page: "home-new" },
        patch: [{ op: "replace", path: "/page", value: "home-new" }],
        status: "pending",
      },
      {
        pagePath: "/about",
        pageVersion: 3,
        description: "Update about",
        previewHint: "hint2",
        currentDsl: { page: "about-old" },
        patchedDsl: { page: "about-new" },
        patch: [{ op: "replace", path: "/page", value: "about-new" }],
        status: "pending",
      },
    ],
    ...overrides,
  };
}

describe("POST /api/patch/approve-batch", () => {
  beforeEach(() => {
    getMock.mockReset();
    deleteMock.mockClear();
    updateStatusMock.mockClear();
    updateOpStatusMock.mockClear();
    findApplyingForMicrositeMock.mockReset().mockResolvedValue(null);
    saveSnapshotMock.mockClear().mockResolvedValue("history-id-1");
    appendHistoryRefMock.mockClear();
    putPageDslMock.mockReset().mockResolvedValue({ latestDsl: {} });
    saveTaskMock.mockClear();
    saveMessageMock.mockClear();
  });

  it("returns 404 when the batch is missing", async () => {
    getMock.mockResolvedValue(null);

    const res = await POST(makeReq({ batchId: "missing" }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/);
  });

  it("returns 409 when another batch is already applying for the same microsite", async () => {
    getMock.mockResolvedValue(makeBatch());
    findApplyingForMicrositeMock.mockResolvedValue(makeBatch({ id: "other-batch" }));

    const res = await POST(makeReq({ batchId: "batch-1" }));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/Another batch is currently being applied/);
    expect(putPageDslMock).not.toHaveBeenCalled();
  });

  it("happy path: applies all pages, saves a snapshot per page, marks committed, and deletes the pending batch", async () => {
    const batch = makeBatch();
    getMock.mockResolvedValue(batch);

    const res = await POST(makeReq({ batchId: "batch-1", toolCallId: "tc1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.appliedPages).toEqual(["/home", "/about"]);
    expect(data.navigateTo).toBe("/about");

    expect(putPageDslMock).toHaveBeenCalledTimes(2);
    // Each page must be PUT at its OWN backend version, not a hardcoded 1.
    expect(putPageDslMock).toHaveBeenNthCalledWith(
      1,
      "/home",
      { page: "home-new" },
      expect.objectContaining({ version: 2 }),
    );
    expect(putPageDslMock).toHaveBeenNthCalledWith(
      2,
      "/about",
      { page: "about-new" },
      expect.objectContaining({ version: 3 }),
    );

    expect(saveSnapshotMock).toHaveBeenCalledTimes(2);
    expect(appendHistoryRefMock).toHaveBeenCalledTimes(2);

    expect(updateStatusMock).toHaveBeenCalledWith("batch-1", "applying");
    expect(updateStatusMock).toHaveBeenCalledWith("batch-1", "committed");
    expect(deleteMock).toHaveBeenCalledWith("batch-1");
  });

  it("forced failure on page 2: compensates by re-PUTting page 1's preImage, marks failed, keeps pending batch, and returns 500 with appliedThenRolledBack", async () => {
    const batch = makeBatch();
    getMock.mockResolvedValue(batch);

    putPageDslMock
      .mockResolvedValueOnce({ latestDsl: {} }) // page /home succeeds
      .mockRejectedValueOnce(new Error("backend rejected /about")) // page /about fails
      .mockResolvedValueOnce({ latestDsl: {} }); // compensation PUT of /home's preImage succeeds

    const res = await POST(makeReq({ batchId: "batch-1" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.appliedThenRolledBack).toEqual(["/home"]);
    expect(data.compensationErrors).toEqual([]);
    expect(data.error).toMatch(/backend rejected \/about/);

    // 2 forward attempts + 1 compensation PUT
    expect(putPageDslMock).toHaveBeenCalledTimes(3);
    const compensationCall = putPageDslMock.mock.calls[2];
    expect(compensationCall[0]).toBe("/home");
    expect(compensationCall[1]).toEqual({ page: "home-old" });

    expect(updateStatusMock).toHaveBeenCalledWith("batch-1", "applying");
    expect(updateStatusMock).toHaveBeenCalledWith("batch-1", "failed");
    expect(updateStatusMock).not.toHaveBeenCalledWith("batch-1", "committed");

    // Pending batch must NOT be deleted on failure — kept for audit.
    expect(deleteMock).not.toHaveBeenCalled();

    expect(updateOpStatusMock).toHaveBeenCalledWith("batch-1", "/home", "applied");
    expect(updateOpStatusMock).toHaveBeenCalledWith("batch-1", "/about", "failed");
    expect(updateOpStatusMock).toHaveBeenCalledWith("batch-1", "/home", "rolled_back");

    // No snapshot/history writes should happen on a failed batch.
    expect(saveSnapshotMock).not.toHaveBeenCalled();
  });

  it("compensation failure: collects compensationErrors and produces a loud error message, without aborting remaining compensations", async () => {
    const batch = makeBatch({
      operations: [
        {
          pagePath: "/home",
          pageVersion: 1,
          description: "Update home",
          previewHint: "h1",
          currentDsl: { page: "home-old" },
          patchedDsl: { page: "home-new" },
          patch: [],
          status: "pending",
        },
        {
          pagePath: "/about",
          pageVersion: 1,
          description: "Update about",
          previewHint: "h2",
          currentDsl: { page: "about-old" },
          patchedDsl: { page: "about-new" },
          patch: [],
          status: "pending",
        },
        {
          pagePath: "/contact",
          pageVersion: 1,
          description: "Update contact",
          previewHint: "h3",
          currentDsl: { page: "contact-old" },
          patchedDsl: { page: "contact-new" },
          patch: [],
          status: "pending",
        },
      ],
    });
    getMock.mockResolvedValue(batch);

    putPageDslMock
      .mockResolvedValueOnce({ latestDsl: {} }) // /home forward succeeds
      .mockResolvedValueOnce({ latestDsl: {} }) // /about forward succeeds
      .mockRejectedValueOnce(new Error("backend rejected /contact")) // /contact forward fails
      // Compensation runs in reverse: /about then /home
      .mockRejectedValueOnce(new Error("compensation failed for /about"))
      .mockResolvedValueOnce({ latestDsl: {} }); // /home compensation succeeds

    const res = await POST(makeReq({ batchId: "batch-1" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.compensationErrors).toEqual([
      { pagePath: "/about", error: "compensation failed for /about" },
    ]);
    expect(data.appliedThenRolledBack).toEqual(["/home", "/about"]);
    expect(data.error).toMatch(/Batch failed AND compensation failed on page\(s\): \/about/);
    expect(data.error).toMatch(/manual verification required/i);

    // Compensation continued to /home despite /about's compensation failing.
    expect(putPageDslMock).toHaveBeenCalledTimes(5);
    const lastCall = putPageDslMock.mock.calls[4];
    expect(lastCall[0]).toBe("/home");
    expect(lastCall[1]).toEqual({ page: "home-old" });

    expect(updateOpStatusMock).toHaveBeenCalledWith("batch-1", "/home", "rolled_back");
    expect(updateStatusMock).toHaveBeenCalledWith("batch-1", "failed");
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
