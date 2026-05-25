"use client";
import { useState } from "react";
import styles from "./PlainTextTemplateEditor.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import {
  saveNotificationTemplateData,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";
import { NotificationTemplateMetadata } from "@/app/communications/templates/types";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import SaveIcon from "@/app/components/SVGIcons/Save";
import SettingsIcon from "@/app/components/SVGIcons/Settings";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import TemplateSettingsPane from "@/app/template-designer/components/TemplateSettingsPane/TemplateSettingsPane";

interface PlainTextTemplateEditorProps {
  templateId: string;
  communicationType: string;
  communicationSubscriptionKey: string;
  initialContent: string;
  metadata: NotificationTemplateMetadata;
}

const PlainTextTemplateEditor = ({
  templateId,
  communicationType,
  communicationSubscriptionKey,
  initialContent,
  metadata,
}: PlainTextTemplateEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { templateName, templateMimeType } = useTemplateDesigner();
  const { setUserNotification } = useHeaderV2();

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveNotificationTemplateData(
        communicationType,
        communicationSubscriptionKey,
        templateId,
        content,
      );

      if (
        metadata.templateName !== templateName ||
        metadata.templateMimeType !== templateMimeType
      ) {
        await updateNotificationTemplate(
          communicationType,
          communicationSubscriptionKey,
          templateId,
          {
            templateName,
            subject: metadata.subject,
            templateMimeType,
            language: metadata.language,
            primary: metadata.primary,
            vendorTemplateId: metadata.vendorTemplateId,
          },
        );
      }

      setUserNotification({
        type: "success",
        text: "Template saved successfully",
        time: 3000,
      });
    } catch (error) {
      setUserNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save template",
        time: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.plainTextEditor}>
      <div className={styles.templateHeader}>
        <span className={styles.templateName}>
          {templateName || "Untitled Template"}
        </span>
        <Tooltip text="Settings">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </Tooltip>
        <Tooltip text={isSaving ? "Saving..." : "Save"}>
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={handleSave}
            disabled={isSaving}
            title="Save"
          >
            <SaveIcon />
          </button>
        </Tooltip>
      </div>

      <div className={styles.editorBody}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          placeholder="Enter template content..."
        />
      </div>

      <TemplateSettingsPane
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode="communication"
      />
    </div>
  );
};

export default PlainTextTemplateEditor;
