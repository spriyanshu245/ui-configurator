import { useState, useCallback } from "react";
import { TemplateGlobalStyles } from "@/app/template-designer/types";
import {
  DEFAULT_DATA_MODEL_JSON,
  DEFAULT_GLOBAL_STYLES,
} from "@/app/template-designer/constants";

interface UseTemplateStateProps {
  initialContent?: string;
  initialLoading?: boolean;
  initialError?: string | null;
}

interface UseTemplateStateReturn {
  content: string;
  name: string;
  mimeType: string;
  category: string;
  templateGlobalStyles: TemplateGlobalStyles;
  modelJson: string;
  isLoading: boolean;
  error: string | null;
  isMarkdownGuideOpen: boolean;
  setContent: (value: string) => void;
  setName: (value: string) => void;
  setMimeType: (value: string) => void;
  setCategory: (value: string) => void;
  setGlobalStyles: (styles: Partial<TemplateGlobalStyles>) => void;
  setTemplateGlobalStyles: React.Dispatch<
    React.SetStateAction<TemplateGlobalStyles>
  >;
  setModelJson: (json: string) => void;
  setLoadingState: (loading: boolean, err?: string | null) => void;
  setError: (error: string | null) => void;
  setIsMarkdownGuideOpen: (open: boolean) => void;
}

export const useTemplateState = ({
  initialContent = "",
  initialLoading = false,
  initialError = null,
}: UseTemplateStateProps = {}): UseTemplateStateReturn => {
  const [content, setContent] = useState<string>(initialContent);
  const [name, setName] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("application/json");
  const [category, setCategory] = useState<string>("");
  const [templateGlobalStyles, setTemplateGlobalStyles] =
    useState<TemplateGlobalStyles>(DEFAULT_GLOBAL_STYLES);
  const [modelJson, setModelJson] = useState<string>(DEFAULT_DATA_MODEL_JSON);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] =
    useState<boolean>(false);

  const setGlobalStyles = useCallback(
    (styles: Partial<TemplateGlobalStyles>) => {
      setTemplateGlobalStyles((prev) => ({ ...prev, ...styles }));
    },
    []
  );

  const setLoadingState = useCallback(
    (loading: boolean, err: string | null = null) => {
      setIsLoading(loading);
      setError(err);
    },
    []
  );

  return {
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
  };
};
