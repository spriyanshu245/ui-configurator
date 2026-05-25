import * as APIService from "./APIService";
import {
  createPortalTaskConfig,
  deletePortalTaskConfig,
  duplicatePortalTaskConfig,
  getAllPortalTaskConfigs,
  getPortalTaskConfig,
  updatePortalTaskConfig,
} from "./portalTaskServices";
import { AccessConfigPage } from "../types/accessControlConfig";

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = APIService.apiRequest as jest.Mock;

describe("AccessConfigService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllportalTaskConfigs", () => {
    it("should fetch all access configs and return an array", async () => {
      const mockResponse = [{ portalTaskConfigCode: "CONFIG_1" }];
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getAllPortalTaskConfigs();

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return an empty array if apiRequest returns null/undefined", async () => {
      mockApiRequest.mockResolvedValue(null);

      const result = await getAllPortalTaskConfigs();

      expect(result).toEqual([]);
    });
  });

  describe("deleteAccessConfig", () => {
    it("should call delete with encoded portalTaskConfigCode", async () => {
      mockApiRequest.mockResolvedValue({});
      const code = "CONFIG/01";

      await deletePortalTaskConfig(code);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs/CONFIG%2F01`,
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  describe("createAccessConfig", () => {
    it("should send a POST request with the correct payload", async () => {
      const payload = {
        portalTaskConfigCode: "NEW_CFG",
        micrositeSlug: "test-site",
        version: 1,
      };
      const mockResponse = { id: "123", ...payload };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await createPortalTaskConfig(payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("duplicateportalTaskConfig", () => {
    it("should duplicate accessConfig with new code", async () => {
      const sourceAccessConfig = {
        portalTaskConfigCodeId: "id-1",
        portalTaskConfigCode: "SOURCE_CFG",
        micrositeSlug: "test-site",
        version: 1,
      };
      const newCode = "DUPLICATE_CFG";
      const mockResponse = {
        portalTaskConfigCodeId: "id-2",
        portalTaskConfigCode: newCode,
        micrositeSlug: "test-site",
        version: 1,
        pages: [],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await duplicatePortalTaskConfig(
        sourceAccessConfig,
        newCode
      );

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          portalTaskConfigCode: newCode,
          micrositeSlug: "test-site",
          version: 1,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should preserve micrositeSlug and version from source", async () => {
      const sourceAccessConfig = {
        portalTaskConfigCodeId: "id-1",
        portalTaskConfigCode: "SOURCE",
        micrositeSlug: "original-site",
        version: 5,
      };
      mockApiRequest.mockResolvedValue({});

      await duplicatePortalTaskConfig(sourceAccessConfig, "NEW_CODE");

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            portalTaskConfigCode: "NEW_CODE",
            micrositeSlug: "original-site",
            version: 5,
          },
        })
      );
    });
  });

  describe("getportalTaskConfig", () => {
    it("should fetch a specific config by code", async () => {
      const mockResponse = { portalTaskConfigCode: "CFG_1" };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getPortalTaskConfig("CFG_1");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs/CFG_1`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateportalTaskConfig", () => {
    it("should send a PUT request with the correct payload", async () => {
      const payload = {
        portalTaskConfigCodeId: "uuid-1",
        portalTaskConfigCode: "UPDATED_CODE",
        micrositeSlug: "site",
        version: 2,
        pages: [] as AccessConfigPage[],
      };
      mockApiRequest.mockResolvedValue(payload);

      const result = await updatePortalTaskConfig("OLD_CODE", payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/portal-task-configs/OLD_CODE`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(payload);
    });
  });

 
});
