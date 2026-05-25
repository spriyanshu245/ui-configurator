import { useState, useCallback, useMemo, useRef } from "react";
import {
  TemplateBlock,
  SupportedLanguage,
  TemplateContent,
} from "@/app/template-designer/types";
import {
  DEFAULT_LANGUAGE_DATA,
  getLanguageByCode,
} from "@/app/template-designer/constants";
import {
  translateBlocks,
  deepCloneBlocks,
} from "@/app/template-designer/services/translationService";

interface UseLanguageManagementProps {
  blocks: TemplateBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<TemplateBlock[]>>;
  setError: (error: string | null) => void;
  onLoadContents?: (contents: TemplateContent[]) => void;
}

interface UseLanguageManagementReturn {
  currentLanguage: SupportedLanguage;
  defaultLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  isTranslating: boolean;
  isCurrentLanguageDefault: boolean;
  languageContentsRef: React.RefObject<Map<string, TemplateBlock[]>>;
  switchLanguage: (lang: SupportedLanguage) => void;
  updateDefaultLanguage: (lang: SupportedLanguage) => void;
  addLanguage: (targetLang: SupportedLanguage) => Promise<void>;
  removeLanguage: (lang: SupportedLanguage) => void;
  getLanguageBlocks: (lang: string) => TemplateBlock[];
  saveCurrentLanguageBlocks: () => void;
  loadLanguageContents: (
    contents: TemplateContent[],
    parseFn: (content: string) => TemplateBlock[],
  ) => TemplateBlock[];
}

export const useLanguageManagement = ({
  blocks,
  setBlocks,
  setError,
}: UseLanguageManagementProps): UseLanguageManagementReturn => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    DEFAULT_LANGUAGE_DATA,
  );
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>(
    DEFAULT_LANGUAGE_DATA,
  );
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [languageVersion, setLanguageVersion] = useState<number>(0);
  const languageContentsRef = useRef<Map<string, TemplateBlock[]>>(new Map());

  const availableLanguages = useMemo(() => {
    const codes = Array.from(languageContentsRef.current.keys());
    return codes
      .map((code) => getLanguageByCode(code))
      .filter((lang): lang is SupportedLanguage => lang !== undefined);
  }, [languageVersion]);

  const isCurrentLanguageDefault =
    currentLanguage.value === defaultLanguage.value;

  const saveCurrentLanguageBlocks = useCallback(() => {
    languageContentsRef.current.set(
      currentLanguage.value,
      deepCloneBlocks(blocks),
    );
  }, [currentLanguage, blocks]);

  const switchLanguage = useCallback(
    (lang: SupportedLanguage) => {
      if (lang.value === currentLanguage.value) return;

      languageContentsRef.current.set(
        currentLanguage.value,
        deepCloneBlocks(blocks),
      );

      const langBlocks = languageContentsRef.current.get(lang.value);
      if (langBlocks) {
        setBlocks(deepCloneBlocks(langBlocks));
        setCurrentLanguage(lang);
      }
    },
    [currentLanguage, blocks, setBlocks],
  );

  const updateDefaultLanguage = useCallback((lang: SupportedLanguage) => {
    setDefaultLanguage(lang);
  }, []);

  const addLanguage = useCallback(
    async (targetLang: SupportedLanguage) => {
      if (languageContentsRef.current.has(targetLang.value)) {
        switchLanguage(targetLang);
        return;
      }

      setIsTranslating(true);
      try {
        languageContentsRef.current.set(
          currentLanguage.value,
          deepCloneBlocks(blocks),
        );

        const sourceBlocks =
          languageContentsRef.current.get(defaultLanguage.value) ??
          deepCloneBlocks(blocks);

        const translatedBlocks = await translateBlocks(
          sourceBlocks,
          defaultLanguage.value,
          targetLang.value,
        );

        languageContentsRef.current.set(targetLang.value, translatedBlocks);
        setLanguageVersion((v) => v + 1);

        setBlocks(deepCloneBlocks(translatedBlocks));
        setCurrentLanguage(targetLang);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Translation failed";
        setError(message);
      } finally {
        setIsTranslating(false);
      }
    },
    [
      currentLanguage,
      blocks,
      switchLanguage,
      defaultLanguage,
      setBlocks,
      setError,
    ],
  );

  const removeLanguage = useCallback(
    (lang: SupportedLanguage) => {
      if (lang.value === defaultLanguage.value) return;

      languageContentsRef.current.delete(lang.value);
      setLanguageVersion((v) => v + 1);

      if (lang.value === currentLanguage.value) {
        const langBlocks = languageContentsRef.current.get(
          defaultLanguage.value,
        );
        if (langBlocks) {
          setBlocks(deepCloneBlocks(langBlocks));
          setCurrentLanguage(defaultLanguage);
        }
      }
    },
    [currentLanguage, defaultLanguage, setBlocks],
  );

  const getLanguageBlocks = useCallback((lang: string): TemplateBlock[] => {
    return languageContentsRef.current.get(lang) ?? [];
  }, []);

  const loadLanguageContents = useCallback(
    (
      contents: TemplateContent[],
      parseFn: (content: string) => TemplateBlock[],
    ): TemplateBlock[] => {
      languageContentsRef.current.clear();

      let defaultLangData = DEFAULT_LANGUAGE_DATA;
      let initialBlocks: TemplateBlock[] = [];

      for (const contentItem of contents) {
        const parsedBlocks = parseFn(contentItem.content);
        languageContentsRef.current.set(contentItem.language, parsedBlocks);

        if (contentItem.isDefault) {
          defaultLangData =
            getLanguageByCode(contentItem.language) ?? DEFAULT_LANGUAGE_DATA;
          initialBlocks = parsedBlocks;
        }
      }

      setDefaultLanguage(defaultLangData);
      setCurrentLanguage(defaultLangData);
      setLanguageVersion((v) => v + 1);

      return initialBlocks;
    },
    [],
  );

  return {
    currentLanguage,
    defaultLanguage,
    availableLanguages,
    isTranslating,
    isCurrentLanguageDefault,
    languageContentsRef,
    switchLanguage,
    updateDefaultLanguage,
    addLanguage,
    removeLanguage,
    getLanguageBlocks,
    saveCurrentLanguageBlocks,
    loadLanguageContents,
  };
};
