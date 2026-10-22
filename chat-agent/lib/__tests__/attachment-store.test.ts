/**
 * @jest-environment node
 */
const saveMock = jest.fn();
const getByHandleMock = jest.fn();
jest.mock("../../db/queries/chat-attachments", () => ({
  chatAttachmentsOps: {
    save: (...a: any[]) => saveMock(...a),
    getByHandle: (...a: any[]) => getByHandleMock(...a),
  },
}));
jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  __resetAttachmentCache,
  findDslRoot,
  isAttachmentHandle,
  loadAttachmentDsl,
  processAttachments,
  readAttachment,
  summarizeDsl,
} from "../attachment-store";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const PAGE = { pageCode: "p", dslJson: { components: [{ id: "a", type: "form", components: [{ id: "b", type: "input-table" }] }] } };
const scope = { userId: "u", micrositeId: "m", sessionId: "s" };

beforeEach(() => {
  jest.clearAllMocks();
  __resetAttachmentCache();
  saveMock.mockResolvedValue(undefined);
});

describe("DSL detection", () => {
  it("finds a page DSL at the top or inside dslJson/data (also as a JSON string)", () => {
    expect(findDslRoot({ components: [] })).toEqual({ components: [] });
    expect(findDslRoot(PAGE)).toBe(PAGE.dslJson);
    expect(findDslRoot({ data: { dslJson: JSON.stringify({ components: [1] }) } })).toEqual({ components: [1] });
    expect(findDslRoot({ foo: 1 })).toBeUndefined();
    expect(summarizeDsl(PAGE.dslJson)).toBe("page DSL JSON, 2 components (1 form, 1 input-table)");
  });

  it("recognises handles", () => {
    expect(isAttachmentHandle("att-0123456789")).toBe(true);
    expect(isAttachmentHandle("loan_page")).toBe(false);
  });
});

describe("processAttachments", () => {
  it("stores a page-DSL JSON and replaces it with a pointer to its handle (not inlined)", async () => {
    const { parts, refs } = await processAttachments(
      [{ kind: "document", format: "txt", name: "dev-page.json", dataBase64: b64(JSON.stringify(PAGE)) }],
      scope,
    );
    expect(refs).toEqual([{ handle: expect.stringMatching(/^att-[0-9a-f]{10}$/), name: "dev-page.json", kind: "page DSL" }]);
    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    expect(parts[0].text).toContain(`page_path "${refs[0].handle}"`);
    expect(JSON.stringify(parts)).not.toContain("dataBase64");
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ handle: refs[0].handle, kind: "dsl", userId: "u", sessionId: "s", text: JSON.stringify(PAGE) }),
    );
    // Cached: loading it does not hit Mongo.
    expect(await loadAttachmentDsl(refs[0].handle)).toEqual(PAGE.dslJson);
    expect(getByHandleMock).not.toHaveBeenCalled();
  });

  it("gives the same file the same handle for the same user/microsite, a different one elsewhere", async () => {
    const file = { kind: "document", format: "txt", name: "a.txt", dataBase64: b64("hello") };
    const a = await processAttachments([file], scope);
    const b = await processAttachments([file], scope);
    const c = await processAttachments([file], { ...scope, userId: "other" });
    expect(a.refs[0].handle).toBe(b.refs[0].handle);
    expect(c.refs[0].handle).not.toBe(a.refs[0].handle);
  });

  it("keeps images and other documents inline, plus a line naming their handle", async () => {
    const { parts, refs } = await processAttachments(
      [{ kind: "image", format: "png", name: "wire.png", dataBase64: b64("png") }],
      scope,
    );
    expect(parts[0]).toEqual({ type: "image", format: "png", dataBase64: b64("png") });
    expect(parts[1].text).toContain(`read_attachment("${refs[0].handle}")`);
    expect(saveMock.mock.calls[0][0]).toMatchObject({ kind: "image", dataBase64: b64("png") });
  });

  it("falls back to inline when storing fails", async () => {
    saveMock.mockRejectedValue(new Error("mongo down"));
    const { parts, refs } = await processAttachments(
      [{ kind: "document", format: "txt", name: "dev.json", dataBase64: b64(JSON.stringify(PAGE)) }],
      scope,
    );
    expect(refs).toEqual([]);
    expect(parts).toEqual([{ type: "document", format: "txt", name: "dev.json", dataBase64: expect.any(String) }]);
  });
});

describe("loadAttachmentDsl / readAttachment", () => {
  it("loads a stored DSL from Mongo once, then from memory", async () => {
    getByHandleMock.mockResolvedValue({ handle: "att-0000000001", text: JSON.stringify(PAGE), kind: "dsl" });
    expect(await loadAttachmentDsl("att-0000000001", "m")).toEqual(PAGE.dslJson);
    expect(await loadAttachmentDsl("att-0000000001", "m")).toEqual(PAGE.dslJson);
    expect(getByHandleMock).toHaveBeenCalledTimes(1);
    expect(getByHandleMock).toHaveBeenCalledWith("att-0000000001", "m");
  });

  it("pages text, points DSLs at the DSL tools and explains binary files", async () => {
    const text = "x".repeat(60_000);
    getByHandleMock.mockResolvedValueOnce({ handle: "att-0000000002", name: "log.txt", kind: "text", text });
    const first: any = await readAttachment({ handle: "att-0000000002" });
    expect(first.text).toHaveLength(50_000);
    expect(first.nextOffset).toBe(50_000);

    getByHandleMock.mockResolvedValueOnce({ handle: "att-0000000002", name: "log.txt", kind: "text", text });
    const second: any = await readAttachment({ handle: "att-0000000002", offset: 50_000 });
    expect(second.text).toHaveLength(10_000);
    expect(second.nextOffset).toBeUndefined();

    getByHandleMock.mockResolvedValueOnce({ handle: "att-0000000003", name: "p.json", kind: "dsl", text: "{}" });
    expect((await readAttachment({ handle: "att-0000000003" })).note).toContain("get_page_dsl");

    getByHandleMock.mockResolvedValueOnce({ handle: "att-0000000004", name: "w.png", kind: "image", dataBase64: "x" });
    expect((await readAttachment({ handle: "att-0000000004" })).note).toContain("re-attach");

    getByHandleMock.mockResolvedValueOnce(null);
    expect((await readAttachment({ handle: "att-0000000005" })).error).toContain("not found");
    expect((await readAttachment({ handle: "nope" })).error).toContain("Provide a handle");
  });
});
