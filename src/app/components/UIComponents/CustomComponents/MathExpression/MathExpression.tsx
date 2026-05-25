import React, { useState, useEffect, useRef } from "react";
import styles from "./MathExpression.module.scss";
import sharedStyles from "../../../../styles/shared.module.scss";

interface MathExpressionInputProps {
  variables: string[];
  expression: string;
  updateExpression: (e: string) => void;
}

const MathExpressionInput = (props: MathExpressionInputProps) => {
  const { variables, expression, updateExpression } = props;

  const [value, setValue] = useState<string>("");
  const [parts, setParts] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [currentChangedValue, setCurrentChangedValue] = useState<string | null>(
    null
  );
  const [indexOfCursorInParts, setIndexOfCursorInParts] = useState<
    number | null
  >(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const partsRegex = /([a-zA-Z_]\w*|\d|\+|-|\*|\/|\^|\(|\))/g;
  const operators = ["+", "-", "*", "/", "(", ")", "%"];

  useEffect(() => {
    setValue(expression || "");
  }, []);

  useEffect(() => {
    setParts(value?.match(partsRegex) || []);
    updateCursorPosition();
    validateExpression();
  }, [value]);

  useEffect(() => {
    updateCurrentChangedValue();
  }, [cursorPosition]);

  useEffect(() => {
    updateSuggestions();
  }, [currentChangedValue]);

  const updateCursorPosition = () => {
    if (!inputRef.current) {
      return;
    }

    const position = inputRef.current?.selectionStart;
    setCursorPosition(position);
  };

  const updateCurrentChangedValue = () => {
    if (!cursorPosition) {
      return "";
    }

    let startIdx = 0;
    let target = "";
    let ind = -1;

    // Find the part under the cursor
    for (let part of parts) {
      startIdx += part.length;
      ind++;
      if (startIdx >= cursorPosition) {
        target = part;
        break;
      }
    }

    setIndexOfCursorInParts(ind);
    setCurrentChangedValue(target);
    validateExpression();
  };

  const isValueVariable = (val: string) => {
    const reg = /^\d+$/;
    return !operators.includes(val) && !reg.test(val);
  };

  const updateSuggestions = () => {
    if (currentChangedValue && isValueVariable(currentChangedValue)) {
      const filteredSuggestions = variables.filter((operand: string) =>
        operand?.toLowerCase().startsWith(currentChangedValue.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    updateExpression(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const updatedParts = parts.map((part: string, index: number) => {
      return indexOfCursorInParts === index ? suggestion : part;
    });
    setParts(updatedParts);
    setValue(updatedParts.join(""));
    updateExpression(updatedParts.join(""));
  };

  const isVariable = (value: string) => {
    return variables.includes(value);
  };

  const isSuggestionSelected = () => {
    return currentChangedValue === suggestions[0];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
      updateCursorPosition();
    } else if (e.key === "Backspace") {
      if (!value.length) {
        return;
      }

      if (isVariable(currentChangedValue!)) {
        e.preventDefault();
        const updatedParts = parts.filter((part: string, index: number) => {
          return indexOfCursorInParts !== index;
        });
        const value = updatedParts.join("");
        setParts(updatedParts);
        setValue(value);
        updateExpression(value);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      }
    }
  };

  const validateExpression = () => {
    const stack = [];
    let lastWasOperator = true;
    let lastWasOperand = false;
    let lastWasNumber = false;

    for (const item of parts) {
      if (operators.includes(item)) {
        if (parts.length === 1 && item !== "(") {
          setError("Invalid expression: Cannot start with operator.");
          return false;
        }
        if (lastWasOperator && item !== "(") {
          setError("Invalid expression: consecutive operators.");
          return false;
        }
        if (item === ")" && lastWasOperator) {
          setError("Invalid expression: operator before closing parenthesis.");
          return false;
        }
        lastWasOperator = item !== ")";
        lastWasOperand = false;
        lastWasNumber = false;

        if (item === "(") {
          stack.push(item);
        } else if (item === ")") {
          if (stack.length === 0) {
            setError("Invalid expression: mismatched parentheses.");
            return false;
          }
          stack.pop();
        }
      } else if (/^\d+$/.test(item)) {
        if (lastWasOperand) {
          setError(
            "Invalid expression: number cannot be followed by a variable."
          );
          return false;
        }

        lastWasOperand = false;
        lastWasOperator = false;
        lastWasNumber = true;
      } else {
        if (lastWasOperand) {
          setError("Invalid expression: consecutive variables.");
          return false;
        }

        if (lastWasNumber) {
          setError(
            "Invalid expression: variable cannot be followed by a number."
          );
          return false;
        }

        lastWasOperand = true;
        lastWasOperator = false;
        lastWasNumber = false;
      }
    }

    if (stack.length > 0) {
      setError("Invalid expression: unbalanced parentheses.");
      return false;
    }

    if (lastWasOperator && parts.length > 0) {
      setError("Invalid expression: cannot end with an operator.");
      return false;
    }

    setError("");
    return true;
  };

  return (
    <div className={`${sharedStyles.formGroup} ${styles.formGroup}`}>
      <div className={styles.inputContainer}>
        <input
          id="expressionInput"
          data-testid="expressionInput"
          value={value}
          ref={inputRef}
          className={`${styles.input}`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e)}
          onKeyDown={handleKeyDown}
          onClick={() => updateCursorPosition()}
        />
      </div>
      {showSuggestions && value.length > 0 && !isSuggestionSelected() && (
        <ul className={`${styles.selectDropdown} ${styles.selectOption}`}>
          {suggestions.map((suggestion, index) => (
            <li
              key={"key-" + index}
              className={`${
                highlightedIndex === index
                  ? styles.selectOptionDark
                  : styles.selectOptionLight
              }`}
            >
              <button
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={styles.buttonReset}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && !showSuggestions && (
        <p className={`${styles.errorMessage}`}>{error}</p>
      )}
    </div>
  );
};

export default MathExpressionInput;
