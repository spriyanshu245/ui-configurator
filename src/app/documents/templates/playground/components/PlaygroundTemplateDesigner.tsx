"use client";
import { useEffect } from "react";
import styles from "@/app/template-designer/components/TemplateDesigner/TemplateDesigner.module.scss";
import {
  TemplateDesignerProvider,
  useTemplateDesigner,
} from "@/app/template-designer/context/TemplateDesignerContext";
import StructurePanel from "@/app/template-designer/components/StructurePanel/StructurePanel";
import AvailableBlocksPanel from "@/app/template-designer/components/AvailableBlocksPanel/AvailableBlocksPanel";
import PreviewPane from "@/app/template-designer/components/PreviewPane/PreviewPane";
import PropertiesPanel from "@/app/template-designer/components/PropertiesPanel/PropertiesPanel";
import DataModelPanel from "@/app/template-designer/components/DataModelPanel/DataModelPanel";
import MarkdownGuidePanel from "@/app/template-designer/components/MarkdownGuidePanel/MarkdownGuidePanel";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { DEFAULT_GLOBAL_STYLES } from "@/app/template-designer/constants";

const MOCK_TEMPLATE_CONTENT = `<!DOCTYPE html>
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${DEFAULT_GLOBAL_STYLES.htmlTitle}</title>
  <style>
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    body { 
      font-family: ${DEFAULT_GLOBAL_STYLES.fontFamily}; 
      font-size: ${DEFAULT_GLOBAL_STYLES.fontSize}; 
      line-height: ${DEFAULT_GLOBAL_STYLES.lineHeight}; 
      color: ${DEFAULT_GLOBAL_STYLES.textColor}; 
      background-color: ${DEFAULT_GLOBAL_STYLES.bodyBackgroundColor}; 
      padding-top: ${DEFAULT_GLOBAL_STYLES.bodyPadding};
      padding-right: ${DEFAULT_GLOBAL_STYLES.bodyPadding};
      padding-bottom: ${DEFAULT_GLOBAL_STYLES.bodyPadding};
      padding-left: ${DEFAULT_GLOBAL_STYLES.bodyPadding};
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
  <h1 style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly;">Welcome to Template Playground</h1>
  <p style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly;">This is a demo template for testing the multi-lingual feature.</p>
  <p style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly;">Start editing by adding blocks from the left panel.</p>
</body>
</html>`;

const PlaygroundContent = () => {
  const {
    setTemplateName,
    setTemplateMimeType,
    setTemplateCategory,
    setLoadingState,
    loadBlocksFromContents,
    isLoading,
    error,
  } = useTemplateDesigner();

  useEffect(() => {
    setLoadingState(true, null);

    const timer = setTimeout(() => {
      setTemplateName("HTML Multi-lingual Playground Template");
      setTemplateMimeType("text/html");
      setTemplateCategory("email");

      loadBlocksFromContents([
        {
          content: MOCK_TEMPLATE_CONTENT,
          language: "en",
          isDefault: true,
        },
      ]);

      setLoadingState(false, null);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    setTemplateName,
    setTemplateMimeType,
    setTemplateCategory,
    setLoadingState,
    loadBlocksFromContents,
  ]);

  if (isLoading) {
    return (
      <div className={styles.templateDesigner}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading playground...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.templateDesigner}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.templateDesigner}>
      <aside className={styles.leftSidebar}>
        <MarkdownGuidePanel />
        <div className={styles.structureSection}>
          <StructurePanel templateId="playground" isPlayground />
        </div>
        <div className={styles.blocksSection}>
          <AvailableBlocksPanel />
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.previewWrapper}>
          <PreviewPane />
        </div>
      </main>

      <aside className={styles.rightSidebar}>
        <div className={styles.propertiesSection}>
          <PropertiesPanel />
        </div>
        <div className={styles.dataModelSection}>
          <DataModelPanel />
        </div>
      </aside>
    </div>
  );
};

const PlaygroundWrapper = () => {
  const {
    setPageTitle,
    setResourceCode,
    setResourceMetadata,
    setShowCloseIcon,
    setBackRoute,
  } = useHeaderV2();

  const { templateName, templateMimeType } = useTemplateDesigner();

  useEffect(() => {
    setPageTitle("Template Playground");
    setResourceCode(templateName);
    setResourceMetadata(templateMimeType);
    setShowCloseIcon(true);
    setBackRoute("/documents/templates");
  }, [
    setPageTitle,
    setResourceCode,
    setResourceMetadata,
    setShowCloseIcon,
    setBackRoute,
    templateName,
    templateMimeType,
  ]);

  return (
    <>
      <HeaderV2 />
      <PlaygroundContent />
    </>
  );
};

const PlaygroundTemplateDesigner = () => {
  return (
    <TemplateDesignerProvider initialLoading={true}>
      <PlaygroundWrapper />
    </TemplateDesignerProvider>
  );
};

export default PlaygroundTemplateDesigner;
