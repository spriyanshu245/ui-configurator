import {
  extractTranslatableSegments,
  reassembleWithTranslations,
  isTransliterableLanguage,
  getLanguageDirection,
  extractTextFromHtml,
  preserveFtlInTranslation,
} from "./translationUtils";

jest.mock("@/app/template-designer/constants", () => ({
  TRANSLITERATION_ENABLED_LANGUAGES: new Set([
    "hi",
    "gu",
    "mr",
    "ta",
    "te",
    "bn",
    "kn",
    "pa",
  ]),
}));

describe("translationUtils", () => {
  describe("extractTranslatableSegments", () => {
    it("should extract plain text as translatable", () => {
      const result = extractTranslatableSegments("Hello World");
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe("Hello World");
      expect(result.segments[0].isTranslatable).toBe(true);
    });

    it("should mark FTL expressions as non-translatable", () => {
      const result = extractTranslatableSegments("Hello ${user.name}!");
      const ftlSegment = result.segments.find((s) => s.text === "${user.name}");
      expect(ftlSegment?.isTranslatable).toBe(false);
    });

    it("should extract text before and after FTL expressions", () => {
      const result = extractTranslatableSegments("Hello ${name}, welcome!");
      const translatableSegments = result.segments.filter(
        (s) => s.isTranslatable
      );
      expect(translatableSegments.length).toBeGreaterThan(0);
    });

    it("should handle FTL list directives", () => {
      const html = "<#list items as item>Content</#list>";
      const result = extractTranslatableSegments(html);
      const listStart = result.segments.find((s) => s.text.includes("<#list"));
      expect(listStart?.isTranslatable).toBe(false);
    });

    it("should handle FTL if directives", () => {
      const html = "<#if condition>Content</#if>";
      const result = extractTranslatableSegments(html);
      const ifStart = result.segments.find((s) => s.text.includes("<#if"));
      expect(ifStart?.isTranslatable).toBe(false);
    });

    it("should handle FTL else directive", () => {
      const html = "<#if condition>Yes<#else>No</#if>";
      const result = extractTranslatableSegments(html);
      const elseSegment = result.segments.find((s) =>
        s.text.includes("<#else>")
      );
      expect(elseSegment?.isTranslatable).toBe(false);
    });

    it("should handle FTL elseif directive", () => {
      const html = "<#if a>A<#elseif b>B</#if>";
      const result = extractTranslatableSegments(html);
      const elseifSegment = result.segments.find((s) =>
        s.text.includes("<#elseif")
      );
      expect(elseifSegment?.isTranslatable).toBe(false);
    });

    it("should handle FTL assign directive", () => {
      const html = "<#assign x = 1>Value: ${x}";
      const result = extractTranslatableSegments(html);
      const assignSegment = result.segments.find((s) =>
        s.text.includes("<#assign")
      );
      expect(assignSegment?.isTranslatable).toBe(false);
    });

    it("should mark HTML tags as non-translatable", () => {
      const html = "<p>Hello</p>";
      const result = extractTranslatableSegments(html);
      const pTag = result.segments.find((s) => s.text === "<p>");
      expect(pTag?.isTranslatable).toBe(false);
    });

    it("should handle FTL expressions with array access", () => {
      const html = "${items[0].name}";
      const result = extractTranslatableSegments(html);
      expect(result.segments[0].isTranslatable).toBe(false);
    });

    it("should create placeholder template", () => {
      const html = "Hello ${user.name}!";
      const result = extractTranslatableSegments(html);
      expect(result.template).toContain("__TRANSLATE_");
    });

    it("should handle empty text between non-translatable segments", () => {
      const html = "<p></p>";
      const result = extractTranslatableSegments(html);
      expect(result.segments.some((s) => s.isTranslatable)).toBe(false);
    });

    it("should handle text after all non-translatable content", () => {
      const html = "<div>Text at the end";
      const result = extractTranslatableSegments(html);
      const lastSegment = result.segments[result.segments.length - 1];
      expect(lastSegment.text).toBe("Text at the end");
      expect(lastSegment.isTranslatable).toBe(true);
    });

    it("should merge overlapping ranges", () => {
      const html = "${complex.expression[index]}";
      const result = extractTranslatableSegments(html);
      expect(result.segments.length).toBe(1);
      expect(result.segments[0].isTranslatable).toBe(false);
    });
  });

  describe("reassembleWithTranslations", () => {
    it("should replace original text with translations", () => {
      const original = "Hello World";
      const translations = new Map([["Hello World", "नमस्ते दुनिया"]]);
      const result = reassembleWithTranslations(original, translations);
      expect(result).toBe("नमस्ते दुनिया");
    });

    it("should handle multiple translations", () => {
      const original = "Hello from here";
      const translations = new Map([
        ["Hello", "नमस्ते"],
        ["here", "यहाँ"],
      ]);
      const result = reassembleWithTranslations(original, translations);
      expect(result).toContain("नमस्ते");
      expect(result).toContain("यहाँ");
    });

    it("should preserve non-translated content", () => {
      const original = "Hello ${name}";
      const translations = new Map([["Hello ", "नमस्ते "]]);
      const result = reassembleWithTranslations(original, translations);
      expect(result).toContain("${name}");
    });

    it("should handle empty translations map", () => {
      const original = "Hello World";
      const translations = new Map<string, string>();
      const result = reassembleWithTranslations(original, translations);
      expect(result).toBe("Hello World");
    });
  });

  describe("isTransliterableLanguage", () => {
    it("should return true for Hindi", () => {
      expect(isTransliterableLanguage("hi")).toBe(true);
    });

    it("should return true for Gujarati", () => {
      expect(isTransliterableLanguage("gu")).toBe(true);
    });

    it("should return true for Marathi", () => {
      expect(isTransliterableLanguage("mr")).toBe(true);
    });

    it("should return true for Tamil", () => {
      expect(isTransliterableLanguage("ta")).toBe(true);
    });

    it("should return true for Telugu", () => {
      expect(isTransliterableLanguage("te")).toBe(true);
    });

    it("should return true for Bengali", () => {
      expect(isTransliterableLanguage("bn")).toBe(true);
    });

    it("should return true for Kannada", () => {
      expect(isTransliterableLanguage("kn")).toBe(true);
    });

    it("should return true for Punjabi", () => {
      expect(isTransliterableLanguage("pa")).toBe(true);
    });

    it("should return false for English", () => {
      expect(isTransliterableLanguage("en")).toBe(false);
    });

    it("should return false for Spanish", () => {
      expect(isTransliterableLanguage("es")).toBe(false);
    });
  });

  describe("getLanguageDirection", () => {
    it("should return ltr for English", () => {
      expect(getLanguageDirection("en")).toBe("ltr");
    });

    it("should return ltr for Hindi", () => {
      expect(getLanguageDirection("hi")).toBe("ltr");
    });

    it("should return rtl for Arabic", () => {
      expect(getLanguageDirection("ar")).toBe("rtl");
    });

    it("should return rtl for Hebrew", () => {
      expect(getLanguageDirection("he")).toBe("rtl");
    });

    it("should return rtl for Persian", () => {
      expect(getLanguageDirection("fa")).toBe("rtl");
    });

    it("should return rtl for Urdu", () => {
      expect(getLanguageDirection("ur")).toBe("rtl");
    });

    it("should default to ltr for unknown languages", () => {
      expect(getLanguageDirection("unknown")).toBe("ltr");
    });
  });

  describe("extractTextFromHtml", () => {
    it("should extract text from simple HTML", () => {
      const result = extractTextFromHtml("<p>Hello World</p>");
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("Hello World");
    });

    it("should remove HTML tags", () => {
      const result = extractTextFromHtml("<div><p>Text</p></div>");
      expect(result[0]).not.toContain("<");
      expect(result[0]).not.toContain(">");
    });

    it("should remove FTL expressions", () => {
      const result = extractTextFromHtml("<p>Hello ${user.name}</p>");
      expect(result[0]).not.toContain("${");
    });

    it("should remove FTL list directives", () => {
      const result = extractTextFromHtml("<#list items as item>Item</#list>");
      expect(result[0]).not.toContain("<#list");
    });

    it("should remove FTL if directives", () => {
      const result = extractTextFromHtml("<#if condition>Text</#if>");
      expect(result[0]).not.toContain("<#if");
    });

    it("should handle empty HTML", () => {
      const result = extractTextFromHtml("<p></p>");
      expect(result).toHaveLength(0);
    });

    it("should handle HTML with only tags", () => {
      const result = extractTextFromHtml("<div><span></span></div>");
      expect(result).toHaveLength(0);
    });

    it("should handle mixed content", () => {
      const result = extractTextFromHtml(
        "<p>Hello <strong>World</strong> ${name}</p>"
      );
      expect(result[0]).toContain("Hello");
      expect(result[0]).toContain("World");
    });
  });

  describe("preserveFtlInTranslation", () => {
    it("should return the translated HTML as-is", () => {
      const original = "<p>Hello ${name}</p>";
      const translated = "<p>नमस्ते ${name}</p>";
      const result = preserveFtlInTranslation(original, translated);
      expect(result).toBe(translated);
    });

    it("should preserve translated content without modification", () => {
      const translated = "Translated content";
      const result = preserveFtlInTranslation("original", translated);
      expect(result).toBe("Translated content");
    });
  });
});
