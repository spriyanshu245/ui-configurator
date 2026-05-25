import {
  translateText,
  getTransliterationSuggestions,
  translateBlocks,
  deepCloneBlocks,
} from "./translationService";
import { TemplateBlock, TableColumn } from "../types";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

if (globalThis.structuredClone === undefined) {
  globalThis.structuredClone = <T>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));
}

describe("translationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("translateText", () => {
    it("should return original text when text is empty", async () => {
      const result = await translateText("", "en", "hi");
      expect(result).toBe("");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return original text when text is whitespace only", async () => {
      const result = await translateText("   ", "en", "hi");
      expect(result).toBe("   ");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call fetch with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedText: "नमस्ते" }),
      });

      await translateText("Hello", "en", "hi");

      expect(mockFetch).toHaveBeenCalledWith("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Hello",
          sourceLang: "en",
          targetLang: "hi",
        }),
      });
    });

    it("should return translated text on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedText: "नमस्ते" }),
      });

      const result = await translateText("Hello", "en", "hi");
      expect(result).toBe("नमस्ते");
    });

    it("should throw error with message when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Translation service unavailable" }),
      });

      await expect(translateText("Hello", "en", "hi")).rejects.toThrow(
        "Translation service unavailable",
      );
    });

    it("should throw default error when no error message in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(translateText("Hello", "en", "hi")).rejects.toThrow(
        "Translation failed",
      );
    });

    it("should return original text when text contains only Freemarker expressions", async () => {
      const result = await translateText("${variable}", "en", "hi");
      expect(result).toBe("${variable}");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should protect and restore Freemarker variables during translation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          translatedText:
            'नमस्ते <span translate="no" data-var="0">${userName}</span>',
        }),
      });

      const result = await translateText("Hello ${userName}", "en", "hi");
      expect(result).toBe("नमस्ते ${userName}");
    });

    it("should protect multiple Freemarker variables", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          translatedText:
            '<span translate="no" data-var="0">${greeting}</span> <span translate="no" data-var="1">${name}</span>',
        }),
      });

      const result = await translateText("${greeting} ${name}", "en", "hi");
      expect(result).toBe("${greeting} ${name}");
    });
  });

  describe("getTransliterationSuggestions", () => {
    it("should return empty array when text is empty", async () => {
      const result = await getTransliterationSuggestions("", "hi");
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return empty array when text is whitespace only", async () => {
      const result = await getTransliterationSuggestions("   ", "hi");
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call fetch with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: ["नमस्ते"] }),
      });

      await getTransliterationSuggestions("namaste", "hi");

      expect(mockFetch).toHaveBeenCalledWith("/api/transliterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "namaste",
          targetLang: "hi",
        }),
        signal: undefined,
      });
    });

    it("should pass abort signal when provided", async () => {
      const controller = new AbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: ["नमस्ते"] }),
      });

      await getTransliterationSuggestions("namaste", "hi", controller.signal);

      expect(mockFetch).toHaveBeenCalledWith("/api/transliterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "namaste",
          targetLang: "hi",
        }),
        signal: controller.signal,
      });
    });

    it("should return suggestions on success", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestions: ["नमस्ते", "नमस्कार", "नमन"],
        }),
      });

      const result = await getTransliterationSuggestions("namaste", "hi");
      expect(result).toEqual(["नमस्ते", "नमस्कार", "नमन"]);
    });

    it("should return original text array when response is not ok", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: false,
      });

      const result = await getTransliterationSuggestions("namaste", "hi");
      expect(result).toEqual(["namaste"]);
    });
  });

  describe("translateBlocks batch translation", () => {
    it("should translate richText block content", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["नमस्ते दुनिया"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Hello World",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].content).toBe("नमस्ते दुनिया");
    });

    it("should translate section title property", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["शीर्षक"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: "Title",
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].properties.title).toBe("शीर्षक");
    });

    it("should not translate section when title is not string", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: 123,
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].properties.title).toBe(123);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should translate table column labels", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["नाम", "उम्र"] }),
      });

      const columns: TableColumn[] = [
        { id: "1", label: "Name", dataKey: "name", alignment: "L" },
        { id: "2", label: "Age", dataKey: "age", alignment: "L" },
      ];

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            columns: columns,
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      const resultColumns = result[0].properties.columns as TableColumn[];
      expect(resultColumns[0].label).toBe("नाम");
      expect(resultColumns[1].label).toBe("उम्र");
    });

    it("should translate gridRow column contents", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["पहला", "दूसरा"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "gridRow",
          label: "Grid Row",
          content: "",
          properties: {
            columnContents: ["First", "Second"],
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      const contents = result[0].properties.columnContents as string[];
      expect(contents[0]).toBe("पहला");
      expect(contents[1]).toBe("दूसरा");
    });

    it("should recursively translate children", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["माता-पिता", "बच्चा"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Parent",
          properties: {},
          children: [
            {
              id: "2",
              type: "richText",
              label: "Rich Text",
              content: "Child",
              properties: {},
            },
          ],
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].content).toBe("माता-पिता");
      expect(result[0].children?.[0].content).toBe("बच्चा");
    });

    it("should not translate non-richText block content", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "divider",
          label: "Divider",
          content: "---",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].content).toBe("---");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should preserve block id and type", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["अनुवादित"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "unique-id",
          type: "richText",
          label: "Rich Text",
          content: "Translated",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].id).toBe("unique-id");
      expect(result[0].type).toBe("richText");
    });

    it("should handle block without children", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "divider",
          label: "Divider",
          content: "",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].children).toBeUndefined();
    });

    it("should handle block with empty children array", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {},
          children: [],
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result[0].children).toEqual([]);
    });
  });

  describe("translateBlocks multiple blocks", () => {
    it("should translate multiple blocks in single batch call", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["पहला", "दूसरा"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "First",
          properties: {},
        },
        {
          id: "2",
          type: "richText",
          label: "Rich Text",
          content: "Second",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("पहला");
      expect(result[1].content).toBe("दूसरा");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return empty array for empty input", async () => {
      const result = await translateBlocks([], "en", "hi");

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("deepCloneBlocks", () => {
    it("should create deep copy of blocks", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Test",
          properties: { color: "#000000" },
        },
      ];

      const cloned = deepCloneBlocks(blocks);

      expect(cloned).toEqual(blocks);
      expect(cloned).not.toBe(blocks);
      expect(cloned[0]).not.toBe(blocks[0]);
      expect(cloned[0].properties).not.toBe(blocks[0].properties);
    });

    it("should clone nested children", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {},
          children: [
            {
              id: "2",
              type: "richText",
              label: "Rich Text",
              content: "Child",
              properties: {},
            },
          ],
        },
      ];

      const cloned = deepCloneBlocks(blocks);

      expect(cloned[0].children).toEqual(blocks[0].children);
      expect(cloned[0].children).not.toBe(blocks[0].children);
      expect(cloned[0].children?.[0]).not.toBe(blocks[0].children?.[0]);
    });

    it("should handle empty array", () => {
      const result = deepCloneBlocks([]);
      expect(result).toEqual([]);
    });
  });

  describe("translateTextsBatch edge cases", () => {
    it("should return empty array when input is empty", async () => {
      const result = await translateBlocks([], "en", "hi");
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error when batch translation API fails", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Batch translation service unavailable" }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Hello World",
          properties: {},
        },
      ];

      await expect(translateBlocks(blocks, "en", "hi")).rejects.toThrow(
        "Batch translation service unavailable",
      );
    });

    it("should throw default error when batch translation fails without error message", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Test",
          properties: {},
        },
      ];

      await expect(translateBlocks(blocks, "en", "hi")).rejects.toThrow(
        "Translation failed",
      );
    });

    it("should handle Freemarker expressions in batch translation", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          translatedTexts: [
            '<span translate="no" data-var="0">${userName}</span> नमस्ते',
          ],
        }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "${userName} Hello",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].content).toBe("${userName} नमस्ते");
    });

    it("should not translate section title when it has no translation in map", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["Translated Title"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: "Translated Title",
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].properties.title).toBe("Translated Title");
    });

    it("should handle blocks with only skippable text", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "   ",
          properties: {},
        },
        {
          id: "2",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: "${variable}",
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].content).toBe("   ");
      expect(result[1].properties.title).toBe("${variable}");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle section with non-string title in translation process", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: null,
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].properties.title).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle when API returns fewer translations than requested", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: [] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Hello",
          properties: {},
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].content).toBe("Hello");
    });

    it("should handle mixed content with some skippable text", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedTexts: ["नमस्ते"] }),
      });

      const blocks: TemplateBlock[] = [
        {
          id: "1",
          type: "richText",
          label: "Rich Text",
          content: "Hello",
          properties: {},
        },
        {
          id: "2",
          type: "richText",
          label: "Rich Text",
          content: "   ",
          properties: {},
        },
        {
          id: "3",
          type: "section",
          label: "Section",
          content: "",
          properties: {
            title: "${variable}",
          },
        },
      ];

      const result = await translateBlocks(blocks, "en", "hi");
      expect(result[0].content).toBe("नमस्ते");
      expect(result[1].content).toBe("   ");
      expect(result[2].properties.title).toBe("${variable}");
    });
  });
});
