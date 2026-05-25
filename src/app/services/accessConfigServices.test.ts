import * as APIService from "./APIService";
import {
  getAllAccessConfigs,
  deleteAccessConfig,
  createAccessConfig,
  duplicateAccessConfig,
  getAccessConfig,
  updateAccessConfig,
} from "./accessConfigServices";
import { AccessConfigPage } from "../types/accessControlConfig";

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = APIService.apiRequest as jest.Mock;

describe("AccessConfigService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllAccessConfigs", () => {
    it("should fetch all access configs and return an array", async () => {
      const mockResponse = [{ accessConfigCode: "CONFIG_1" }];
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getAllAccessConfigs();

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return an empty array if apiRequest returns null/undefined", async () => {
      mockApiRequest.mockResolvedValue(null);

      const result = await getAllAccessConfigs();

      expect(result).toEqual([]);
    });
  });

  describe("deleteAccessConfig", () => {
    it("should call delete with encoded accessConfigCode", async () => {
      mockApiRequest.mockResolvedValue({});
      const code = "CONFIG/01";

      await deleteAccessConfig(code);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs/CONFIG%2F01`,
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  describe("createAccessConfig", () => {
    it("should send a POST request with the correct payload", async () => {
      const payload = {
        accessConfigCode: "NEW_CFG",
        micrositeSlug: "test-site",
        version: 1,
      };
      const mockResponse = { id: "123", ...payload };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await createAccessConfig(payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("duplicateAccessConfig", () => {
    it("should duplicate accessConfig with new code", async () => {
      const sourceAccessConfig = {
        accessConfigId: "id-1",
        accessConfigCode: "SOURCE_CFG",
        micrositeSlug: "test-site",
        version: 1,
      };
      const newCode = "DUPLICATE_CFG";
      const mockResponse = {
        accessConfigId: "id-2",
        accessConfigCode: newCode,
        micrositeSlug: "test-site",
        version: 1,
        pages: [],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await duplicateAccessConfig(sourceAccessConfig, newCode);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          accessConfigCode: newCode,
          micrositeSlug: "test-site",
          version: 1,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should preserve micrositeSlug and version from source", async () => {
      const sourceAccessConfig = {
        accessConfigId: "id-1",
        accessConfigCode: "SOURCE",
        micrositeSlug: "original-site",
        version: 5,
      };
      mockApiRequest.mockResolvedValue({});

      await duplicateAccessConfig(sourceAccessConfig, "NEW_CODE");

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            accessConfigCode: "NEW_CODE",
            micrositeSlug: "original-site",
            version: 5,
          },
        })
      );
    });
  });

  describe("getAccessConfig", () => {
    it("should fetch a specific config by code", async () => {
      const mockResponse = { accessConfigCode: "CFG_1" };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getAccessConfig("CFG_1");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs/CFG_1`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateAccessConfig", () => {
    it("should send a PUT request with the correct payload", async () => {
      const payload = {
        accessConfigId: "uuid-1",
        accessConfigCode: "UPDATED_CODE",
        micrositeSlug: "site",
        version: 2,
        pages: [] as AccessConfigPage[],
      };
      mockApiRequest.mockResolvedValue(payload);

      const result = await updateAccessConfig("OLD_CODE", payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/access-configs/OLD_CODE`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(payload);
    });
  });
});
