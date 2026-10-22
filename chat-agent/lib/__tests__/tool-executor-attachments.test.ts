/**
 * @jest-environment node
 */
const readAttachment = jest.fn();
jest.mock("../attachment-store", () => ({ readAttachment: (...a: any[]) => readAttachment(...a) }));
jest.mock("../dsl-store", () => ({ loadPages: jest.fn(), getNodeIndex: jest.fn(), parseTempDslKey: jest.fn() }));
jest.mock("../../db/queries/user-preferences", () => ({ userPreferences: {} }));
jest.mock("../../db/queries/dsl-history", () => ({ dslHistory: {} }));
jest.mock("../../db/queries/temp-dsl", () => ({ tempDslOps: {} }));
jest.mock("../../db/queries/skill-entries", () => ({ skillEntries: {} }));
jest.mock("../skill-compiler", () => ({ compileAgentSkill: jest.fn() }));
jest.mock("../page-map", () => ({ buildPageMap: jest.fn() }));
jest.mock("../microsite-loader", () => ({ fetchMicrositePages: jest.fn(), fetchMicrosites: jest.fn() }));

import { executeTool } from "../tool-executor";
import { READ_ONLY_TOOLS } from "../tool-definitions";

describe("attachment tools", () => {
  it("dispatches read_attachment with the request's microsite", async () => {
    readAttachment.mockResolvedValue({ text: "x" });
    await expect(executeTool("read_attachment", { handle: "att-0123456789" }, { micrositeId: "m" })).resolves.toEqual({ text: "x" });
    expect(readAttachment).toHaveBeenCalledWith({ handle: "att-0123456789" }, "m");
  });

  it("marks read_attachment as read-only so it can run in parallel", () => {
    expect(READ_ONLY_TOOLS.has("read_attachment")).toBe(true);
  });
});
