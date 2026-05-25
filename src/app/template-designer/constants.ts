import {
  TemplateGlobalStyles,
  SupportedLanguage,
  PageSizeOption,
} from "@/app/template-designer/types";

export const GRID_COLUMN_OPTIONS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { value: "mr", label: "Marathi", nativeName: "मराठी" },
  { value: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ" },
  { value: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { value: "te", label: "Telugu", nativeName: "తెలుగు" },
];

export const DEFAULT_LANGUAGE_DATA: SupportedLanguage = SUPPORTED_LANGUAGES[0];

export const getLanguageByCode = (
  code: string,
): SupportedLanguage | undefined =>
  SUPPORTED_LANGUAGES.find((lang) => lang.value === code);

export const TRANSLITERATION_ENABLED_LANGUAGES = new Set(["hi", "mr"]);

export const MIME_TYPE_OPTIONS = [
  { value: "text/html", label: "HTML" },
  { value: "text/plain", label: "Plain Text" },
];

export const HTML_CATEGORY_OPTIONS = [
  { value: "Document", label: "Document" },
  { value: "Email", label: "Email" },
  { value: "Report", label: "Report" },
];

export const TEXT_CATEGORY_OPTIONS = [
  { value: "SMS", label: "SMS" },
  { value: "Email", label: "Email" },
  { value: "Push Notification", label: "Push Notification" },
];

export const CATEGORY_OPTIONS_BY_MIME_TYPE: Record<
  string,
  { value: string; label: string }[]
> = {
  "text/html": HTML_CATEGORY_OPTIONS,
  "text/plain": TEXT_CATEGORY_OPTIONS,
};

export const FONT_FAMILY_OPTIONS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "'Courier New', monospace", label: "Courier New" },
  {
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    label: "System Default",
  },
];

export const LANGUAGE_FONT_FAMILY_MAP: Record<string, string> = {
  en: "Arial, sans-serif",
  hi: "'Noto Sans Devanagari', Verdana, sans-serif",
  mr: "'Noto Sans Devanagari', Verdana, sans-serif",
  kn: "'Noto Sans Kannada', Verdana, sans-serif",
  pa: "'Noto Sans Gurmukhi', Verdana, sans-serif",
  te: "'Noto Sans Telugu', Verdana, sans-serif",
};

export const FONT_SIZE_OPTIONS = [
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
];

export const LINE_HEIGHT_OPTIONS = [
  { value: "1.2", label: "1.2 (Tight)" },
  { value: "1.4", label: "1.4 (Compact)" },
  { value: "1.5", label: "1.5 (Normal)" },
  { value: "1.6", label: "1.6 (Relaxed)" },
  { value: "1.8", label: "1.8 (Loose)" },
];

export const PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  { value: "480", label: "Email (Narrow, 480px)" },
  { value: "600", label: "Email (Standard, 600px)" },
  { value: "700", label: "Email (Wide, 700px)" },
  { value: "794", label: "A4 Document (794px)" },
  { value: "816", label: "Letter Document (816px)" },
];

export const PAGE_SIZE_DEFAULT = PAGE_SIZE_OPTIONS[1];

export const BODY_PADDING_OPTIONS = [
  { value: "0px", label: "None (0px)" },
  { value: "8px", label: "Small (8px)" },
  { value: "16px", label: "Medium (16px)" },
  { value: "24px", label: "Large (24px)" },
  { value: "32px", label: "Extra Large (32px)" },
];

export const DEFAULT_GLOBAL_STYLES: TemplateGlobalStyles = {
  htmlTitle: "Template Title",
  preheaderText: "",
  bodyBackgroundColor: "#ffffff",
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  textColor: "#333333",
  lineHeight: "1.5",
  contentMaxWidth: PAGE_SIZE_DEFAULT,
  bodyPadding: "16px",
  linkColor: "#0066cc",
  linkHoverColor: "#004499",
};

export const DEFAULT_DATA_MODEL_JSON = `{
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "products": [
    { "id": 1, "name": "Product A", "price": 99.99 },
    { "id": 2, "name": "Product B", "price": 149.99 }
  ]
}`;

export const DEFAULT_COLUMN_WIDTHS: Record<number, number[]> = {
  1: [100],
  2: [50, 50],
  3: [40, 30, 30],
  4: [25, 25, 25, 25],
  5: [20, 20, 20, 20, 20],
  6: [20, 20, 15, 15, 15, 15],
  7: [15, 15, 15, 15, 15, 15, 10],
  8: [10, 15, 15, 10, 15, 15, 10, 10],
  9: [10, 10, 15, 10, 10, 15, 10, 10, 10],
  10: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
};
