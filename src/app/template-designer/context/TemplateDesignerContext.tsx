"use client";
import { createContext, useContext, useCallback, useMemo } from "react";
import {
  TemplateDesignerContextProps,
  TemplateDesignerProviderProps,
  TemplateContent,
} from "@/app/template-designer/types";
import {
  parseFtlToBlocks,
  parseGlobalStylesFromHtml,
} from "@/app/template-designer/utils/ftlParser";
import {
  generateStructureFromBlocks,
  parseHtmlToStructure,
} from "@/app/template-designer/utils/structureUtils";
import { useBlockOperations } from "@/app/template-designer/hooks/useBlockOperations";
import { useLanguageManagement } from "@/app/template-designer/hooks/useLanguageManagement";
import { useTemplateState } from "@/app/template-designer/hooks/useTemplateState";

const TemplateDesignerContext =
  createContext<TemplateDesignerContextProps | null>(null);

export const useTemplateDesigner = () => {
  const context = useContext(TemplateDesignerContext);
  if (!context) {
    throw new Error(
      "useTemplateDesigner must be used within TemplateDesignerProvider",
    );
  }
  return context;
};

export const TemplateDesignerProvider = ({
  children,
  initialState,
  initialContent = "",
  initialLoading = false,
  initialError = null,
}: TemplateDesignerProviderProps) => {
  const {
    blocks,
    selectedBlockId,
    expandedNodes,
    setBlocks,
    selectBlock,
    addBlock,
    updateBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    toggleStructureNode,
  } = useBlockOperations({
    initialBlocks: initialState?.blocks ?? [],
    initialSelectedBlockId: initialState?.selectedBlockId ?? null,
  });

  const {
    content,
    name,
    mimeType,
    category,
    templateGlobalStyles,
    modelJson,
    isLoading,
    error,
    isMarkdownGuideOpen,
    setContent,
    setName,
    setMimeType,
    setCategory,
    setGlobalStyles,
    setTemplateGlobalStyles,
    setModelJson,
    setLoadingState,
    setError,
    setIsMarkdownGuideOpen,
  } = useTemplateState({
    initialContent,
    initialLoading,
    initialError,
  });

  const {
    currentLanguage,
    defaultLanguage,
    availableLanguages,
    isTranslating,
    isCurrentLanguageDefault,
    switchLanguage,
    updateDefaultLanguage,
    addLanguage,
    removeLanguage,
    getLanguageBlocks,
    saveCurrentLanguageBlocks,
    loadLanguageContents,
  } = useLanguageManagement({
    blocks,
    setBlocks,
    setError,
  });

  const structure = useMemo(
    () => generateStructureFromBlocks(blocks, expandedNodes),
    [blocks, expandedNodes],
  );

  const htmlStructure = useMemo(
    () => parseHtmlToStructure(content, expandedNodes),
    [content, expandedNodes],
  );

  const loadBlocksFromFtl = useCallback(
    (ftlContent: string) => {
      const parsedBlocks = parseFtlToBlocks(ftlContent);
      setBlocks(parsedBlocks);
      setContent("");

      const parsedStyles = parseGlobalStylesFromHtml(ftlContent);
      if (Object.keys(parsedStyles).length > 0) {
        setTemplateGlobalStyles((prev) => ({ ...prev, ...parsedStyles }));
      }
    },
    [setBlocks, setContent, setTemplateGlobalStyles],
  );

  const loadBlocksFromContents = useCallback(
    (contents: TemplateContent[]) => {
      const initialBlocks = loadLanguageContents(contents, parseFtlToBlocks);
      setBlocks(initialBlocks);
      setContent("");

      const defaultContent = contents.find((c) => c.isDefault);
      if (defaultContent) {
        const parsedStyles = parseGlobalStylesFromHtml(defaultContent.content);
        if (Object.keys(parsedStyles).length > 0) {
          setTemplateGlobalStyles((prev) => ({ ...prev, ...parsedStyles }));
        }
      }
    },
    [loadLanguageContents, setBlocks, setContent, setTemplateGlobalStyles],
  );

  const contextValue = useMemo(
    () => ({
      blocks,
      selectedBlockId,
      expandedNodes,
      structure,
      htmlStructure,
      dataModelJson: modelJson,
      templateContent: content,
      templateName: name,
      templateMimeType: mimeType,
      templateCategory: category,
      globalStyles: templateGlobalStyles,
      isLoading,
      error,
      currentLanguage,
      defaultLanguage,
      availableLanguages,
      isTranslating,
      isCurrentLanguageDefault,
      selectBlock,
      addBlock,
      updateBlock,
      removeBlock,
      duplicateBlock,
      moveBlock,
      toggleStructureNode,
      setTemplateContent: setContent,
      setTemplateName: setName,
      setTemplateMimeType: setMimeType,
      setTemplateCategory: setCategory,
      setGlobalStyles,
      setDataModelJson: setModelJson,
      setLoadingState,
      loadBlocksFromFtl,
      isMarkdownGuideOpen,
      setIsMarkdownGuideOpen,
      setCurrentLanguage: switchLanguage,
      setDefaultLanguage: updateDefaultLanguage,
      addLanguage,
      removeLanguage,
      getLanguageBlocks,
      saveCurrentLanguageBlocks,
      loadBlocksFromContents,
    }),
    [
      blocks,
      selectedBlockId,
      expandedNodes,
      structure,
      htmlStructure,
      modelJson,
      content,
      name,
      mimeType,
      category,
      templateGlobalStyles,
      isLoading,
      error,
      currentLanguage,
      defaultLanguage,
      availableLanguages,
      isTranslating,
      isCurrentLanguageDefault,
      selectBlock,
      addBlock,
      updateBlock,
      removeBlock,
      duplicateBlock,
      moveBlock,
      toggleStructureNode,
      setContent,
      setName,
      setMimeType,
      setCategory,
      setGlobalStyles,
      setModelJson,
      setLoadingState,
      loadBlocksFromFtl,
      isMarkdownGuideOpen,
      setIsMarkdownGuideOpen,
      switchLanguage,
      updateDefaultLanguage,
      addLanguage,
      removeLanguage,
      getLanguageBlocks,
      saveCurrentLanguageBlocks,
      loadBlocksFromContents,
    ],
  );

  return (
    <TemplateDesignerContext.Provider value={contextValue}>
      {children}
    </TemplateDesignerContext.Provider>
  );
};
