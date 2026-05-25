import * as APIService from "@/app/services/APIService";
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  duplicateTemplate,
  updateTemplate,
  deleteTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
} from "./services";
import { TemplateListing } from "@/app/template-designer/types";

// Mock the APIService module
jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = APIService.apiRequest as jest.Mock;

describe("TemplateService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTemplates", () => {
    it("should fetch all templates and return them", async () => {
      const mockResponse: TemplateListing[] = [
        { id: "1", name: "Template 1", category: "Email", contents: [] },
      ];
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getAllTemplates();

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return an empty array if apiRequest returns null", async () => {
      // Logic coverage for: (data ?? [])
      mockApiRequest.mockResolvedValue(null);

      const result = await getAllTemplates();

      expect(result).toEqual([]);
    });
  });

  describe("getTemplate", () => {
    it("should fetch a template by id", async () => {
      const mockResponse = {
        id: "1",
        name: "T1",
        contents: [{ content: "abc" }],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await getTemplate("1");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates/1`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should transform legacy 'content' to 'contents' array if 'contents' is missing", async () => {
      // Logic coverage for: if (data.content && !data.contents)
      const legacyResponse = {
        id: "2",
        name: "Legacy",
        content: "Hello World",
      };
      mockApiRequest.mockResolvedValue(legacyResponse);

      const result = await getTemplate("2");

      expect(result.contents).toEqual([
        {
          content: "Hello World",
          language: "en",
          isDefault: true,
        },
      ]);
    });

    it("should not transform if 'contents' already exists", async () => {
      const modernResponse = {
        id: "3",
        name: "Modern",
        content: "Old Content",
        contents: [
          { content: "New Content", language: "fr", isDefault: false },
        ],
      };
      mockApiRequest.mockResolvedValue(modernResponse);

      const result = await getTemplate("3");

      // Should maintain the original contents array
      expect(result.contents?.[0].language).toBe("fr");
      expect(result.contents).toHaveLength(1);
    });
  });

  describe("createTemplate", () => {
    it("should send a POST request with payload", async () => {
      const payload: CreateTemplatePayload = {
        name: "New Template",
        category: "SMS",
        contents: [{ content: "hi", language: "en", isDefault: true }],
      };
      const mockResponse = { id: "123", ...payload };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await createTemplate(payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("duplicateTemplate", () => {
    it("should send a POST request with source template data and new name", async () => {
      const sourceTemplate: TemplateListing = {
        id: "source-123",
        name: "Original Template",
        category: "Email",
        mimeType: "text/html",
        contents: [
          { content: "Hello World", language: "en", isDefault: true },
          { content: "Hola Mundo", language: "es", isDefault: false },
        ],
      };
      const newName = "Duplicated Template";
      const mockResponse = {
        id: "new-456",
        name: newName,
        category: "Email",
        mimeType: "text/html",
        contents: sourceTemplate.contents,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await duplicateTemplate(sourceTemplate, newName);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          name: newName,
          category: "Email",
          mimeType: "text/html",
          contents: sourceTemplate.contents,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should trim the new name before sending", async () => {
      const sourceTemplate: TemplateListing = {
        id: "source-123",
        name: "Original",
        category: "SMS",
        mimeType: "text/plain",
        contents: [],
      };
      const newName = "   Trimmed Name   ";
      mockApiRequest.mockResolvedValue({ id: "new-789" });

      await duplicateTemplate(sourceTemplate, newName);

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            name: "Trimmed Name",
          }),
        }),
      );
    });

    it("should use default mimeType when source template has no mimeType", async () => {
      const sourceTemplate: TemplateListing = {
        id: "source-123",
        name: "Original",
        category: "Notification",
        contents: [],
      };
      const newName = "Duplicated";
      mockApiRequest.mockResolvedValue({ id: "new-999" });

      await duplicateTemplate(sourceTemplate, newName);

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            mimeType: "text/html",
          }),
        }),
      );
    });

    it("should use empty array for contents when source has no contents", async () => {
      const sourceTemplate: TemplateListing = {
        id: "source-123",
        name: "Original",
        category: "Report",
        mimeType: "application/json",
      };
      const newName = "Duplicated";
      mockApiRequest.mockResolvedValue({ id: "new-111" });

      await duplicateTemplate(sourceTemplate, newName);

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            contents: [],
          }),
        }),
      );
    });

    it("should preserve all contents from source template", async () => {
      const sourceTemplate: TemplateListing = {
        id: "source-456",
        name: "Multilingual Template",
        category: "Email",
        mimeType: "text/html",
        contents: [
          { content: "English content", language: "en", isDefault: true },
          { content: "Spanish content", language: "es", isDefault: false },
          { content: "French content", language: "fr", isDefault: false },
        ],
      };
      const newName = "Copy of Multilingual";
      mockApiRequest.mockResolvedValue({ id: "new-789" });

      await duplicateTemplate(sourceTemplate, newName);

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            contents: sourceTemplate.contents,
          }),
        }),
      );
    });
  });

  describe("updateTemplate", () => {
    it("should send a PUT request with updated data", async () => {
      const id = "123";
      const payload: UpdateTemplatePayload = {
        id: "123",
        name: "Updated",
        category: "General",
        contents: [],
        mimeType: "text/plain",
      };
      mockApiRequest.mockResolvedValue(payload);

      const result = await updateTemplate(id, payload);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates/${id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(result).toEqual(payload);
    });
  });

  describe("deleteTemplate", () => {
    it("should call delete endpoint", async () => {
      mockApiRequest.mockResolvedValue({});

      await deleteTemplate("456");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: `/api/v1/config/templates/456`,
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    });
  });
});
