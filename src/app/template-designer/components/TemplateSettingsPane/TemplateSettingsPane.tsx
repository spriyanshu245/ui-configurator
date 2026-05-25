"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import Pane from "@/app/components/InternalComponents/Pane/Pane";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import ColorPicker from "@/app/components/HelperComponents/ColorPicker/ColorPicker";
import Tabs from "@/app/components/HelperComponents/Tabs/Tabs";
import TabList from "@/app/components/HelperComponents/Tabs/TabList";
import Tab from "@/app/components/HelperComponents/Tabs/Tab";
import TabPanel from "@/app/components/HelperComponents/Tabs/TabPanel";
import sharedStyles from "@/app/styles/shared.module.scss";
import styles from "./TemplateSettingsPane.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import {
  BODY_PADDING_OPTIONS,
  CATEGORY_OPTIONS_BY_MIME_TYPE,
  FONT_FAMILY_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  PAGE_SIZE_OPTIONS,
  SUPPORTED_LANGUAGES,
} from "@/app/template-designer/constants";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import { TemplateDesignerMode } from "@/app/template-designer/types";

interface TemplateSettingsPaneProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: TemplateDesignerMode;
}

const TemplateSettingsPane = ({
  isOpen,
  onClose,
  mode = "document",
}: TemplateSettingsPaneProps) => {
  const {
    templateName,
    templateMimeType,
    templateCategory,
    globalStyles,
    setTemplateName,
    setTemplateCategory,
    setGlobalStyles,
    availableLanguages,
    defaultLanguage,
    isTranslating,
    addLanguage,
    removeLanguage,
  } = useTemplateDesigner();

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [addingLanguageCode, setAddingLanguageCode] = useState<string | null>(
    null,
  );
  const isHtmlTemplate = templateMimeType === "text/html";
  const canManageLanguages = mode === "document";

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const categoryOptions = useMemo(() => {
    return CATEGORY_OPTIONS_BY_MIME_TYPE[templateMimeType] ?? [];
  }, [templateMimeType]);

  const getMimeTypeLabel = (mimeType: string): string => {
    const labels: Record<string, string> = {
      "text/html": "HTML",
      "text/plain": "Text",
    };
    return labels[mimeType] ?? mimeType;
  };

  const paneFooter = (
    <div className={styles.actions}>
      <button type="button" className={styles.button} onClick={onClose}>
        Done
      </button>
    </div>
  );

  const generalTabContent = (
    <>
      <div className={sharedStyles.field}>
        <label htmlFor="template-name">Template Name</label>
        <input
          id="template-name"
          ref={nameInputRef}
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Enter template name"
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="template-mimetype">MIME Type</label>
        <input
          id="template-mimetype"
          type="text"
          value={getMimeTypeLabel(templateMimeType)}
          disabled
          readOnly
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="template-category">Category</label>
        <SelectDropdown
          id="template-category"
          options={categoryOptions}
          value={templateCategory}
          onChange={setTemplateCategory}
          placeholder="Select category"
          showSearch={false}
        />
      </div>

      {isHtmlTemplate && (
        <div className={sharedStyles.field}>
          <label htmlFor="html-title">HTML Title</label>
          <input
            id="html-title"
            type="text"
            value={globalStyles.htmlTitle}
            onChange={(e) => setGlobalStyles({ htmlTitle: e.target.value })}
            placeholder="Document title for browser tab"
          />
          <p className={styles.fieldHint}>
            Appears in browser tabs and email client previews. Helps with
            accessibility and threading.
          </p>
        </div>
      )}

      {isHtmlTemplate && (
        <div className={sharedStyles.field}>
          <label htmlFor="preheader-text">Preheader Text</label>
          <input
            id="preheader-text"
            type="text"
            value={globalStyles.preheaderText}
            onChange={(e) => setGlobalStyles({ preheaderText: e.target.value })}
            placeholder="Preview text shown in inbox"
            maxLength={100}
          />
          <p className={styles.fieldHint}>
            Preheader text appears after the subject line in email inbox
            previews. Keep it between 40-70 characters for best results. This
            can significantly improve email open rates.
          </p>
        </div>
      )}
    </>
  );

  const bodyStylesTabContent = (
    <>
      <div className={sharedStyles.field}>
        <label htmlFor="body-bg-color">Background Color</label>
        <ColorPicker
          id="body-bg-color"
          value={globalStyles.bodyBackgroundColor}
          onChange={(color: string) =>
            setGlobalStyles({ bodyBackgroundColor: color })
          }
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="font-family">
          Font Family (only for English Language)
        </label>
        <SelectDropdown
          id="font-family"
          options={FONT_FAMILY_OPTIONS}
          value={globalStyles.fontFamily}
          onChange={(value) => setGlobalStyles({ fontFamily: value })}
          placeholder="Select font"
          showSearch={false}
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="font-size">Font Size</label>
        <div className={styles.inputWithSuffix}>
          <input
            type="text"
            inputMode="numeric"
            id="font-size"
            className={styles.suffixInput}
            value={globalStyles.fontSize.replaceAll(/[^0-9.]/g, "")}
            onChange={(e) =>
              setGlobalStyles({ fontSize: `${e.target.value}px` })
            }
            placeholder="14"
          />
          <span className={styles.suffix}>px</span>
        </div>
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="text-color">Text Color</label>
        <ColorPicker
          id="text-color"
          value={globalStyles.textColor}
          onChange={(color: string) => setGlobalStyles({ textColor: color })}
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="line-height">Line Height</label>
        <SelectDropdown
          id="line-height"
          options={LINE_HEIGHT_OPTIONS}
          value={globalStyles.lineHeight}
          onChange={(value) => setGlobalStyles({ lineHeight: value })}
          placeholder="Select line height"
          showSearch={false}
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="page-size">Page Size</label>
        <SelectDropdown
          id="page-size"
          options={PAGE_SIZE_OPTIONS}
          value={globalStyles.contentMaxWidth.value}
          onChange={(value) => {
            const selected = PAGE_SIZE_OPTIONS.find(
              (opt) => opt.value === value,
            );
            if (selected) {
              setGlobalStyles({ contentMaxWidth: selected });
            }
          }}
          placeholder="Select page size"
          showSearch={false}
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="body-padding">Body Padding</label>
        <SelectDropdown
          id="body-padding"
          options={BODY_PADDING_OPTIONS}
          value={globalStyles.bodyPadding}
          onChange={(value) => setGlobalStyles({ bodyPadding: value })}
          placeholder="Select padding"
          showSearch={false}
        />
      </div>
    </>
  );

  const linkStylesTabContent = (
    <>
      <div className={sharedStyles.field}>
        <label htmlFor="link-color">Link Color</label>
        <ColorPicker
          id="link-color"
          value={globalStyles.linkColor}
          onChange={(color: string) => setGlobalStyles({ linkColor: color })}
        />
      </div>

      <div className={sharedStyles.field}>
        <label htmlFor="link-hover-color">Link Hover Color</label>
        <ColorPicker
          id="link-hover-color"
          value={globalStyles.linkHoverColor}
          onChange={(color: string) =>
            setGlobalStyles({ linkHoverColor: color })
          }
        />
      </div>
    </>
  );

  const availableLangCodes = new Set(availableLanguages.map((l) => l.value));
  const languagesToAdd = SUPPORTED_LANGUAGES.filter(
    (lang) => !availableLangCodes.has(lang.value),
  );

  const languagesTabContent = (
    <div className={styles.languagesTab}>
      <div className={styles.languagesGrid}>
        {availableLanguages.map((lang) => {
          const isDefault = lang.value === defaultLanguage.value;
          return (
            <div
              key={lang.value}
              className={`${styles.languageCard} ${styles.activeLanguage}`}
            >
              <div className={styles.languageCardInfo}>
                <span className={styles.languageCardName}>{lang.label}</span>
                {lang.value !== "en" && (
                  <span className={styles.languageCardNative}>
                    {lang.nativeName}
                  </span>
                )}
              </div>
              <div className={styles.languageCardActions}>
                {isDefault && (
                  <span className={styles.defaultBadge}>Default</span>
                )}
                {isDefault ? (
                  <Tooltip text="Cannot delete default language">
                    <button
                      type="button"
                      className={`${styles.cardActionButton} ${styles.disabled}`}
                      disabled
                    >
                      <DeleteIcon />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    className={styles.cardActionButton}
                    onClick={() => removeLanguage(lang)}
                    disabled={isTranslating}
                    title="Delete language"
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {languagesToAdd.map((lang) => {
          const isAdding = addingLanguageCode === lang.value;
          return (
            <button
              key={lang.value}
              type="button"
              className={`${styles.languageCard} ${styles.availableLanguage}`}
              onClick={async () => {
                setAddingLanguageCode(lang.value);
                await addLanguage(lang);
                setAddingLanguageCode(null);
              }}
              disabled={isTranslating}
            >
              <div className={styles.languageCardInfo}>
                <span className={styles.languageCardName}>{lang.label}</span>
                <span className={styles.languageCardNative}>
                  {lang.nativeName}
                </span>
              </div>
              {isAdding ? (
                <div className={styles.inlineSpinner} />
              ) : (
                <PlusIcon />
              )}
            </button>
          );
        })}
      </div>

      {isTranslating && <div className={styles.translatingOverlay} />}
    </div>
  );

  const settingSections = [
    { label: "General", content: generalTabContent },
    ...(canManageLanguages
      ? [{ label: "Languages", content: languagesTabContent }]
      : []),
    ...(isHtmlTemplate
      ? [
          { label: "Body Styles", content: bodyStylesTabContent },
          { label: "Link Styles", content: linkStylesTabContent },
        ]
      : []),
  ];

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      title="Template Settings"
      minWidth={500}
      paneFooter={paneFooter}
    >
      {settingSections.length === 1 ? (
        <div className={styles.singleSection}>{settingSections[0].content}</div>
      ) : (
        <Tabs key={`${mode}-${templateMimeType}`} defaultIndex={0}>
          <TabList>
            {settingSections.map((section) => (
              <Tab key={section.label}>{section.label}</Tab>
            ))}
          </TabList>
          {settingSections.map((section) => (
            <TabPanel key={section.label}>{section.content}</TabPanel>
          ))}
        </Tabs>
      )}
    </Pane>
  );
};

export default TemplateSettingsPane;
