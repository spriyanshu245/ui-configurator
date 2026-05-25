import { TemplateBlock, TableColumn } from "@/app/template-designer/types";

interface TranslateApiResponse {
  translatedText?: string;
  translatedTexts?: string[];
}

interface TransliterateApiResponse {
  suggestions: string[];
}

const isOnlyFreemarkerExpression = (text: string): boolean => {
  const freemarkerPattern = /\$\{[^}]+\}/g;
  const textWithoutFreemarker = text.replaceAll(freemarkerPattern, "").trim();
  return textWithoutFreemarker === "";
};

const shouldSkipTranslation = (text: string): boolean => {
  if (!text.trim()) {
    return true;
  }
  return isOnlyFreemarkerExpression(text);
};

const protectFreemarkerVariables = (
  text: string,
): { protectedText: string; variables: string[] } => {
  const freemarkerPattern = /\$\{[^}]+\}/g;
  const variables: string[] = [];
  const protectedText = text.replaceAll(freemarkerPattern, (match) => {
    const index = variables.length;
    variables.push(match);
    return `<span translate="no" data-var="${index}">${match}</span>`;
  });
  return { protectedText, variables };
};

const restoreFreemarkerVariables = (
  text: string,
  variables: string[],
): string => {
  let restoredText = text;
  variables.forEach((variable, index) => {
    const pattern = new RegExp(
      `<span[^>]*translate="no"[^>]*data-var="${index}"[^>]*>[^<]*</span>`,
      "g",
    );
    restoredText = restoredText.replace(pattern, variable);
  });
  return restoredText;
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  if (shouldSkipTranslation(text)) {
    return text;
  }

  const { protectedText, variables } = protectFreemarkerVariables(text);

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: protectedText,
      sourceLang,
      targetLang,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error: string };
    throw new Error(errorData.error ?? "Translation failed");
  }

  const data = (await response.json()) as TranslateApiResponse;
  const translatedText = data.translatedText ?? protectedText;
  return restoreFreemarkerVariables(translatedText, variables);
};

export const getTransliterationSuggestions = async (
  text: string,
  targetLang: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  if (!text.trim()) {
    return [];
  }

  const response = await fetch("/api/transliterate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      targetLang,
    }),
    signal,
  });

  if (!response.ok) {
    return [text];
  }

  const data = (await response.json()) as TransliterateApiResponse;
  return data.suggestions;
};

const translateTextsBatch = async (
  texts: string[],
  sourceLang: string,
  targetLang: string,
): Promise<string[]> => {
  if (texts.length === 0) {
    return [];
  }

  const protectionData = texts.map((text) => protectFreemarkerVariables(text));
  const protectedTexts = protectionData.map((data) => data.protectedText);

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts: protectedTexts,
      sourceLang,
      targetLang,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error: string };
    throw new Error(errorData.error ?? "Translation failed");
  }

  const data = (await response.json()) as TranslateApiResponse;
  const translatedTexts = data.translatedTexts ?? protectedTexts;

  return translatedTexts.map((translatedText, index) =>
    restoreFreemarkerVariables(translatedText, protectionData[index].variables),
  );
};

type TextLocation = {
  blockId: string;
  path: string;
  index?: number;
  columnIndex?: number;
};

const addTextLocation = (
  textMap: Map<string, TextLocation[]>,
  text: string,
  location: TextLocation,
): void => {
  if (shouldSkipTranslation(text)) return;
  const locations = textMap.get(text) ?? [];
  locations.push(location);
  textMap.set(text, locations);
};

const collectRichTextContent = (
  block: TemplateBlock,
  textMap: Map<string, TextLocation[]>,
): void => {
  if (block.type === "richText" && block.content) {
    addTextLocation(textMap, block.content, {
      blockId: block.id,
      path: "content",
    });
  }
};

const collectSectionTitle = (
  block: TemplateBlock,
  textMap: Map<string, TextLocation[]>,
): void => {
  if (block.type === "section" && block.properties.title) {
    const title = block.properties.title;
    if (typeof title === "string") {
      addTextLocation(textMap, title, {
        blockId: block.id,
        path: "properties.title",
      });
    }
  }
};

const collectTableColumnLabels = (
  block: TemplateBlock,
  textMap: Map<string, TextLocation[]>,
): void => {
  if (block.type === "table" && block.properties.columns) {
    const columns = block.properties.columns as TableColumn[];
    columns.forEach((col, colIndex) => {
      addTextLocation(textMap, col.label, {
        blockId: block.id,
        path: "properties.columns",
        columnIndex: colIndex,
      });
    });
  }
};

const collectGridRowContents = (
  block: TemplateBlock,
  textMap: Map<string, TextLocation[]>,
): void => {
  if (block.type === "gridRow" && block.properties.columnContents) {
    const columnContents = block.properties.columnContents as string[];
    columnContents.forEach((content, index) => {
      addTextLocation(textMap, content, {
        blockId: block.id,
        path: "properties.columnContents",
        index,
      });
    });
  }
};

const collectTextsFromBlocks = (
  blocks: TemplateBlock[],
  textMap: Map<string, TextLocation[]>,
): void => {
  for (const block of blocks) {
    collectRichTextContent(block, textMap);
    collectSectionTitle(block, textMap);
    collectTableColumnLabels(block, textMap);
    collectGridRowContents(block, textMap);

    if (block.children && block.children.length > 0) {
      collectTextsFromBlocks(block.children, textMap);
    }
  }
};

const applyRichTextTranslation = (
  block: TemplateBlock,
  translationMap: Map<string, string>,
): TemplateBlock => {
  if (block.type !== "richText" || !block.content) return block;
  const translated = translationMap.get(block.content);
  return translated ? { ...block, content: translated } : block;
};

const applySectionTitleTranslation = (
  block: TemplateBlock,
  translationMap: Map<string, string>,
): TemplateBlock => {
  if (block.type !== "section" || !block.properties.title) return block;
  const title = block.properties.title;
  if (typeof title !== "string") return block;
  const translated = translationMap.get(title);
  if (!translated) return block;
  return { ...block, properties: { ...block.properties, title: translated } };
};

const applyTableColumnsTranslation = (
  block: TemplateBlock,
  translationMap: Map<string, string>,
): TemplateBlock => {
  if (block.type !== "table" || !block.properties.columns) return block;
  const columns = block.properties.columns as TableColumn[];
  const translatedColumns = columns.map((col) => {
    const translated = translationMap.get(col.label);
    return translated ? { ...col, label: translated } : col;
  });
  return {
    ...block,
    properties: { ...block.properties, columns: translatedColumns },
  };
};

const applyGridRowTranslation = (
  block: TemplateBlock,
  translationMap: Map<string, string>,
): TemplateBlock => {
  if (block.type !== "gridRow" || !block.properties.columnContents)
    return block;
  const columnContents = block.properties.columnContents as string[];
  const translatedContents = columnContents.map((content) => {
    const translated = translationMap.get(content);
    return translated ?? content;
  });
  return {
    ...block,
    properties: { ...block.properties, columnContents: translatedContents },
  };
};

const applyTranslationsToBlocks = (
  blocks: TemplateBlock[],
  translationMap: Map<string, string>,
): TemplateBlock[] => {
  return blocks.map((block) => {
    let translatedBlock = { ...block };
    translatedBlock = applyRichTextTranslation(translatedBlock, translationMap);
    translatedBlock = applySectionTitleTranslation(
      translatedBlock,
      translationMap,
    );
    translatedBlock = applyTableColumnsTranslation(
      translatedBlock,
      translationMap,
    );
    translatedBlock = applyGridRowTranslation(translatedBlock, translationMap);

    if (block.children && block.children.length > 0) {
      translatedBlock.children = applyTranslationsToBlocks(
        block.children,
        translationMap,
      );
    }

    return translatedBlock;
  });
};

export const translateBlocks = async (
  blocks: TemplateBlock[],
  sourceLang: string,
  targetLang: string,
): Promise<TemplateBlock[]> => {
  const textMap = new Map<string, TextLocation[]>();
  collectTextsFromBlocks(blocks, textMap);

  const uniqueTexts = Array.from(textMap.keys());

  if (uniqueTexts.length === 0) {
    return structuredClone(blocks);
  }

  const translatedTexts = await translateTextsBatch(
    uniqueTexts,
    sourceLang,
    targetLang,
  );

  const translationMap = new Map<string, string>();
  uniqueTexts.forEach((text, index) => {
    translationMap.set(text, translatedTexts[index]);
  });

  return applyTranslationsToBlocks(structuredClone(blocks), translationMap);
};

export const deepCloneBlocks = (blocks: TemplateBlock[]): TemplateBlock[] => {
  return structuredClone(blocks);
};
