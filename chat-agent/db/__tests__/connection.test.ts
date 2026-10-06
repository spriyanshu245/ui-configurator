/**
 * @jest-environment node
 */
const connect = jest.fn();
const command = jest.fn();
const dbFn = jest.fn();
const ctor = jest.fn();
const ensureIndexes = jest.fn();

jest.mock("mongodb", () => ({
  MongoClient: function (this: any, uri: string) {
    ctor(uri);
    this.connect = connect;
    this.db = dbFn;
  },
}));
jest.mock("../ensure-indexes", () => ({ ensureIndexes: (...a: any[]) => ensureIndexes(...a) }));
jest.mock("../../lib/logger", () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));

import { connectMongo, verifyAndIndex } from "../connection";
import { logger } from "../../lib/logger";

const fakeDb = { command };

beforeEach(() => {
  jest.clearAllMocks();
  connect.mockResolvedValue(undefined);
  command.mockResolvedValue({ ok: 1 });
  dbFn.mockReturnValue(fakeDb);
  ensureIndexes.mockResolvedValue(undefined);
});

describe("connectMongo", () => {
  it("connects once and returns the client plus the named db", async () => {
    const conn = await connectMongo("mongodb://remote:27017", "custom");

    expect(ctor).toHaveBeenCalledTimes(1);
    expect(ctor).toHaveBeenCalledWith("mongodb://remote:27017");
    expect(dbFn).toHaveBeenCalledWith("custom");
    expect(conn.db).toBe(fakeDb);
    expect(conn.client).toBeDefined();
  });

  it("retries a failed localhost URI against 127.0.0.1", async () => {
    connect.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const conn = await connectMongo("mongodb://localhost:27017", "layoutX");

    expect(ctor).toHaveBeenNthCalledWith(2, "mongodb://127.0.0.1:27017");
    expect(conn.db).toBe(fakeDb);
    expect(logger.error).toHaveBeenCalledWith("First MongoDB connection attempt failed", { error: "ECONNREFUSED" });
  });

  it("throws the fallback error when both localhost attempts fail", async () => {
    connect.mockRejectedValueOnce(new Error("first")).mockRejectedValueOnce(new Error("second"));

    await expect(connectMongo("mongodb://localhost:27017", "x")).rejects.toThrow("second");
    expect(logger.error).toHaveBeenCalledWith("MongoDB fallback connection also failed", { error: "second" });
  });

  it("rethrows immediately, without fallback, for a non-localhost URI", async () => {
    connect.mockRejectedValueOnce(new Error("auth failed"));

    await expect(connectMongo("mongodb://remote:27017", "x")).rejects.toThrow("auth failed");
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});

describe("verifyAndIndex", () => {
  it("pings then ensures indexes", async () => {
    await verifyAndIndex(fakeDb as any, "layoutX");

    expect(command).toHaveBeenCalledWith({ ping: 1 });
    expect(ensureIndexes).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("only warns when the ping fails, and still ensures indexes", async () => {
    command.mockRejectedValueOnce(new Error("ping down"));

    await verifyAndIndex(fakeDb as any, "layoutX");

    expect(logger.warn).toHaveBeenCalledWith("MongoDB ping failed", { error: "ping down" });
    expect(ensureIndexes).toHaveBeenCalledTimes(1);
  });

  it("only warns when ensuring indexes fails", async () => {
    ensureIndexes.mockRejectedValueOnce(new Error("index boom"));

    await expect(verifyAndIndex(fakeDb as any, "layoutX")).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith("Failed to ensure MongoDB indexes", { error: "index boom" });
  });
});
