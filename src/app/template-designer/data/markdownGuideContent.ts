export interface GuideCodeBlock {
  label?: string;
  codes: string[];
}

export interface GuideSection {
  title: string;
  description?: string;
  codeBlocks: GuideCodeBlock[];
}

export interface GuideTip {
  text: string;
}

export const MARKDOWN_GUIDE_TIPS: GuideTip[] = [
  { text: "Preview updates in real-time as you type" },
  { text: "FTL expressions are automatically preserved" },
  { text: "Use the Style field for CSS without wrapping in tags" },
  { text: "Markdown is converted to HTML on save" },
];

export const MARKDOWN_GUIDE_SECTIONS: GuideSection[] = [
  {
    title: "Headings",
    description: "A space is required after the hash symbols.",
    codeBlocks: [
      {
        codes: [
          "# Heading 1",
          "## Heading 2",
          "### Heading 3",
          "#### Heading 4",
          "##### Heading 5",
          "###### Heading 6",
        ],
      },
    ],
  },
  {
    title: "Text Formatting",
    description: "Wrap text with symbols for emphasis:",
    codeBlocks: [
      {
        codes: [
          "**bold text**",
          "__also bold__",
          "*italic text*",
          "_also italic_",
          "++underline++",
        ],
      },
    ],
  },
  {
    title: "Links",
    description: "Create clickable links with text and URL:",
    codeBlocks: [{ codes: ["[Link Text](https://example.com)"] }],
  },
  {
    title: "Lists",
    description: "Create bullet or numbered lists:",
    codeBlocks: [
      {
        label: "Unordered:",
        codes: ["- Item one", "- Item two", "* Also works"],
      },
      {
        label: "Ordered (numeric):",
        codes: ["1. First item", "2. Second item"],
      },
      {
        label: "Ordered (lowercase alphabetical):",
        codes: ["a. First item", "b. Second item", "c. Third item"],
      },
      {
        label: "Ordered (uppercase alphabetical):",
        codes: ["A. First item", "B. Second item", "C. Third item"],
      },
      {
        label: "Nested (2 spaces per level):",
        codes: [
          "- Level 1",
          "  - Level 2",
          "    - Level 3",
          "  - Back to level 2",
          "- Back to level 1",
        ],
      },
      {
        label: "Mixed nesting (numeric with alphabetical):",
        codes: [
          "1. First item",
          "  a. Sub-item one",
          "  b. Sub-item two",
          "2. Second item",
        ],
      },
      {
        label: "Mixed nesting (alphabetical with numeric):",
        codes: [
          "a. First item",
          "  1. Sub-item one",
          "  2. Sub-item two",
          "b. Second item",
        ],
      },
    ],
  },
  {
    title: "FTL Variables",
    description: "Access data model fields with dot notation:",
    codeBlocks: [
      {
        codes: [
          "${variableName}",
          "${user.firstName}",
          "${order.items.length}",
        ],
      },
    ],
  },
  {
    title: "Default Values",
    description: "Provide fallback values when a variable is missing or null:",
    codeBlocks: [
      {
        label: "Basic default value:",
        codes: ['${name!"-"}', '${amount!"0"}', '${status!"N/A"}'],
      },
      {
        label: "Empty string default:",
        codes: ['${description!""}', "${notes!}"],
      },
      {
        label: "Nested path with default (use parentheses):",
        codes: [
          '${(user.address.city)!"-"}',
          '${(order.items[0].name)!"Unknown"}',
        ],
      },
    ],
  },
  {
    title: "Math Expressions",
    description: "Arithmetic operations with variables:",
    codeBlocks: [
      {
        codes: ["${price * quantity}", "${subtotal + tax}", "${total / count}"],
      },
    ],
  },
  {
    title: "Date & Time Formatting",
    description: "Use custom patterns for date/time formatting:",
    codeBlocks: [
      {
        codes: [
          '${date?string["yyyy-MM-dd"]}',
          '${date?string["dd/MM/yyyy"]}',
          '${time?string["HH:mm:ss"]}',
          '${datetime?string["yyyy-MM-dd HH:mm"]}',
        ],
      },
    ],
  },
  {
    title: "FTL Directives",
    description: "Control flow for loops and conditions:",
    codeBlocks: [
      {
        codes: [
          "<#list items as item>",
          "</#list>",
          "<#if condition>",
          "</#if>",
        ],
      },
    ],
  },
  {
    title: "String Built-ins",
    description: "Transform string values with built-in functions:",
    codeBlocks: [
      {
        label: "capitalize - Capitalizes first letter, lowercases rest:",
        codes: ["${name?capitalize}"],
      },
      {
        label: "lower_case - Converts entire string to lowercase:",
        codes: ["${title?lower_case}"],
      },
      {
        label: "upper_case - Converts entire string to uppercase:",
        codes: ["${code?upper_case}"],
      },
    ],
  },
  {
    title: "Inline Styles",
    description: "Use the Style field for CSS properties:",
    codeBlocks: [
      {
        codes: [
          "color: #333;",
          "font-size: 14px;",
          "text-align: center;",
          "font-weight: bold;",
        ],
      },
    ],
  },
];
