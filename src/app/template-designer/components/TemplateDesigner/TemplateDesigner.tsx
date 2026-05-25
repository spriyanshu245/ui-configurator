"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./TemplateDesigner.module.scss";
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
import { getTemplate } from "@/app/documents/templates/services";
import {
  getNotificationTemplate,
  getNotificationTemplateData,
  normalizeNotificationTemplateData,
} from "@/app/communications/templates/services";
import { NotificationTemplateMetadata } from "@/app/communications/templates/types";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import {
  TemplateContent,
  TemplateDesignerMode,
} from "@/app/template-designer/types";
import PlainTextTemplateEditor from "@/app/template-designer/components/PlainTextTemplateEditor/PlainTextTemplateEditor";

interface TemplateDesignerProps {
  templateId: string;
  mode?: TemplateDesignerMode;
  listingRoute?: string;
  communicationType?: string;
  communicationSubscriptionKey?: string;
}

interface TemplateDesignerContentProps extends Omit<
  TemplateDesignerProps,
  "listingRoute"
> {
  communicationTemplateMetadata: NotificationTemplateMetadata | null;
  onCommunicationTemplateMetadataLoaded: (
    metadata: NotificationTemplateMetadata | null,
  ) => void;
  plainTextContent: string;
  onPlainTextContentLoaded: (content: string) => void;
}

const TemplateDesignerContent = ({
  templateId,
  mode = "document",
  communicationType,
  communicationSubscriptionKey,
  communicationTemplateMetadata,
  onCommunicationTemplateMetadataLoaded,
  plainTextContent,
  onPlainTextContentLoaded,
}: TemplateDesignerContentProps) => {
  const {
    setTemplateName,
    setTemplateMimeType,
    setTemplateCategory,
    setLoadingState,
    loadBlocksFromFtl,
    loadBlocksFromContents,
    isLoading,
    error,
  } = useTemplateDesigner();

  useEffect(() => {
    if (!templateId) return;

    let isMounted = true;
    const loadTemplate = async () => {
      setLoadingState(true, null);
      try {
        if (mode === "communication") {
          if (!communicationType || !communicationSubscriptionKey) {
            setLoadingState(
              false,
              "Missing notification type or subscription key for this communication template.",
            );
            return;
          }

          const [template, content] = await Promise.all([
            getNotificationTemplate(
              communicationType,
              communicationSubscriptionKey,
              templateId,
            ),
            getNotificationTemplateData(
              communicationType,
              communicationSubscriptionKey,
              templateId,
            ),
          ]);

          if (isMounted) {
            onCommunicationTemplateMetadataLoaded(template);
            setTemplateName(template.templateName ?? "Untitled Template");
            setTemplateMimeType(template.templateMimeType ?? "text/html");
            setTemplateCategory("communication");

            const normalizedContent = normalizeNotificationTemplateData(
              content ?? "",
            );

            if (template.templateMimeType === "text/plain") {
              onPlainTextContentLoaded(normalizedContent);
            } else if (normalizedContent) {
              const languageAwareContent: TemplateContent[] = [
                {
                  content: normalizedContent,
                  language: template.language,
                  isDefault: true,
                },
              ];
              loadBlocksFromContents(languageAwareContent);
            }

            setLoadingState(false, null);
          }
          return;
        }

        const template = await getTemplate(templateId);
        if (isMounted) {
          onCommunicationTemplateMetadataLoaded(null);
          setTemplateName(template.name ?? "Untitled Template");
          setTemplateMimeType(template.mimeType ?? "application/json");
          setTemplateCategory(template.category ?? "");

          if (template.contents && template.contents.length > 0) {
            loadBlocksFromContents(template.contents);
          } else {
            const content = template.content ?? "";
            if (
              content.trim().startsWith("<!DOCTYPE") ||
              content.trim().startsWith("<html") ||
              content.includes("<#list") ||
              content.includes("<#if")
            ) {
              loadBlocksFromFtl(content);
            }
          }

          setLoadingState(false, null);
        }
      } catch (e) {
        if (isMounted) {
          const message =
            e instanceof Error ? e.message : "Failed to load template";
          setLoadingState(false, message);
        }
      }
    };

    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [
    templateId,
    mode,
    communicationType,
    communicationSubscriptionKey,
    setTemplateName,
    setTemplateMimeType,
    setTemplateCategory,
    setLoadingState,
    loadBlocksFromFtl,
    loadBlocksFromContents,
    onCommunicationTemplateMetadataLoaded,
    onPlainTextContentLoaded,
  ]);

  if (isLoading) {
    return (
      <div className={styles.templateDesigner}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading template...</span>
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

  if (
    mode === "communication" &&
    communicationTemplateMetadata?.templateMimeType === "text/plain" &&
    communicationTemplateMetadata != null
  ) {
    return (
      <PlainTextTemplateEditor
        templateId={templateId}
        communicationType={communicationType!}
        communicationSubscriptionKey={communicationSubscriptionKey!}
        initialContent={plainTextContent}
        metadata={communicationTemplateMetadata}
      />
    );
  }

  return (
    <div className={styles.templateDesigner}>
      <aside className={styles.leftSidebar}>
        <MarkdownGuidePanel />
        <div className={styles.structureSection}>
          <StructurePanel
            templateId={templateId}
            mode={mode}
            communicationType={communicationType}
            communicationSubscriptionKey={communicationSubscriptionKey}
            communicationTemplateMetadata={communicationTemplateMetadata}
          />
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

interface TemplateDesignerWrapperProps extends TemplateDesignerProps {
  communicationTemplateMetadata: NotificationTemplateMetadata | null;
  onCommunicationTemplateMetadataLoaded: (
    metadata: NotificationTemplateMetadata | null,
  ) => void;
  plainTextContent: string;
  onPlainTextContentLoaded: (content: string) => void;
}

const TemplateDesignerWrapper = ({
  templateId,
  mode = "document",
  listingRoute = "/documents/templates",
  communicationType,
  communicationSubscriptionKey,
  communicationTemplateMetadata,
  onCommunicationTemplateMetadataLoaded,
  plainTextContent,
  onPlainTextContentLoaded,
}: TemplateDesignerWrapperProps) => {
  const {
    setPageTitle,
    setResourceCode,
    setResourceMetadata,
    setShowCloseIcon,
    setBackRoute,
  } = useHeaderV2();
  const searchParams = useSearchParams();
  const backQuery = searchParams.get("backQuery");

  const { templateName, templateMimeType } = useTemplateDesigner();

  useEffect(() => {
    const buildCommunicationBackRoute = () => {
      if (mode !== "communication" || !communicationType) {
        return "/communications/templates";
      }
      const subscriptionQuery = communicationSubscriptionKey
        ? `&subscriptionKey=${encodeURIComponent(communicationSubscriptionKey)}`
        : "";
      return `/communications/templates?type=${encodeURIComponent(
        communicationType,
      )}${subscriptionQuery}`;
    };
    const buildDocumentBackRoute = () => {
      if (backQuery) {
        return `${listingRoute}?q=${encodeURIComponent(backQuery)}`;
      }
      return listingRoute;
    };
    const backRoute =
      mode === "communication"
        ? buildCommunicationBackRoute()
        : buildDocumentBackRoute();
    setPageTitle(
      mode === "communication"
        ? "Edit Communication Template"
        : "Edit Template",
    );
    setResourceCode(templateName);
    setResourceMetadata(
      mode === "communication" && communicationType
        ? `${communicationType} / ${communicationSubscriptionKey ?? ""}`
        : templateMimeType,
    );
    setShowCloseIcon(true);
    setBackRoute(backRoute);
  }, [
    backQuery,
    mode,
    listingRoute,
    communicationType,
    communicationSubscriptionKey,
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
      <TemplateDesignerContent
        templateId={templateId}
        mode={mode}
        communicationType={communicationType}
        communicationSubscriptionKey={communicationSubscriptionKey}
        communicationTemplateMetadata={communicationTemplateMetadata}
        onCommunicationTemplateMetadataLoaded={
          onCommunicationTemplateMetadataLoaded
        }
        plainTextContent={plainTextContent}
        onPlainTextContentLoaded={onPlainTextContentLoaded}
      />
    </>
  );
};

const TemplateDesigner = ({
  templateId,
  mode = "document",
  listingRoute = "/documents/templates",
  communicationType,
  communicationSubscriptionKey,
}: TemplateDesignerProps) => {
  const [communicationTemplateMetadata, setCommunicationTemplateMetadata] =
    useState<NotificationTemplateMetadata | null>(null);
  const [plainTextContent, setPlainTextContent] = useState("");

  return (
    <TemplateDesignerProvider initialLoading={true}>
      <TemplateDesignerWrapper
        templateId={templateId}
        mode={mode}
        listingRoute={listingRoute}
        communicationType={communicationType}
        communicationSubscriptionKey={communicationSubscriptionKey}
        communicationTemplateMetadata={communicationTemplateMetadata}
        onCommunicationTemplateMetadataLoaded={setCommunicationTemplateMetadata}
        plainTextContent={plainTextContent}
        onPlainTextContentLoaded={setPlainTextContent}
      />
    </TemplateDesignerProvider>
  );
};

export default TemplateDesigner;
