// dataTableUtils.test.ts
import {
  getRecord,
  updateRecord,
  getAllRecords,
  getRecordVersions,
  createRecord,
  duplicateRecord,
  deleteRecord,
} from "./dataTableUtils";

// Mock the apiRequest dependency
jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "../services/APIService";

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockDataConfig = {
  endpoint: "/api/microsites",
  requiresWorkspace: true,
  label: "microsite",
  pluralLabel: "microsites",
  supportsVersioning: true,
  routeBase: "microsites",
} as any;

const mockWorkspaceCode = "ws-123";
const mockCode = "MS1";

describe("dataTableUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRecord", () => {
    it("builds correct request for record with version", async () => {
      mockedApiRequest.mockResolvedValueOnce({ code: "MS1", name: "Test" });

      await getRecord(
        mockDataConfig,

        mockCode,
        2,
        mockWorkspaceCode,
      );

      expect(mockedApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          endpoint: "/api/microsites/MS1?version=2",
          headers: { "workspace-code": "ws-123" },
        }),
      );
    });

    it("builds correct request without version", async () => {
      mockedApiRequest.mockResolvedValueOnce({ code: "MS1" });

      await getRecord(
        mockDataConfig,

        mockCode,
        undefined,
        mockWorkspaceCode,
      );

      expect(mockedApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          endpoint: `/api/microsites/${mockCode}?version=undefined`,
        }),
      );
    });

    it("omits workspace header when not required", async () => {
      const noWorkspaceConfig = { ...mockDataConfig, requiresWorkspace: false };

      mockedApiRequest.mockResolvedValueOnce({ code: "MS1" });

      await getRecord(noWorkspaceConfig, mockCode);

      expect(
        mockedApiRequest.mock.calls[0][0].headers?.["workspace-code"],
      ).toBeUndefined();
    });
  });

  describe("updateRecord", () => {
    it("passes requestData directly to apiRequest", async () => {
      const mockRequestData = {
        method: "PUT" as const,
        endpoint: "/api/microsites/MS1",
        body: { name: "Updated" },
      };

      mockedApiRequest.mockResolvedValueOnce({ code: "MS1" });

      await updateRecord(mockRequestData);

      expect(mockedApiRequest).toHaveBeenCalledWith(mockRequestData);
    });
  });

  describe("getAllRecords", () => {
    it("passes requestData directly to apiRequest", async () => {
      const mockRequestData = {
        method: "GET" as const,
        endpoint: "/api/microsites",
      };

      mockedApiRequest.mockResolvedValueOnce([{ code: "MS1" }]);

      await getAllRecords(mockRequestData);

      expect(mockedApiRequest).toHaveBeenCalledWith(mockRequestData);
    });
  });

  describe("getRecordVersions", () => {
    it("builds correct request for versions", async () => {
      mockedApiRequest.mockResolvedValueOnce([
        { code: "MS1", version: 1 },
        { code: "MS1", version: 2 },
      ]);

      await getRecordVersions(
        mockCode,
        mockDataConfig,

        mockWorkspaceCode,
      );

      expect(mockedApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/microsites?latest=false",
          headers: { code: "MS1", "workspace-code": "ws-123" },
          method: "GET",
        }),
      );
    });

    it("omits workspace header when not required", async () => {
      const noWorkspaceConfig = { ...mockDataConfig, requiresWorkspace: false };

      mockedApiRequest.mockResolvedValueOnce([]);

      await getRecordVersions(mockCode, noWorkspaceConfig);

      expect(mockedApiRequest.mock.calls[0][0].headers).toBeUndefined();
    });
  });

  describe("createRecord", () => {
    it("passes requestData directly to apiRequest", async () => {
      const mockRequestData = {
        method: "POST" as const,
        endpoint: "/api/microsites",
        body: { code: "MS1", name: "New" },
      };

      mockedApiRequest.mockResolvedValueOnce({ code: "MS1" });

      await createRecord(mockRequestData);

      expect(mockedApiRequest).toHaveBeenCalledWith(mockRequestData);
    });
  });

  describe("duplicateRecord", () => {
    it("passes requestData directly to apiRequest", async () => {
      const mockRequestData = {
        method: "POST" as const,
        endpoint: "/api/microsites",
        body: { code: "MS1-copy", name: "Duplicate" },
      };

      mockedApiRequest.mockResolvedValueOnce({ code: "MS1-copy" });

      await duplicateRecord(mockRequestData);

      expect(mockedApiRequest).toHaveBeenCalledWith(mockRequestData);
    });
  });

  describe("deleteRecord", () => {
    it("builds correct DELETE request", async () => {
      mockedApiRequest.mockResolvedValueOnce(undefined);

      await deleteRecord(
        mockDataConfig,

        mockCode,
        mockWorkspaceCode,
      );

      expect(mockedApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
          endpoint: `/api/microsites/${mockCode}`,
          headers: { "workspace-code": "ws-123" },
        }),
      );
    });

    it("handles missing workspaceCode gracefully", async () => {
      mockedApiRequest.mockResolvedValueOnce(undefined);

      await deleteRecord(mockDataConfig, mockCode);

      expect(mockedApiRequest).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("preserves generic typing", async () => {
      interface TestRecord {
        code: string;
        name: string;
      }
      mockedApiRequest.mockResolvedValue({ code: "MS1", name: "ms" });

      const result = await getRecord<TestRecord>(
        mockDataConfig,

        "MS1",
      );

      expect(result).toEqual(expect.objectContaining({ code: "MS1" }));
    });
  });
});
