import { TRANSLITERATION_ENABLED_LANGUAGES } from "@/app/template-designer/constants";

interface TextSegment {
  text: string;
  isTranslatable: boolean;
}

interface ExtractionResult {
  segments: TextSegment[];
  template: string;
}

const FTL_PATTERNS = [
  /\$\{[^}]*(?:\[[^\]]*\][^}]*)*\}/g,
  /<#list\s+[^>]+>/g,
  /<\/#list>/g,
  /<#if\s+[^>]+>/g,
  /<\/#if>/g,
  /<#else>/g,
  /<#elseif\s+[^>]+>/g,
  /<#assign\s+[^>]+>/g,
];

export const extractTranslatableSegments = (html: string): ExtractionResult => {
  const segments: TextSegment[] = [];
  let template = html;
  let placeholderIndex = 0;

  const allMatches: Array<{ match: string; index: number; length: number }> =
    [];

  for (const pattern of FTL_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      allMatches.push({
        match: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  const tagPattern = /<[^>]+>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagPattern.exec(html)) !== null) {
    const currentMatch = tagMatch;
    const isAlreadyMatched = allMatches.some(
      (m) =>
        currentMatch.index >= m.index && currentMatch.index < m.index + m.length
    );
    if (!isAlreadyMatched) {
      allMatches.push({
        match: currentMatch[0],
        index: currentMatch.index,
        length: currentMatch[0].length,
      });
    }
  }

  allMatches.sort((a, b) => a.index - b.index);

  const mergedRanges: Array<{ start: number; end: number; content: string }> =
    [];
  for (const m of allMatches) {
    const start = m.index;
    const end = m.index + m.length;
    if (
      mergedRanges.length > 0 &&
      start <= mergedRanges[mergedRanges.length - 1].end
    ) {
      const last = mergedRanges[mergedRanges.length - 1];
      last.end = Math.max(last.end, end);
      last.content = html.substring(last.start, last.end);
    } else {
      mergedRanges.push({ start, end, content: html.substring(start, end) });
    }
  }

  let currentIndex = 0;

  for (const range of mergedRanges) {
    if (range.start > currentIndex) {
      const text = html.substring(currentIndex, range.start);
      if (text.trim().length > 0) {
        const placeholder = `__TRANSLATE_${placeholderIndex}__`;
        segments.push({ text, isTranslatable: true });
        template = template.replace(text, placeholder);
        placeholderIndex++;
      }
    }

    segments.push({ text: range.content, isTranslatable: false });
    currentIndex = range.end;
  }

  if (currentIndex < html.length) {
    const text = html.substring(currentIndex);
    if (text.trim().length > 0) {
      const placeholder = `__TRANSLATE_${placeholderIndex}__`;
      segments.push({ text, isTranslatable: true });
      template = template.replace(text, placeholder);
    }
  }

  return { segments, template };
};

export const reassembleWithTranslations = (
  originalHtml: string,
  translatedSegments: Map<string, string>
): string => {
  let result = originalHtml;

  for (const [original, translated] of translatedSegments) {
    result = result.replace(original, translated);
  }

  return result;
};

export const isTransliterableLanguage = (lang: string): boolean => {
  return TRANSLITERATION_ENABLED_LANGUAGES.has(lang);
};

export const getLanguageDirection = (lang: string): "ltr" | "rtl" => {
  const rtlLanguages = new Set(["ar", "he", "fa", "ur"]);
  return rtlLanguages.has(lang) ? "rtl" : "ltr";
};

export const extractTextFromHtml = (html: string): string[] => {
  const textParts: string[] = [];
  let workingHtml = html;

  for (const pattern of FTL_PATTERNS) {
    workingHtml = workingHtml.replaceAll(pattern, " __FTL_PLACEHOLDER__ ");
  }

  workingHtml = workingHtml.replaceAll(/<[^>]+>/g, " ");

  workingHtml = workingHtml.replaceAll("__FTL_PLACEHOLDER__", " ");

  const text = workingHtml.trim();
  if (text.length > 0) {
    textParts.push(text);
  }

  return textParts;
};

export const preserveFtlInTranslation = (
  _originalHtml: string,
  translatedHtml: string
): string => {
  return translatedHtml;
};
