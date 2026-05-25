"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./TextEditor.module.scss";
import InternalIcons from "@/app/utils/InternalIcons";
import AddIcon from "../../SVGIcons/Add";
import DeleteIcon from "../../SVGIcons/Delete";
import sharedStyles from "@/app/styles/shared.module.scss";

interface FormatChecker {
  (element: HTMLElement, computedStyle: CSSStyleDeclaration): boolean;
}

interface TextEditorProps {
  id?: string;
  value?: string;
  onChange?: (val: string) => void;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const TEXT_FORMATS: Record<string, FormatChecker> = {
  bold: (element, computedStyle) => {
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === "b" ||
      tagName === "strong" ||
      parseInt(computedStyle.fontWeight, 10) >= 700
    );
  },
  italic: (element, computedStyle) => {
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === "i" ||
      tagName === "em" ||
      computedStyle.fontStyle === "italic"
    );
  },
  underline: (element, computedStyle) => {
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === "u" || computedStyle.textDecoration.includes("underline")
    );
  },
  strikethrough: (element, computedStyle) => {
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === "s" ||
      tagName === "strike" ||
      tagName === "del" ||
      computedStyle.textDecoration.includes("line-through")
    );
  },
  h1: (element) => element.tagName?.toLowerCase() === "h1",
  h2: (element) => element.tagName?.toLowerCase() === "h2",
  h3: (element) => element.tagName?.toLowerCase() === "h3",
  ul: (element) => element.tagName?.toLowerCase() === "ul",
  ol: (element) => element.tagName?.toLowerCase() === "ol",
  link: (element) => element.tagName?.toLowerCase() === "a",
};

const TextEditor: React.FC<TextEditorProps> = ({
  id,
  value = "",
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const linkTooltipRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [isMaximized, setIsMaximized] = useState(false);
  const [showLinkTooltip, setShowLinkTooltip] = useState(false);
  const [linkTooltipPosition, setLinkTooltipPosition] =
    useState<TooltipPosition>({ top: 0, left: 0 });
  const [currentLinkElement, setCurrentLinkElement] =
    useState<HTMLAnchorElement | null>(null);
  const [linkInputValue, setLinkInputValue] = useState("");
  const [textInputValue, setTextInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  const checkElementFormats = useCallback(
    (element: HTMLElement, formats: Set<string>): void => {
      const computedStyle = window.getComputedStyle(element);

      Object.entries(TEXT_FORMATS).forEach(([formatName, checker]) => {
        const isFormatActive = checker(element, computedStyle);
        if (isFormatActive) {
          formats.add(formatName);
        }
      });
    },
    []
  );

  const findLinkElement = useCallback(
    (node: Node | null): HTMLAnchorElement | null => {
      while (node && node !== editorRef.current) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName?.toLowerCase() === "a"
        ) {
          return node as HTMLAnchorElement;
        }
        node = node.parentNode;
      }
      return null;
    },
    []
  );

  const updateActiveFormats = useCallback((): void => {
    const formats = new Set<string>();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      setActiveFormats(formats);
      return;
    }

    let node: Node | null = selection.anchorNode;

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        checkElementFormats(node as HTMLElement, formats);
      }
      node = node.parentNode;
    }

    setActiveFormats(formats);
  }, [checkElementFormats]);

  const execCommand = useCallback(
    (command: string, value?: string): void => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleContentChange();
      updateActiveFormats();
    },
    [updateActiveFormats, handleContentChange]
  );

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    if (savedSelectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  }, []);

  const closeLinkTooltip = useCallback(() => {
    setShowLinkTooltip(false);
    setLinkInputValue("");
    setTextInputValue("");
    setCurrentLinkElement(null);
    setErrorMessage("");
  }, []);

  const insertLink = useCallback((): void => {
    if (!isMaximized) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setErrorMessage("Please select some text to create a link");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setErrorMessage("");
    const linkElement = findLinkElement(selection.anchorNode);
    if (linkElement) {
      setCurrentLinkElement(linkElement);
      setLinkInputValue(linkElement.href);
      setTextInputValue(linkElement.textContent || "");

      const rect = linkElement.getBoundingClientRect();
      const containerRect = editorRef.current?.getBoundingClientRect();

      if (containerRect) {
        setLinkTooltipPosition({
          top: rect.bottom - containerRect.top + 5,
          left: rect.left - containerRect.left,
        });
      }
    } else {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = editorRef.current?.getBoundingClientRect();

      if (containerRect) {
        setLinkTooltipPosition({
          top: rect.bottom - containerRect.top + 5,
          left: rect.left - containerRect.left,
        });
      }

      setLinkInputValue("");
      setTextInputValue(selectedText);
      setCurrentLinkElement(null);
    }

    saveSelection();
    setShowLinkTooltip(true);

    setTimeout(() => {
      linkInputRef.current?.focus();
    }, 100);
  }, [isMaximized, findLinkElement, saveSelection]);

  const handleLinkSubmit = useCallback(() => {
    if (!linkInputValue.trim()) {
      setErrorMessage("Please enter a URL");
      linkInputRef.current?.focus();
      return;
    }

    if (!textInputValue.trim()) {
      setErrorMessage("Please enter link text");
      textInputRef.current?.focus();
      return;
    }

    setErrorMessage("");

    let finalUrl = linkInputValue.trim();

    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    restoreSelection();

    if (currentLinkElement) {
      currentLinkElement.href = finalUrl;
      currentLinkElement.textContent = textInputValue;
      currentLinkElement.target = "_blank";
      currentLinkElement.rel = "noopener noreferrer";
      handleContentChange();
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const linkNode = document.createElement("a");
        linkNode.href = finalUrl;
        linkNode.textContent = textInputValue;
        linkNode.target = "_blank";
        linkNode.rel = "noopener noreferrer";

        range.insertNode(linkNode);

        range.setStartAfter(linkNode);
        range.setEndAfter(linkNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      handleContentChange();
    }

    closeLinkTooltip();
    editorRef.current?.focus();
  }, [
    linkInputValue,
    textInputValue,
    currentLinkElement,
    restoreSelection,
    handleContentChange,
    closeLinkTooltip,
  ]);

  const handleLinkRemove = useCallback(() => {
    if (currentLinkElement) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(currentLinkElement);
        selection.removeAllRanges();
        selection.addRange(range);
        execCommand("unlink");
      }
      closeLinkTooltip();
    }
  }, [currentLinkElement, execCommand, closeLinkTooltip]);

  const handleLinkHover = useCallback(
    (event: MouseEvent) => {
      if (!isMaximized || showLinkTooltip) return;

      const target = event.target as HTMLElement;
      const linkElement = target.closest("a") as HTMLAnchorElement;

      if (linkElement && editorRef.current?.contains(linkElement)) {
        setCurrentLinkElement(linkElement);
        setLinkInputValue(linkElement.href);
        setTextInputValue(linkElement.textContent || "");
        setErrorMessage("");

        const rect = linkElement.getBoundingClientRect();
        const containerRect = editorRef.current?.getBoundingClientRect();

        if (containerRect) {
          setLinkTooltipPosition({
            top: rect.bottom - containerRect.top + 5,
            left: rect.left - containerRect.left,
          });
        }

        setShowLinkTooltip(true);

        setTimeout(() => {
          linkInputRef.current?.focus();
          linkInputRef.current?.select();
        }, 100);
      }
    },
    [isMaximized, showLinkTooltip]
  );

  const handleTooltipMouseLeave = useCallback(() => {
    closeLinkTooltip();
  }, [closeLinkTooltip]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && isMaximized) {
      editor.addEventListener("mouseover", handleLinkHover);
      return () => {
        editor.removeEventListener("mouseover", handleLinkHover);
      };
    }
  }, [handleLinkHover, isMaximized]);

  const isActive = useCallback(
    (format: string): boolean => {
      return activeFormats.has(format);
    },
    [activeFormats]
  );

  const handleFormatClick = useCallback(
    (command: string, value?: string) => {
      return () => execCommand(command, value);
    },
    [execCommand]
  );

  const handleHeadingClick = useCallback(
    (headingTag: string, formatName: string) => {
      return () => {
        if (isActive(formatName)) {
          execCommand("formatBlock", "<p>");
        } else {
          execCommand("formatBlock", headingTag);
        }
      };
    },
    [execCommand, isActive]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>): void => {
      event.preventDefault();

      const clipboardData = event.clipboardData;
      const pastedHtml = clipboardData.getData("text/html");
      const pastedText = clipboardData.getData("text/plain");

      if (pastedHtml) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = pastedHtml;

        const removeComments = (node: Node): void => {
          const childNodes = Array.from(node.childNodes);
          childNodes.forEach((child) => {
            if (child.nodeType === Node.COMMENT_NODE) {
              child.remove();
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              removeComments(child);
            }
          });
        };
        removeComments(tempDiv);

        const allElements = tempDiv.querySelectorAll("*");

        allElements.forEach((element) => {
          const attributes = Array.from(element.attributes);
          attributes.forEach((attr) => {
            if (
              element.tagName.toLowerCase() === "a" &&
              (attr.name === "href" ||
                attr.name === "target" ||
                attr.name === "rel")
            ) {
            } else {
              element.removeAttribute(attr.name);
            }
          });

          if (element.tagName.toLowerCase() === "span") {
            const parent = element.parentNode;
            while (element.firstChild) {
              parent?.insertBefore(element.firstChild, element);
            }
            parent?.removeChild(element);
          }
        });

        const listItems = tempDiv.querySelectorAll("li");
        listItems.forEach((li) => {
          const paragraphs = li.querySelectorAll("p");
          paragraphs.forEach((p) => {
            const parent = p.parentNode;
            while (p.firstChild) {
              parent?.insertBefore(p.firstChild, p);
            }
            parent?.removeChild(p);
          });
        });

        const emptyElements = tempDiv.querySelectorAll(
          "*:empty:not(br):not(hr)"
        );
        emptyElements.forEach((el) => el.remove());

        const cleanedHtml = tempDiv.innerHTML;

        document.execCommand("insertHTML", false, cleanedHtml);
      } else {
        document.execCommand("insertText", false, pastedText);
      }

      setTimeout(() => {
        handleContentChange();
        updateActiveFormats();
      }, 0);
    },
    [updateActiveFormats, handleContentChange]
  );

  const minimizeEditor = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.classList.remove(styles.expanded);
    }
    setIsMaximized(false);
    closeLinkTooltip();
  }, [closeLinkTooltip]);

  const maximizeEditor = useCallback(() => {
    const container = containerRef.current;
    if (container && !isMaximized) {
      container.classList.add(styles.expanded);

      const cleanup = () => {
        container.classList.remove(styles.expanded);
      };

      document.addEventListener("minimizeTextArea", cleanup, {
        once: true,
      });

      editorRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (showLinkTooltip) {
            closeLinkTooltip();
          } else {
            minimizeEditor();
          }
        }
      };

      document.addEventListener("keydown", handleEscape, { once: true });
    }
    setIsMaximized(true);
  }, [isMaximized, minimizeEditor, showLinkTooltip, closeLinkTooltip]);

  return (
    <div ref={containerRef} className={styles.textEditorContainer}>
      <div className={styles.editorWrapper}>
        {isMaximized && (
          <div className={styles.toolbar}>
            <div className={styles.toolbarGroup}>
              <button
                className={`${styles.button} ${
                  isActive("bold") ? styles.active : ""
                }`}
                onClick={handleFormatClick("bold")}
                title="Bold (Ctrl+B)"
                type="button"
                aria-label="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                className={`${styles.button} ${
                  isActive("italic") ? styles.active : ""
                }`}
                onClick={handleFormatClick("italic")}
                title="Italic (Ctrl+I)"
                type="button"
                aria-label="Italic"
              >
                <em>I</em>
              </button>
              <button
                className={`${styles.button} ${
                  isActive("underline") ? styles.active : ""
                }`}
                onClick={handleFormatClick("underline")}
                title="Underline (Ctrl+U)"
                type="button"
                aria-label="Underline"
              >
                <u>U</u>
              </button>
              <button
                className={`${styles.button} ${
                  isActive("strikethrough") ? styles.active : ""
                }`}
                onClick={handleFormatClick("strikeThrough")}
                title="Strikethrough"
                type="button"
                aria-label="Strikethrough"
              >
                <s>S</s>
              </button>
            </div>

            <div className={styles.toolbarGroup}>
              <button
                className={`${styles.button} ${
                  isActive("h1") ? styles.active : ""
                }`}
                onClick={handleHeadingClick("<h1>", "h1")}
                title="Heading 1"
                type="button"
                aria-label="Heading 1"
              >
                H1
              </button>
              <button
                className={`${styles.button} ${
                  isActive("h2") ? styles.active : ""
                }`}
                onClick={handleHeadingClick("<h2>", "h2")}
                title="Heading 2"
                type="button"
                aria-label="Heading 2"
              >
                H2
              </button>
              <button
                className={`${styles.button} ${
                  isActive("h3") ? styles.active : ""
                }`}
                onClick={handleHeadingClick("<h3>", "h3")}
                title="Heading 3"
                type="button"
                aria-label="Heading 3"
              >
                H3
              </button>
              <button
                className={styles.button}
                onClick={handleFormatClick("formatBlock", "<p>")}
                title="Paragraph"
                type="button"
                aria-label="Paragraph"
              >
                P
              </button>
            </div>

            <div className={styles.toolbarGroup}>
              <button
                className={`${styles.button} ${
                  isActive("ul") ? styles.active : ""
                }`}
                onClick={handleFormatClick("insertUnorderedList")}
                title="Bullet List"
                type="button"
                aria-label="Bullet List"
              >
                • List
              </button>
              <button
                className={`${styles.button} ${
                  isActive("ol") ? styles.active : ""
                }`}
                onClick={handleFormatClick("insertOrderedList")}
                title="Numbered List"
                type="button"
                aria-label="Numbered List"
              >
                1. List
              </button>
            </div>

            <div className={styles.toolbarGroup}>
              <button
                className={styles.button}
                onClick={handleFormatClick("insertHorizontalRule")}
                title="Horizontal Line"
                type="button"
                aria-label="Horizontal Line"
              >
                ─ HR
              </button>
              <button
                className={styles.button}
                onClick={insertLink}
                title="Insert Link"
                type="button"
                aria-label="Insert Link"
              >
                🔗 Link
              </button>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          className={styles.textEditor}
          onMouseUp={updateActiveFormats}
          onKeyUp={(e) => {
            handleContentChange();
            updateActiveFormats();
          }}
          onInput={handleContentChange}
          onPaste={handlePaste}
          suppressContentEditableWarning
          role="textbox"
          aria-label="Text editor content"
          aria-multiline="true"
          data-testid={id}
        >
          <p>Start typing here...</p>
        </div>

        {isMaximized && showLinkTooltip && (
          <div
            ref={linkTooltipRef}
            className={styles.linkTooltip}
            style={{
              top: `${linkTooltipPosition.top}px`,
              left: `${linkTooltipPosition.left}px`,
            }}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <div className={styles.linkActionsTop}>
              <button
                type="button"
                onClick={handleLinkSubmit}
                className={styles.linkIconButton}
                title={currentLinkElement ? "Update link" : "Add link"}
              >
                {currentLinkElement ? InternalIcons("edit") : <AddIcon />}
              </button>
              <button
                type="button"
                onClick={handleLinkRemove}
                className={styles.linkIconButton}
                title="Remove link"
              >
                <DeleteIcon />
              </button>
            </div>

            {errorMessage && (
              <p className={styles.errorMessage}>{errorMessage}</p>
            )}

            <div className={styles.linkInputWrapper}>
              <label className={styles.inputLabel}>Link URL</label>
              <input
                ref={linkInputRef}
                type="url"
                value={linkInputValue}
                onChange={(e) => {
                  setLinkInputValue(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeLinkTooltip();
                  }
                }}
                placeholder="https://example.com"
                className={styles.linkInput}
              />
            </div>
            <div className={styles.linkInputWrapper}>
              <label className={styles.inputLabel}>Link Text</label>
              <input
                ref={textInputRef}
                type="text"
                value={textInputValue}
                onChange={(e) => {
                  setTextInputValue(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeLinkTooltip();
                  }
                }}
                placeholder="Link text"
                className={styles.linkInput}
              />
            </div>
          </div>
        )}

        {errorMessage && !showLinkTooltip && (
          <p className={styles.editorErrorMessage}>{errorMessage}</p>
        )}

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${sharedStyles.iconButton} ${sharedStyles.small} ${styles.maximizeButton}`}
            onClick={!isMaximized ? maximizeEditor : minimizeEditor}
            title={isMaximized ? "Minimize" : "Maximize"}
            aria-label={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <svg
                width="668"
                height="668"
                viewBox="0 0 668 668"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M657.567 57.5664L514.467 200.666H600.667C609.507 200.666 617.986 204.178 624.237 210.43C630.488 216.681 634 225.159 634 234C634 242.84 630.488 251.319 624.237 257.57C617.986 263.821 609.507 267.333 600.667 267.333H434C425.16 267.333 416.681 263.821 410.43 257.57C404.179 251.319 400.667 242.84 400.667 234V67.3331C400.667 58.4926 404.179 50.0141 410.43 43.7629C416.681 37.5117 425.16 33.9998 434 33.9998C442.841 33.9998 451.319 37.5117 457.57 43.7629C463.821 50.0141 467.333 58.4926 467.333 67.3331V153.533L610.433 10.4331C613.508 7.24943 617.186 4.71003 621.253 2.96306C625.32 1.2161 629.694 0.296555 634.12 0.258094C638.546 0.219634 642.935 1.06302 647.032 2.73905C651.128 4.41508 654.85 6.89019 657.98 10.0199C661.11 13.1497 663.585 16.8714 665.261 20.968C666.937 25.0645 667.78 29.4538 667.742 33.8798C667.703 38.3058 666.784 42.6798 665.037 46.7466C663.29 50.8134 660.75 54.4915 657.567 57.5664ZM34.0001 667.333C42.8399 667.331 51.317 663.818 57.5667 657.566L200.667 514.466V600.666C200.667 609.507 204.179 617.985 210.43 624.237C216.681 630.488 225.159 634 234 634C242.841 634 251.319 630.488 257.57 624.237C263.821 617.985 267.333 609.507 267.333 600.666V434C267.333 425.159 263.821 416.681 257.57 410.43C251.319 404.178 242.841 400.666 234 400.666H67.3334C58.4928 400.666 50.0144 404.178 43.7632 410.43C37.5119 416.681 34.0001 425.159 34.0001 434C34.0001 442.84 37.5119 451.319 43.7632 457.57C50.0144 463.821 58.4928 467.333 67.3334 467.333H153.533L10.4334 610.433C5.77308 615.095 2.59953 621.034 1.31394 627.499C0.028359 633.964 0.68846 640.665 3.21079 646.755C5.73313 652.845 10.0044 658.05 15.4848 661.713C20.9651 665.376 27.4084 667.332 34.0001 667.333Z"
                  fill="black"
                />
              </svg>
            ) : (
              <svg
                width="668"
                height="668"
                viewBox="0 0 668 668"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M410.433 257.566C404.184 251.316 400.674 242.839 400.674 234C400.674 225.161 404.184 216.684 410.433 210.433L553.533 67.3332H467.333C458.493 67.3332 450.014 63.8213 443.763 57.5701C437.512 51.3189 434 42.8404 434 33.9998C434 25.1593 437.512 16.6808 443.763 10.4296C450.014 4.1784 458.493 0.666504 467.333 0.666504H634C642.84 0.666504 651.319 4.1784 657.57 10.4296C663.821 16.6808 667.333 25.1593 667.333 33.9998V200.666C667.333 209.507 663.821 217.986 657.57 224.237C651.319 230.488 642.84 234 634 234C625.159 234 616.681 230.488 610.43 224.237C604.178 217.986 600.667 209.507 600.667 200.666V114.467L457.567 257.566C451.316 263.816 442.839 267.326 434 267.326C425.161 267.326 416.684 263.816 410.433 257.566ZM34 667.333H200.667C209.507 667.333 217.986 663.821 224.237 657.57C230.488 651.319 234 642.84 234 634C234 625.159 230.488 616.681 224.237 610.43C217.986 604.178 209.507 600.666 200.667 600.666H114.467L257.567 457.566C263.639 451.28 266.998 442.86 266.922 434.12C266.846 425.38 263.341 417.019 257.161 410.839C250.98 404.659 242.62 401.153 233.88 401.077C225.14 401.001 216.72 404.361 210.433 410.433L67.3333 553.533V467.333C67.3333 458.493 63.8214 450.014 57.5702 443.763C51.319 437.512 42.8405 434 34 434C25.1594 434 16.6809 437.512 10.4297 443.763C4.17852 450.014 0.666626 458.493 0.666626 467.333V634C0.666626 642.84 4.17852 651.319 10.4297 657.57C16.6809 663.821 25.1594 667.333 34 667.333Z"
                  fill="black"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
