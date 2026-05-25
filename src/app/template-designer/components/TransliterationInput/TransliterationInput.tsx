"use client";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import styles from "./TransliterationInput.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import { isTransliterableLanguage } from "@/app/template-designer/utils/translationUtils";
import { getTransliterationSuggestions } from "@/app/template-designer/services/translationService";

interface TransliterationInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}

interface SuggestionPosition {
  top: number;
  left: number;
}

const TransliterationInput = ({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: TransliterationInputProps) => {
  const { currentLanguage } = useTemplateDesigner();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wordStart, setWordStart] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [position, setPosition] = useState<SuggestionPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isTransliterationEnabled = isTransliterableLanguage(
    currentLanguage.value,
  );

  const fetchSuggestions = useCallback(
    async (word: string) => {
      if (!word || word.length < 2 || !isTransliterationEnabled) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const results = await getTransliterationSuggestions(
          word,
          currentLanguage.value,
          abortControllerRef.current.signal,
        );
        setSuggestions(results);
        setSelectedIndex(0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, isTransliterationEnabled],
  );

  const updatePosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const selectionStart = textarea.selectionStart;

    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split("\n");
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const style = globalThis.getComputedStyle(textarea);
    if (ctx) {
      ctx.font = `${style.fontSize} ${style.fontFamily}`;
    }

    const lineHeight = Number.parseInt(style.lineHeight, 10) || 20;
    const charWidth = ctx?.measureText(currentLineText).width ?? 0;

    const top =
      rect.top + globalThis.scrollY + (currentLineIndex + 1) * lineHeight + 4;
    const left = Math.min(
      rect.left +
        globalThis.scrollX +
        charWidth +
        Number.parseInt(style.paddingLeft, 10),
      rect.right - 200,
    );

    setPosition({ top, left });
  }, [value]);

  const isInsideFreemarkerVariable = useCallback(
    (text: string, cursorPos: number): boolean => {
      let depth = 0;
      for (let i = 0; i < cursorPos; i++) {
        if (text[i] === "$" && text[i + 1] === "{") {
          depth++;
        } else if (text[i] === "}" && depth > 0) {
          depth--;
        }
      }
      return depth > 0;
    },
    [],
  );

  const getCurrentWord = useCallback((text: string, cursorPos: number) => {
    let start = cursorPos;
    while (start > 0 && !/\s/.test(text[start - 1])) {
      start--;
    }
    return {
      word: text.substring(start, cursorPos),
      start,
    };
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      onChange(newValue);

      if (!isTransliterationEnabled) return;

      if (isInsideFreemarkerVariable(newValue, cursorPos)) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      const { word, start } = getCurrentWord(newValue, cursorPos);
      setCurrentWord(word);
      setWordStart(start);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (word.length >= 2) {
        setIsLoading(true);
        debounceRef.current = setTimeout(() => {
          fetchSuggestions(word);
          updatePosition();
        }, 200);
      } else {
        setSuggestions([]);
        setIsLoading(false);
      }
    },
    [
      onChange,
      isTransliterationEnabled,
      isInsideFreemarkerVariable,
      getCurrentWord,
      fetchSuggestions,
      updatePosition,
    ],
  );

  const applySuggestion = useCallback(
    (suggestion: string) => {
      const beforeWord = value.substring(0, wordStart);
      const afterWord = value.substring(wordStart + currentWord.length);
      const newValue = beforeWord + suggestion + " " + afterWord;
      onChange(newValue);
      setSuggestions([]);
      setCurrentWord("");

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newPos = wordStart + suggestion.length + 1;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
          textareaRef.current.focus();
        }
      });
    },
    [value, wordStart, currentWord, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === 0 ? suggestions.length - 1 : prev - 1,
          );
          break;
        case "Enter":
        case " ":
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            applySuggestion(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSuggestions([]);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          const index = Number.parseInt(e.key, 10) - 1;
          if (index < suggestions.length) {
            e.preventDefault();
            applySuggestion(suggestions[index]);
          }
          break;
        }
      }
    },
    [suggestions, selectedIndex, applySuggestion],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setSuggestions([]);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const renderSuggestions = () => {
    if (suggestions.length === 0 || !position) return null;

    return createPortal(
      <div
        className={styles.suggestionsPopup}
        style={{ top: position.top, left: position.left }}
      >
        {isLoading && <div className={styles.loading}>Loading...</div>}
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            className={`${styles.suggestionItem} ${
              index === selectedIndex ? styles.selected : ""
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              applySuggestion(suggestion);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className={styles.suggestionNumber}>{index + 1}</span>
            <span className={styles.suggestionText}>{suggestion}</span>
          </button>
        ))}
        <div className={styles.hint}>
          Use ↑↓ to navigate, 1-9 or Enter to select, Esc to close
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className={styles.transliterationInput}>
      <textarea
        ref={textareaRef}
        id={id}
        className={`${styles.textarea} ${className ?? ""}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        rows={rows}
        placeholder={placeholder}
      />
      {isTransliterationEnabled && (
        <div
          className={`${styles.indicator} ${isLoading ? styles.loading : ""}`}
          title="Transliteration enabled"
        >
          <span className={styles.languageCode}>{currentLanguage.value}</span>
        </div>
      )}
      {renderSuggestions()}
    </div>
  );
};

export default TransliterationInput;
