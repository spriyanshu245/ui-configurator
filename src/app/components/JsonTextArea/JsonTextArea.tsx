"use client";
import React, { useEffect, useState } from "react";
import styles from "./JsonTextArea.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";

function sanitizeWhitespace(input: string) {
  return input.replace(/\u00A0/g, " ").replace(/\u200B/g, "");
}

interface JsonTextAreaProps {
  id?: string;
  value: string;
  onChange?: (val: string) => void;
  onValidJson?: (parsed: any) => void;
  validateKeys?: (parsed: any) => string[] | void;
}

const JsonTextArea = ({
  id,
  value,
  onChange,
  onValidJson,
  validateKeys,
}: JsonTextAreaProps) => {
  const [text, setText] = useState(value);
  const [error, setError] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const newVal = sanitizeWhitespace(rawVal);
    setText(newVal);
    if (onChange) {
      onChange(newVal);
    }
    checkValidity(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.currentTarget;
      if (!e.shiftKey) {
        e.currentTarget.value =
          value.substring(0, selectionStart) +
          "\t" +
          value.substring(selectionEnd);
        e.currentTarget.selectionStart = selectionStart + 1;
        e.currentTarget.selectionEnd = selectionStart + 1;
      } else if (selectionStart > 0 && value[selectionStart - 1] === "\t") {
        e.currentTarget.value =
          value.substring(0, selectionStart - 1) +
          value.substring(selectionEnd);
        e.currentTarget.selectionStart = selectionStart - 1;
        e.currentTarget.selectionEnd = selectionStart - 1;
      }
      handleTextChange(e as any);
    }
  };

  const checkValidity = (input: string) => {
    try {
      const parsedObject = JSON.parse(input);
      setError("");
      const invalidKeys = validateKeys?.(parsedObject);
      if (invalidKeys && invalidKeys.length > 0) {
        setError("Invalid keys: " + invalidKeys.join(", "));
      } else {
        setError("");
      }
    } catch {
      setError("Invalid JSON");
    }
  };

  const beautify = () => {
    try {
      const parsed = JSON.parse(sanitizeWhitespace(text));
      const pretty = JSON.stringify(parsed, null, "\t");
      setText(pretty);
      onChange?.(pretty);
      setError("");
      onValidJson?.(parsed);
    } catch {
      setError("Cannot beautify invalid JSON");
    }
  };

  useEffect(() => {
    beautify();
  }, []);

  const [isMaximized, setIsMaximized] = useState(false);
  const textareaRef = React.useRef<HTMLDivElement>(null);

  const minimizeJsonTextArea = () => {
    const textarea = textareaRef.current;
    if (textarea) textarea.classList.remove(styles.expanded);
    setIsMaximized(false);
  };
  const maximizeJsonTextArea = () => {
    const textarea = textareaRef.current;
    if (textarea && !isMaximized) {
      textarea.classList.add(styles.expanded);
      const cleanup = () => {
        textarea.classList.remove(styles.expanded);
      };

      document.addEventListener("minimizeTextArea", cleanup, {
        once: true,
      });

      textarea.focus();

      document.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") minimizeJsonTextArea();
        },
        { once: true }
      );
    }
    setIsMaximized(true);
  };

  return (
    <div ref={textareaRef} className={styles.jsonTextAreaContainer}>
      <textarea
        id={id}
        data-testid={id}
        className={styles.jsonTextArea}
        rows={8}
        placeholder="{}"
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
      <div className={styles.buttonGroup}>
        <button
          type="button"
          className={`${sharedStyles.mr5} ${sharedStyles.iconButton} ${sharedStyles.svgStroke} ${sharedStyles.small}`}
          onClick={beautify}
          data-testid="beautify"
          title="Format JSON"
          aria-label="Format JSON"
        >
          <svg
            width="600"
            height="534"
            viewBox="0 0 600 534"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M216.667 33.6667H200C182.319 33.6667 165.362 40.6905 152.86 53.193C140.357 65.6954 133.333 82.6523 133.333 100.333V167C133.333 200.333 113.333 267 33.3333 267C66.6667 267 133.333 287 133.333 367V433.667C133.333 451.348 140.357 468.305 152.86 480.807C165.362 493.31 182.319 500.333 200 500.333H216.667M383.333 33.6667H400C417.681 33.6667 434.638 40.6905 447.14 53.193C459.643 65.6954 466.667 82.6523 466.667 100.333V167C466.667 200.333 486.667 267 566.667 267C533.333 267 466.667 287 466.667 367V433.667C466.667 451.348 459.643 468.305 447.14 480.807C434.638 493.31 417.681 500.333 400 500.333H383.333"
              stroke="black"
              strokeWidth="66.6667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={`${sharedStyles.iconButton} ${sharedStyles.small} ${styles.maximizeButton}`}
          onClick={!isMaximized ? maximizeJsonTextArea : minimizeJsonTextArea}
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
      {error && <p className={styles.jsonError}>{error}</p>}
    </div>
  );
};

export default JsonTextArea;
