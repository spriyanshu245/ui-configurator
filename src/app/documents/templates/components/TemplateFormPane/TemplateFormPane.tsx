"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Pane from "@/app/components/InternalComponents/Pane/Pane";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import FormPaneFooter from "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter";
import sharedStyles from "@/app/styles/shared.module.scss";
import { createTemplate, duplicateTemplate } from "@/app/documents/templates/services";
import { TemplateListing } from "@/app/template-designer/types";
import {
  MIME_TYPE_OPTIONS,
  CATEGORY_OPTIONS_BY_MIME_TYPE,
  DEFAULT_GLOBAL_STYLES,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "@/app/template-designer/constants";

interface TemplateFormPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (templateId: string) => void;
  mode?: "create" | "duplicate";
  sourceTemplate?: TemplateListing | null;
}

const DEFAULT_CONTENT = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>\${title}</title>
  <style>
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    body { 
      font-family: ${DEFAULT_GLOBAL_STYLES.fontFamily}; 
      font-size: ${DEFAULT_GLOBAL_STYLES.fontSize}; 
      line-height: ${DEFAULT_GLOBAL_STYLES.lineHeight}; 
      color: ${DEFAULT_GLOBAL_STYLES.textColor}; 
      background-color: ${DEFAULT_GLOBAL_STYLES.bodyBackgroundColor}; 
      padding-top: 16px;
      padding-right: 16px;
      padding-bottom: 16px;
      padding-left: 16px;
      margin-top: 0;
      margin-right: 0;
      margin-bottom: 0;
      margin-left: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    * { box-sizing: border-box; }
    p, h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; }
    a { color: ${DEFAULT_GLOBAL_STYLES.linkColor}; }
    a:hover { color: ${DEFAULT_GLOBAL_STYLES.linkHoverColor}; }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body>
  <p>Start editing..</p>
</body>
</html>`;

const TemplateFormPane = ({
  isOpen,
  onClose,
  onCreated,
  mode = "create",
  sourceTemplate,
}: TemplateFormPaneProps) => {
  const isDuplicateMode = mode === "duplicate";
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [mimeType, setMimeType] = useState("text/html");
  const [defaultLanguage, setDefaultLanguage] = useState(DEFAULT_LANGUAGE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = useMemo(() => {
    return SUPPORTED_LANGUAGES.map((lang) => ({
      value: lang.value,
      label: `${lang.label} (${lang.nativeName})`,
    }));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCategory("");
      setMimeType("text/html");
      setDefaultLanguage(DEFAULT_LANGUAGE);
      setError(null);
      return;
    }

    if (isDuplicateMode && sourceTemplate) {
      setName("");
      setCategory(sourceTemplate.category);
      setMimeType(sourceTemplate.mimeType ?? "text/html");
      if (sourceTemplate.contents && sourceTemplate.contents.length > 0) {
        const defaultContent = sourceTemplate.contents.find((c) => c.isDefault);
        setDefaultLanguage(defaultContent?.language ?? DEFAULT_LANGUAGE);
      }
    }
  }, [isOpen, isDuplicateMode, sourceTemplate]);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const isValid = useMemo(() => {
    return name.trim().length > 0 && category.length > 0;
  }, [name, category]);

  const categoryOptions = useMemo(() => {
    return CATEGORY_OPTIONS_BY_MIME_TYPE[mimeType] ?? [];
  }, [mimeType]);

  const handleMimeTypeChange = (value: string) => {
    setMimeType(value);
    setCategory("");
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isDuplicateMode) {
        if (!sourceTemplate) {
          setError("Source template not found");
          setSubmitting(false);
          return;
        }

        const response = await duplicateTemplate(sourceTemplate, name.trim());
        onCreated?.(response.id);
        onClose();
      } else {
        const payload = {
          name: name.trim(),
          category,
          contents: [
            {
              content: DEFAULT_CONTENT,
              language: defaultLanguage,
              isDefault: true,
            },
          ],
          mimeType,
        };

        const response = await createTemplate(payload);
        onCreated?.(response.id);
        onClose();
      }
    } catch (err) {
      let message = "Failed to create template";
      if (isDuplicateMode) {
        message = "Failed to duplicate template";
      }
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const paneFooter = (
    <FormPaneFooter
      onCancel={onClose}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      isValid={isValid}
      submitLabel={isDuplicateMode ? "Duplicate Template" : "Create"}
      submittingLabel={isDuplicateMode ? "Duplicating..." : "Creating..."}
    />
  );

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      title={isDuplicateMode ? "Duplicate Template" : "Create Template"}
      minWidth={400}
      paneFooter={paneFooter}
    >
      <form
        className={sharedStyles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {isDuplicateMode && sourceTemplate && (
          <div className={sharedStyles.infoBanner}>
            Duplicating from: <strong>{sourceTemplate.name}</strong>
          </div>
        )}
        <div className={sharedStyles.fieldGroup}>
          {error && (
            <div className={sharedStyles.field}>
              <div className={sharedStyles.error}>{error}</div>
            </div>
          )}

          <div className={sharedStyles.field}>
            <label htmlFor="template-name">Template Name*</label>
            <input
              ref={nameInputRef}
              type="text"
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              disabled={submitting}
              required
            />
          </div>

          <div className={sharedStyles.field}>
            <label htmlFor="template-mime-type">MIME Type*</label>
            <SelectDropdown
              id="template-mime-type"
              options={MIME_TYPE_OPTIONS}
              value={mimeType}
              onChange={handleMimeTypeChange}
              placeholder="Select MIME type"
              disabled={submitting}
              showSearch={false}
            />
          </div>

          <div className={sharedStyles.field}>
            <label htmlFor="template-category">Category*</label>
            <SelectDropdown
              id="template-category"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select a category"
              disabled={submitting}
              showSearch={false}
            />
          </div>

          <div className={sharedStyles.field}>
            <label htmlFor="template-language">Default Language</label>
            <SelectDropdown
              id="template-language"
              options={languageOptions}
              value={defaultLanguage}
              onChange={setDefaultLanguage}
              placeholder="Select default language"
              disabled={submitting}
              showSearch={false}
            />
          </div>
        </div>
      </form>
    </Pane>
  );
};

export default TemplateFormPane;
