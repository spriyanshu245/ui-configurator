"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./LanguageSelector.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import { SUPPORTED_LANGUAGES } from "@/app/template-designer/constants";
import { SupportedLanguage } from "@/app/template-designer/types";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import InlineLoaderIcon from "@/app/components/InternalComponents/InlineLoader/InlineLoader";

const LanguageSelector = () => {
  const {
    currentLanguage,
    defaultLanguage,
    availableLanguages,
    isTranslating,
    setCurrentLanguage,
    addLanguage,
    removeLanguage,
  } = useTemplateDesigner();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const availableLanguageCodes = new Set(
    availableLanguages.map((l) => l.value)
  );

  const languagesToAdd = SUPPORTED_LANGUAGES.filter(
    (l) => !availableLanguageCodes.has(l.value)
  );

  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      zIndex: 10000,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      if (availableLanguages.length === 1) {
        setShowAddMenu(true);
      }
    }
  }, [isOpen, updateMenuPosition, availableLanguages.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setShowAddMenu(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowAddMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (isTranslating) return;
    setIsOpen(!isOpen);
    setShowAddMenu(false);
  };

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setIsOpen(false);
  };

  const handleAddLanguage = async (lang: SupportedLanguage) => {
    setShowAddMenu(false);
    setIsOpen(false);
    await addLanguage(lang);
  };

  const handleDeleteLanguage = (
    e: React.MouseEvent,
    lang: SupportedLanguage
  ) => {
    e.stopPropagation();
    if (lang.value === defaultLanguage.value) return;
    removeLanguage(lang);
  };

  const renderMenu = () => {
    if (!isOpen) return null;

    const menu = (
      <div ref={menuRef} className={styles.menu} style={menuStyle}>
        <div className={styles.menuSection}>
          {availableLanguages.map((lang) => (
            <div
              key={lang.value}
              className={`${styles.menuItem} ${
                lang.value === currentLanguage.value ? styles.active : ""
              }`}
              onClick={() => handleLanguageSelect(lang)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleLanguageSelect(lang);
                }
              }}
            >
              <span className={styles.langName}>
                {lang.nativeName}
                {lang.value === defaultLanguage.value && (
                  <span className={styles.defaultBadge}>Default</span>
                )}
              </span>
              {lang.value === defaultLanguage.value ? (
                <Tooltip text="Cannot delete default language">
                  <button
                    className={`${styles.deleteBtn} ${styles.disabled}`}
                    disabled
                    aria-label="Cannot delete default language"
                  >
                    <DeleteIcon />
                  </button>
                </Tooltip>
              ) : (
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDeleteLanguage(e, lang)}
                  title="Delete language"
                  aria-label={`Delete ${lang.label}`}
                >
                  <DeleteIcon />
                </button>
              )}
            </div>
          ))}
        </div>

        {languagesToAdd.length > 0 && (
          <>
            <div className={styles.menuDivider} />
            <div className={styles.menuSection}>
              <div
                className={`${styles.menuItem} ${styles.addLanguageItem}`}
                onClick={() => setShowAddMenu(!showAddMenu)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowAddMenu(!showAddMenu);
                  }
                }}
              >
                <span>Add Language</span>
                <span
                  className={`${styles.chevron} ${
                    showAddMenu ? styles.open : ""
                  }`}
                >
                  <ChevronDownIcon />
                </span>
              </div>

              {showAddMenu && (
                <div className={styles.subMenu}>
                  {languagesToAdd.map((lang) => (
                    <div
                      key={lang.value}
                      className={styles.subMenuItem}
                      onClick={() => handleAddLanguage(lang)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          void handleAddLanguage(lang);
                        }
                      }}
                    >
                      <span className={styles.langNative}>
                        {lang.nativeName}
                      </span>
                      <span className={styles.langLabel}>{lang.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );

    return createPortal(menu, document.body);
  };

  return (
    <div ref={containerRef} className={styles.languageSelector}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ""} ${
          isTranslating ? styles.translating : ""
        }`}
        onClick={handleToggle}
        disabled={isTranslating}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {isTranslating ? (
          <div className={styles.translatingState}>
            <span className={styles.loaderIcon}>
              <InlineLoaderIcon />
            </span>
            <span className={styles.translatingText}>Translating</span>
          </div>
        ) : (
          <>
            <span className={styles.currentLang}>
              {currentLanguage.nativeName}
            </span>
            <span className={styles.chevronIcon}>
              <ChevronDownIcon />
            </span>
          </>
        )}
      </button>
      {renderMenu()}
    </div>
  );
};

export default LanguageSelector;
