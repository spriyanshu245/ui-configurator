import { markdownToHtml, htmlToMarkdown } from "./markdownUtils";

describe("markdownUtils", () => {
  describe("markdownToHtml", () => {
    describe("empty input", () => {
      it("should return empty string for empty input", () => {
        expect(markdownToHtml("")).toBe("");
      });

      it("should return empty string for undefined-like input", () => {
        expect(markdownToHtml("")).toBe("");
      });
    });

    describe("headers", () => {
      it("should convert h1 headers", () => {
        expect(markdownToHtml("# Title")).toBe("<h1>Title</h1>");
      });

      it("should convert h2 headers", () => {
        expect(markdownToHtml("## Subtitle")).toBe("<h2>Subtitle</h2>");
      });

      it("should convert h3 headers", () => {
        expect(markdownToHtml("### Section")).toBe("<h3>Section</h3>");
      });

      it("should convert h4 headers", () => {
        expect(markdownToHtml("#### Subsection")).toBe("<h4>Subsection</h4>");
      });

      it("should convert h5 headers", () => {
        expect(markdownToHtml("##### Small")).toBe("<h5>Small</h5>");
      });

      it("should convert h6 headers", () => {
        expect(markdownToHtml("###### Tiny")).toBe("<h6>Tiny</h6>");
      });
    });

    describe("text formatting", () => {
      it("should convert bold with double asterisks", () => {
        expect(markdownToHtml("**bold**")).toBe("<strong>bold</strong>");
      });

      it("should convert bold with double underscores", () => {
        expect(markdownToHtml("__bold__")).toBe("<strong>bold</strong>");
      });

      it("should convert italic with single asterisk", () => {
        expect(markdownToHtml("*italic*")).toBe("<em>italic</em>");
      });

      it("should convert italic with single underscore", () => {
        expect(markdownToHtml("_italic_")).toBe("<em>italic</em>");
      });

      it("should convert underline with double plus", () => {
        expect(markdownToHtml("++underline++")).toBe("<u>underline</u>");
      });

      it("should handle mixed formatting", () => {
        const result = markdownToHtml("**bold** and *italic*");
        expect(result).toContain("<strong>bold</strong>");
        expect(result).toContain("<em>italic</em>");
      });
    });

    describe("links", () => {
      it("should convert markdown links", () => {
        expect(markdownToHtml("[text](https://example.com)")).toBe(
          '<a href="https://example.com">text</a>',
        );
      });

      it("should handle links with spaces in text", () => {
        const result = markdownToHtml("[link text](https://example.com)");
        expect(result).toContain('<a href="https://example.com">link text</a>');
      });
    });

    describe("lists", () => {
      it("should convert unordered list with dash", () => {
        const markdown = "- Item 1\n- Item 2";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<ul>");
        expect(result).toContain("<li>Item 1");
        expect(result).toContain("<li>Item 2");
        expect(result).toContain("</ul>");
      });

      it("should convert unordered list with asterisk", () => {
        const markdown = "* Item 1\n* Item 2";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<ul>");
        expect(result).toContain("<li>Item 1");
        expect(result).toContain("<li>Item 2");
      });

      it("should convert ordered list", () => {
        const markdown = "1. First\n2. Second";
        const result = markdownToHtml(markdown);
        expect(result).toContain('<ol style="list-style-type: decimal">');
        expect(result).toContain("<li>First");
        expect(result).toContain("<li>Second");
        expect(result).toContain("</ol>");
      });

      it("should handle switching from ordered to unordered list", () => {
        const markdown = "1. First\n- Dash item";
        const result = markdownToHtml(markdown);
        expect(result).toContain("</ol>");
        expect(result).toContain("<ul>");
      });

      it("should handle switching from unordered to ordered list", () => {
        const markdown = "- Dash item\n1. First";
        const result = markdownToHtml(markdown);
        expect(result).toContain("</ul>");
        expect(result).toContain('<ol style="list-style-type: decimal">');
      });

      it("should handle nested unordered lists", () => {
        const markdown = "- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<ul>");
        expect(result).toContain("<li>Item 1");
        expect(result).toContain("<li>Nested 1");
        expect(result).toContain("<li>Nested 2");
        expect(result).toContain("<li>Item 2");
      });

      it("should handle nested ordered lists", () => {
        const markdown =
          "1. First\n  1. Nested first\n  2. Nested second\n2. Second";
        const result = markdownToHtml(markdown);
        expect(result).toContain('<ol style="list-style-type: decimal">');
        expect(result).toContain("<li>First");
        expect(result).toContain("<li>Nested first");
        expect(result).toContain("<li>Nested second");
        expect(result).toContain("<li>Second");
      });

      it("should handle multiple nesting levels", () => {
        const markdown =
          "- Level 1\n  - Level 2\n    - Level 3\n  - Back to 2\n- Back to 1";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<li>Level 1");
        expect(result).toContain("<li>Level 2");
        expect(result).toContain("<li>Level 3");
        expect(result).toContain("<li>Back to 2");
        expect(result).toContain("<li>Back to 1");
      });

      it("should handle list with non-list content", () => {
        const markdown = "- Item 1\n\nPlain text\n\n- Item 2";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<ul>");
        expect(result).toContain("</ul>");
        expect(result).toContain("<p>Plain text</p>");
      });
    });

    describe("paragraphs", () => {
      it("should wrap plain text in paragraph", () => {
        expect(markdownToHtml("Simple text")).toBe("<p>Simple text</p>");
      });

      it("should handle multiple paragraphs", () => {
        const markdown = "First paragraph\n\nSecond paragraph";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<p>First paragraph</p>");
        expect(result).toContain("<p>Second paragraph</p>");
      });

      it("should convert single line breaks to br", () => {
        const markdown = "Line 1\nLine 2";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<br />");
      });

      it("should not wrap existing HTML blocks", () => {
        const markdown = "<div>Already HTML</div>";
        const result = markdownToHtml(markdown);
        expect(result).toBe("<div>Already HTML</div>");
      });

      it("should filter out empty paragraphs", () => {
        const markdown = "First\n\n\n\n\n\nSecond";
        const result = markdownToHtml(markdown);
        expect(result).not.toContain("<p></p>");
        expect(result).toContain("<p>First</p>");
        expect(result).toContain("<p>Second</p>");
      });

      it("should handle whitespace-only paragraphs", () => {
        const markdown = "Text\n\n   \n\nMore text";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<p>Text</p>");
        expect(result).toContain("<p>More text</p>");
      });
    });

    describe("FTL expressions", () => {
      it("should preserve simple FTL expressions", () => {
        const markdown = "Hello ${user.name}";
        const result = markdownToHtml(markdown);
        expect(result).toContain("${user.name}");
      });

      it("should preserve FTL list directives", () => {
        const markdown = "<#list items as item>Item</#list>";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<#list items as item>");
        expect(result).toContain("</#list>");
      });

      it("should preserve FTL if directives", () => {
        const markdown = "<#if condition>Show</#if>";
        const result = markdownToHtml(markdown);
        expect(result).toContain("<#if condition>");
        expect(result).toContain("</#if>");
      });

      it("should preserve FTL expressions with array access", () => {
        const markdown = "${items[0].name}";
        const result = markdownToHtml(markdown);
        expect(result).toContain("${items[0].name}");
      });
    });

    describe("HTML blocks detection", () => {
      it("should detect h1-h6 as HTML blocks", () => {
        expect(markdownToHtml("<h1>Title</h1>")).toBe("<h1>Title</h1>");
        expect(markdownToHtml("<h6>Small</h6>")).toBe("<h6>Small</h6>");
      });

      it("should detect list elements as HTML blocks", () => {
        expect(markdownToHtml("<ul><li>Item</li></ul>")).toBe(
          "<ul><li>Item</li></ul>",
        );
        expect(markdownToHtml("<ol><li>Item</li></ol>")).toBe(
          "<ol><li>Item</li></ol>",
        );
      });

      it("should detect table elements as HTML blocks", () => {
        expect(markdownToHtml("<table><tr><td>Cell</td></tr></table>")).toBe(
          "<table><tr><td>Cell</td></tr></table>",
        );
      });

      it("should detect generic HTML-like content", () => {
        expect(markdownToHtml("<custom-element></custom-element>")).toBe(
          "<custom-element></custom-element>",
        );
      });

      it("should detect p tags as HTML blocks", () => {
        expect(markdownToHtml("<p>Already wrapped</p>")).toBe(
          "<p>Already wrapped</p>",
        );
      });

      it("should detect div tags as HTML blocks", () => {
        expect(markdownToHtml("<div>Division</div>")).toBe(
          "<div>Division</div>",
        );
      });

      it("should detect section tags as HTML blocks", () => {
        expect(markdownToHtml("<section>Content</section>")).toBe(
          "<section>Content</section>",
        );
      });
    });
  });

  describe("htmlToMarkdown", () => {
    describe("empty input", () => {
      it("should return empty string for empty input", () => {
        expect(htmlToMarkdown("")).toBe("");
      });
    });

    describe("headers", () => {
      it("should convert h1 to markdown header", () => {
        expect(htmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
      });

      it("should convert h2 to markdown header", () => {
        expect(htmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
      });

      it("should convert h3 to markdown header", () => {
        expect(htmlToMarkdown("<h3>Section</h3>")).toBe("### Section");
      });

      it("should convert h4 to markdown header", () => {
        expect(htmlToMarkdown("<h4>Subsection</h4>")).toBe("#### Subsection");
      });

      it("should convert h5 to markdown header", () => {
        expect(htmlToMarkdown("<h5>Small</h5>")).toBe("##### Small");
      });

      it("should convert h6 to markdown header", () => {
        expect(htmlToMarkdown("<h6>Tiny</h6>")).toBe("###### Tiny");
      });
    });

    describe("text formatting", () => {
      it("should convert strong to double asterisks", () => {
        expect(htmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
      });

      it("should convert b to double asterisks", () => {
        expect(htmlToMarkdown("<b>bold</b>")).toBe("**bold**");
      });

      it("should convert em to single asterisks", () => {
        expect(htmlToMarkdown("<em>italic</em>")).toBe("*italic*");
      });

      it("should convert i to single asterisks", () => {
        expect(htmlToMarkdown("<i>italic</i>")).toBe("*italic*");
      });

      it("should convert u to double plus", () => {
        expect(htmlToMarkdown("<u>underline</u>")).toBe("++underline++");
      });
    });

    describe("links", () => {
      it("should convert anchor tags to markdown links", () => {
        expect(htmlToMarkdown('<a href="https://example.com">text</a>')).toBe(
          "[text](https://example.com)",
        );
      });

      it("should handle links with single quotes", () => {
        expect(htmlToMarkdown("<a href='https://example.com'>text</a>")).toBe(
          "[text](https://example.com)",
        );
      });
    });

    describe("lists", () => {
      it("should convert unordered list to markdown", () => {
        const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- Item 1");
        expect(result).toContain("- Item 2");
      });

      it("should convert ordered list to markdown", () => {
        const html = "<ol><li>First</li><li>Second</li></ol>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("1. First");
        expect(result).toContain("2. Second");
      });

      it("should convert nested unordered lists", () => {
        const html =
          "<ul><li>Parent 1<ul><li>Child 1</li><li>Child 2</li></ul></li><li>Parent 2</li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- Parent 1");
        expect(result).toContain("  - Child 1");
        expect(result).toContain("  - Child 2");
        expect(result).toContain("- Parent 2");
      });

      it("should convert nested ordered lists", () => {
        const html =
          "<ol><li>First<ol><li>Nested 1</li><li>Nested 2</li></ol></li><li>Second</li></ol>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("1. First");
        expect(result).toContain("  1. Nested 1");
        expect(result).toContain("  2. Nested 2");
        expect(result).toContain("2. Second");
      });

      it("should handle list with attributes", () => {
        const html = '<ul class="custom"><li>Item 1</li><li>Item 2</li></ul>';
        const result = htmlToMarkdown(html);
        expect(result).toContain("- Item 1");
        expect(result).toContain("- Item 2");
      });

      it("should handle list items with extra content", () => {
        const html = "<ul><li><strong>Bold</strong> item</li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- **Bold** item");
      });

      it("should handle empty list items", () => {
        const html = "<ul><li></li><li>Item</li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("-");
        expect(result).toContain("- Item");
      });

      it("should handle deeply nested lists", () => {
        const html =
          "<ul><li>L1<ul><li>L2<ul><li>L3</li></ul></li></ul></li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- L1");
        expect(result).toContain("  - L2");
        expect(result).toContain("    - L3");
      });

      it("should handle list with case sensitivity", () => {
        const html = "<UL><LI>Item 1</LI><LI>Item 2</LI></UL>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("Item 1");
        expect(result).toContain("Item 2");
      });

      it("should handle mixed nested list types", () => {
        const html =
          "<ul><li>Unordered<ol><li>Ordered nested</li></ol></li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- Unordered");
        expect(result).toContain("  1. Ordered nested");
      });
    });

    describe("line breaks and paragraphs", () => {
      it("should convert br to newlines", () => {
        expect(htmlToMarkdown("Line 1<br>Line 2")).toContain("\n");
      });

      it("should convert self-closing br to newlines", () => {
        expect(htmlToMarkdown("Line 1<br />Line 2")).toContain("\n");
      });

      it("should convert paragraphs to text with spacing", () => {
        const html = "<p>First paragraph</p><p>Second paragraph</p>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("First paragraph");
        expect(result).toContain("Second paragraph");
      });
    });

    describe("cleanup", () => {
      it("should remove div tags", () => {
        expect(htmlToMarkdown("<div>Content</div>")).toBe("Content");
      });

      it("should remove span tags", () => {
        expect(htmlToMarkdown("<span>Content</span>")).toBe("Content");
      });

      it("should remove other HTML tags", () => {
        expect(htmlToMarkdown("<section>Content</section>")).toBe("Content");
      });

      it("should consolidate multiple newlines", () => {
        expect(htmlToMarkdown("Line 1\n\n\n\nLine 2")).toBe("Line 1\n\nLine 2");
      });
    });

    describe("FTL expressions", () => {
      it("should preserve FTL expressions", () => {
        const html = "<p>Hello ${user.name}</p>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("${user.name}");
      });

      it("should preserve FTL directives", () => {
        const html = "<#if condition><p>Show</p></#if>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("<#if condition>");
        expect(result).toContain("</#if>");
      });
    });

    describe("edge cases", () => {
      it("should handle text with unclosed list tags", () => {
        const html = "<ul><li>Item 1</li>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("Item");
      });

      it("should handle multiple lists in sequence", () => {
        const html = "<ul><li>A</li></ul><ol><li>B</li></ol>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- A");
        expect(result).toContain("1. B");
      });

      it("should handle lists with space attributes", () => {
        const html = "<ul ><li>Item</li></ul>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- Item");
      });

      it("should handle text that looks like list tag but isn't", () => {
        const html = "This is not an <ul tag but text";
        const result = htmlToMarkdown(html);
        expect(result).toContain("This is not an");
      });

      it("should handle lists with tag variations", () => {
        const html = "<ol\n><li>Item</li></ol>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("Item");
      });

      it("should handle empty HTML", () => {
        expect(htmlToMarkdown("   ")).toBe("");
      });

      it("should handle header with attributes", () => {
        const html = '<h1 class="title">Header</h1>';
        const result = htmlToMarkdown(html);
        expect(result).toContain("# Header");
      });

      it("should handle whitespace around headers", () => {
        const html = "<h2>  Spaced Title  </h2>";
        const result = htmlToMarkdown(html);
        expect(result).toContain("## Spaced Title");
      });

      it("should handle complex list nesting termination", () => {
        const html = "<ul><li>A<ul><li>B</li></ul></li></ul>X";
        const result = htmlToMarkdown(html);
        expect(result).toContain("- A");
        expect(result).toContain("  - B");
        expect(result).toContain("X");
      });
    });
  });

  describe("roundtrip", () => {
    it("should preserve meaning after markdown -> html -> markdown", () => {
      const original = "# Title\n\nSome **bold** and *italic* text.";
      const html = markdownToHtml(original);
      const backToMarkdown = htmlToMarkdown(html);
      expect(backToMarkdown).toContain("Title");
      expect(backToMarkdown).toContain("**bold**");
      expect(backToMarkdown).toContain("*italic*");
    });
  });
});
