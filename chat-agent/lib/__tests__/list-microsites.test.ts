/**
 * @jest-environment node
 */

// Mock the loader so we exercise the executor's list_microsites branch without
// touching next/headers or the network.
jest.mock("../microsite-loader", () => ({
  fetchMicrosites: jest.fn(),
  fetchMicrositePages: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

// Mock the DB-backed query modules the executor imports at module load, so the
// real mongodb client (module-level await in db/client) is never pulled in.
jest.mock("../../db/queries/user-preferences", () => ({ userPreferences: {} }));
jest.mock("../../db/queries/dsl-history", () => ({ dslHistory: {} }));
jest.mock("../../db/queries/temp-dsl", () => ({ tempDslOps: {} }));
jest.mock("../../db/queries/skill-entries", () => ({ skillEntries: {} }));
jest.mock("../skill-compiler", () => ({ compileAgentSkill: jest.fn() }));

import { executeTool } from "../tool-executor";
import { fetchMicrosites } from "../microsite-loader";

const mockFetchMicrosites = fetchMicrosites as jest.MockedFunction<
  typeof fetchMicrosites
>;

describe("list_microsites tool", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the real backend list on success", async () => {
    const rows = [
      { id: "loan-accounts", name: "Loan Accounts", slug: "loan-accounts", pageCount: 4 },
      { id: "cards", name: "Cards", slug: "cards", pageCount: 2 },
    ];
    mockFetchMicrosites.mockResolvedValue(rows);

    const result = await executeTool("list_microsites", {});

    expect(mockFetchMicrosites).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rows);
  });

  it("does NOT return the old hardcoded loan-accounts fallback", async () => {
    mockFetchMicrosites.mockResolvedValue([]);
    const result = await executeTool("list_microsites", {});
    // Empty is a valid answer; the point is we no longer fabricate a fake entry.
    expect(result).toEqual([]);
  });

  it("surfaces a backend failure as an error object instead of throwing", async () => {
    mockFetchMicrosites.mockRejectedValue(new Error("503 Service Unavailable"));

    const result = await executeTool("list_microsites", {});

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/503 Service Unavailable/);
  });
});
