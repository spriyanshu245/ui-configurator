"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Pane from "@/app/components/InternalComponents/Pane/Pane";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import FormPaneFooter from "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import {
  DEFAULT_LANGUAGE,
  MIME_TYPE_OPTIONS,
  SUPPORTED_LANGUAGES,
} from "@/app/template-designer/constants";
import {
  createNotificationSubscription,
  createNotificationTemplate,
  deleteNotificationSubscription,
  deleteNotificationTemplate,
  getChannels,
  getNotificationSubscriptions,
  getNotificationTemplates,
  getNotificationTypes,
  saveNotificationTemplateData,
  toNotificationTemplatePayload,
  updateNotificationSubscription,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";
import {
  Channel,
  NotificationSubscription,
  NotificationTemplateMetadata,
  NotificationType,
} from "@/app/communications/templates/types";
import styles from "./CommunicationTemplateManager.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import ThreeDotMenuHorizontalIcon from "@/app/components/SVGIcons/ThreeDotMenuHorizontal";
import InlineLoaderIcon from "@/app/components/InternalComponents/InlineLoader/InlineLoader";

const buildDefaultCommunicationTemplateContent = (
  language: string,
) => `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>\${title}</title>
</head>
<body>
  <p>Start editing..</p>
</body>
</html>`;

type PaneMode = "create" | "edit";

interface SubscriptionFormPaneProps {
  mode: PaneMode;
  isOpen: boolean;
  typeCode: string;
  channels: Channel[];
  subscription?: NotificationSubscription | null;
  onClose: () => void;
  onSubmit: (payload: NotificationSubscription) => Promise<void>;
}

interface TemplateFormPaneProps {
  mode: PaneMode;
  isOpen: boolean;
  template?: NotificationTemplateMetadata | null;
  showVendorTemplateId: boolean;
  onClose: () => void;
  onSubmit: (
    payload: Omit<NotificationTemplateMetadata, "id" | "subscriptionKey">,
  ) => Promise<void>;
}

const getTemplateDisplayName = (template: NotificationTemplateMetadata) =>
  template.templateName || `Template ${template.id}`;

const getTypeTitle = (type: NotificationType) => type.description || type.code;

const getSubscriptionTitle = (subscription: NotificationSubscription) =>
  subscription.desc || subscription.subscriptionKey;

const WHATSAPP_CHANNEL_CODE = "WHATSAPP";
const EMAIL_CHANNEL_CODE = "EMAIL";
const SMS_CHANNEL_CODE = "SMS";

const WHATSAPP_TEMPLATES_EXTERNAL_MESSAGE =
  "WhatsApp templates are managed externally. The template designer is not available for this channel.";

const WHATSAPP_TEMPLATE_CREATED_MESSAGE =
  "WhatsApp template metadata created. Template content is managed externally.";

const getLanguageLabel = (code?: string) => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === code);
  if (!lang) return code?.toUpperCase() ?? "Unknown";
  return lang.nativeName && lang.nativeName !== lang.label
    ? `${lang.nativeName} (${lang.label})`
    : lang.label;
};

const getTemplateBadges = (template: NotificationTemplateMetadata) =>
  [
    getLanguageLabel(template.language),
    template.templateMimeType,
    template.primary ? "Primary" : "",
  ].filter(Boolean);

interface CardActionMenuProps {
  menuKey: string;
  label: string;
  openMenuKey: string | null;
  onOpenMenuChange: (menuKey: string | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

const CardActionMenu = ({
  menuKey,
  label,
  openMenuKey,
  onOpenMenuChange,
  isLoading = false,
  disabled = false,
  children,
}: CardActionMenuProps) => {
  const isOpen = openMenuKey === menuKey;

  return (
    <span className={styles.actionMenu} data-card-action-menu>
      {isLoading ? (
        <span className={styles.actionLoader} aria-label="Opening template">
          <InlineLoaderIcon id="opening-template-loader" />
        </span>
      ) : (
        <button
          type="button"
          className={`${sharedStyles.iconButton} ${sharedStyles.small} ${sharedStyles.smallHeightSvg}`}
          title={label}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            onOpenMenuChange(isOpen ? null : menuKey);
          }}
        >
          <ThreeDotMenuHorizontalIcon />
        </button>
      )}
      {isOpen && (
        <span className={styles.actionMenuList} role="menu">
          {children}
        </span>
      )}
    </span>
  );
};

const SubscriptionFormPane = ({
  mode,
  isOpen,
  typeCode,
  channels,
  subscription,
  onClose,
  onSubmit,
}: SubscriptionFormPaneProps) => {
  const isEdit = mode === "edit";
  const [subscriptionKey, setSubscriptionKey] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubscriptionKey(subscription?.subscriptionKey ?? "");
    setDesc(subscription?.desc ?? "");
    setChannelCode(
      subscription?.notificationChannelCode ?? channels[0]?.code ?? "",
    );
    setError(null);
  }, [isOpen, subscription, channels]);

  const isValid =
    subscriptionKey.trim().length > 0 &&
    desc.trim().length > 0 &&
    channelCode.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        subscriptionKey: subscriptionKey.trim(),
        desc: desc.trim(),
        notificationChannelCode: channelCode,
        notificationTypeCode: typeCode,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <FormPaneFooter
      onCancel={onClose}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      isValid={isValid}
      submitLabel={isEdit ? "Update" : "Create"}
      submittingLabel={isEdit ? "Updating..." : "Creating..."}
    />
  );

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Update Subscription" : "Create Subscription"}
      minWidth={420}
      paneFooter={footer}
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label htmlFor="subscription-key">Subscription Key*</label>
          <input
            id="subscription-key"
            value={subscriptionKey}
            onChange={(e) => setSubscriptionKey(e.target.value)}
            disabled={isEdit || submitting}
            placeholder="WELCOME_EMAIL"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="subscription-desc">Description*</label>
          <textarea
            id="subscription-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={submitting}
            placeholder="Describe this subscription"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="subscription-channel">Channel*</label>
          <SelectDropdown
            id="subscription-channel"
            options={channels.map((channel) => ({
              value: channel.code,
              label: channel.desc
                ? `${channel.code} - ${channel.desc}`
                : channel.code,
            }))}
            value={channelCode}
            onChange={setChannelCode}
            disabled={submitting}
            placeholder="Select channel"
          />
        </div>
      </form>
    </Pane>
  );
};

const TemplateFormPane = ({
  mode,
  isOpen,
  template,
  showVendorTemplateId,
  onClose,
  onSubmit,
}: TemplateFormPaneProps) => {
  const isEdit = mode === "edit";
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateMimeType, setTemplateMimeType] = useState("text/html");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [vendorTemplateId, setVendorTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTemplateName(template?.templateName ?? "");
    setSubject(template?.subject ?? "");
    setTemplateMimeType(template?.templateMimeType ?? "text/html");
    setLanguage(template?.language ?? DEFAULT_LANGUAGE);
    setVendorTemplateId(template?.vendorTemplateId ?? "");
    setError(null);
  }, [isOpen, template]);

  const isValid =
    templateName.trim().length > 0 &&
    templateMimeType.trim().length > 0 &&
    language.trim().length > 0;

  const handleMimeTypeChange = (value: string) => {
    setTemplateMimeType(value);
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Omit<
        NotificationTemplateMetadata,
        "id" | "subscriptionKey"
      > = {
        templateName: templateName.trim(),
        subject: subject.trim(),
        templateMimeType,
        language,
        primary: template?.primary ?? false,
        templateContentId: template?.templateContentId,
      };

      if (showVendorTemplateId) {
        payload.vendorTemplateId = vendorTemplateId.trim() || undefined;
      }

      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <FormPaneFooter
      onCancel={onClose}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      isValid={isValid}
      submitLabel={isEdit ? "Update" : "Create"}
      submittingLabel={isEdit ? "Updating..." : "Creating..."}
    />
  );

  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.value,
    label: `${lang.label} (${lang.nativeName})`,
  }));

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Update Template" : "Create Template"}
      minWidth={440}
      paneFooter={footer}
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {error && <div className={styles.formError}>{error}</div>}
        <div className={styles.field}>
          <label htmlFor="communication-template-name">Template Name*</label>
          <input
            id="communication-template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={submitting}
            placeholder="Welcome Email"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="communication-template-subject">Subject</label>
          <input
            id="communication-template-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
            placeholder="Welcome"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="communication-template-mime">MIME Type*</label>
          <SelectDropdown
            id="communication-template-mime"
            options={MIME_TYPE_OPTIONS}
            value={templateMimeType}
            onChange={handleMimeTypeChange}
            disabled={submitting}
            showSearch={false}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="communication-template-language">Language*</label>
          <SelectDropdown
            id="communication-template-language"
            options={languageOptions}
            value={language}
            onChange={setLanguage}
            disabled={submitting}
          />
        </div>
        {showVendorTemplateId && (
          <div className={styles.field}>
            <label htmlFor="communication-template-vendor-id">
              Vendor Template ID
            </label>
            <input
              id="communication-template-vendor-id"
              value={vendorTemplateId}
              onChange={(e) => setVendorTemplateId(e.target.value)}
              disabled={submitting}
              placeholder="Optional"
            />
          </div>
        )}
      </form>
    </Pane>
  );
};

const CommunicationTemplateManager = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserNotification } = useHeaderV2();

  const initialTypeRef = useRef(searchParams.get("type"));
  const initialSubscriptionKeyRef = useRef(searchParams.get("subscriptionKey"));

  const [types, setTypes] = useState<NotificationType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    NotificationSubscription[]
  >([]);
  const [templates, setTemplates] = useState<NotificationTemplateMetadata[]>(
    [],
  );
  const [selectedTypeCode, setSelectedTypeCode] = useState<string | null>(null);
  const [selectedSubscriptionKey, setSelectedSubscriptionKey] = useState<
    string | null
  >(null);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPaneMode, setSubscriptionPaneMode] =
    useState<PaneMode>("create");
  const [templatePaneMode, setTemplatePaneMode] = useState<PaneMode>("create");
  const [isSubscriptionPaneOpen, setIsSubscriptionPaneOpen] = useState(false);
  const [isTemplatePaneOpen, setIsTemplatePaneOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<NotificationSubscription | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplateMetadata | null>(null);
  const [primarySavingId, setPrimarySavingId] = useState<number | null>(null);
  const [openingTemplateId, setOpeningTemplateId] = useState<number | null>(
    null,
  );
  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(
    null,
  );
  const isOpeningTemplate = openingTemplateId !== null;

  const getSubscriptionByKey = useCallback(
    (subscriptionKey: string | null) => {
      if (!subscriptionKey) return null;
      return (
        subscriptions.find(
          (subscription) => subscription.subscriptionKey === subscriptionKey,
        ) ?? null
      );
    },
    [subscriptions],
  );

  const isWhatsAppSubscription = useCallback(
    (subscriptionKey: string | null) => {
      const channelCode =
        getSubscriptionByKey(subscriptionKey)?.notificationChannelCode;
      return channelCode?.trim().toUpperCase() === WHATSAPP_CHANNEL_CODE;
    },
    [getSubscriptionByKey],
  );

  const shouldShowVendorTemplateId = useCallback(
    (subscriptionKey: string | null) => {
      const channelCode =
        getSubscriptionByKey(subscriptionKey)?.notificationChannelCode;
      const normalizedChannelCode = channelCode?.trim().toUpperCase();

      return (
        normalizedChannelCode !== EMAIL_CHANNEL_CODE &&
        normalizedChannelCode !== SMS_CHANNEL_CODE
      );
    },
    [getSubscriptionByKey],
  );

  const replaceSelectionQuery = useCallback(
    (typeCode: string | null, subscriptionKey: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (typeCode) params.set("type", typeCode);
      else params.delete("type");
      if (subscriptionKey) params.set("subscriptionKey", subscriptionKey);
      else params.delete("subscriptionKey");
      const query = params.toString();
      router.replace(
        query
          ? `/communications/templates?${query}`
          : "/communications/templates",
      );
    },
    [router, searchParams],
  );

  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      setLoadingTypes(true);
      setError(null);
      try {
        const [typeList, channelList] = await Promise.all([
          getNotificationTypes(),
          getChannels(),
        ]);
        if (!mounted) return;
        setTypes(typeList ?? []);
        setChannels(channelList ?? []);
        const nextType =
          typeList.find((type) => type.code === initialTypeRef.current)?.code ??
          null;
        setSelectedTypeCode(nextType);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load data");
        }
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    };

    void loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTypeCode) {
      setSubscriptions([]);
      setSelectedSubscriptionKey(null);
      return;
    }

    let mounted = true;
    const loadSubscriptions = async () => {
      setLoadingSubscriptions(true);
      setTemplates([]);
      setError(null);
      try {
        const result = await getNotificationSubscriptions(selectedTypeCode);
        if (!mounted) return;
        setSubscriptions(result ?? []);
        const matchingInitialSubscription = result.find(
          (subscription) =>
            subscription.subscriptionKey === initialSubscriptionKeyRef.current,
        )?.subscriptionKey;
        const nextSubscription =
          matchingInitialSubscription ??
          (result.length === 1 ? (result[0]?.subscriptionKey ?? null) : null);
        initialSubscriptionKeyRef.current = null;
        setSelectedSubscriptionKey(nextSubscription);
      } catch (e) {
        if (mounted) {
          setError(
            e instanceof Error ? e.message : "Failed to load subscriptions",
          );
        }
      } finally {
        if (mounted) setLoadingSubscriptions(false);
      }
    };

    void loadSubscriptions();
    return () => {
      mounted = false;
    };
  }, [selectedTypeCode]);

  const loadTemplates = useCallback(
    async (typeCode: string, subscriptionKey: string) => {
      setLoadingTemplates(true);
      setTemplates([]);
      setError(null);
      try {
        const result = await getNotificationTemplates(
          typeCode,
          subscriptionKey,
        );
        setTemplates(
          (result ?? []).filter(
            (template) =>
              !template.subscriptionKey ||
              template.subscriptionKey === subscriptionKey,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load templates");
      } finally {
        setLoadingTemplates(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedTypeCode || !selectedSubscriptionKey) {
      setTemplates([]);
      return;
    }
    void loadTemplates(selectedTypeCode, selectedSubscriptionKey);
  }, [selectedTypeCode, selectedSubscriptionKey, loadTemplates]);

  useEffect(() => {
    if (!openActionMenuKey) return undefined;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-card-action-menu]")
      ) {
        return;
      }
      setOpenActionMenuKey(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenActionMenuKey(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openActionMenuKey]);

  const handleSelectType = (typeCode: string) => {
    if (isOpeningTemplate) return;
    initialSubscriptionKeyRef.current = null;
    setSelectedTypeCode(typeCode);
    setSelectedSubscriptionKey(null);
    setTemplates([]);
    replaceSelectionQuery(typeCode, null);
  };

  const handleSelectSubscription = (subscriptionKey: string) => {
    if (isOpeningTemplate) return;
    if (subscriptionKey === selectedSubscriptionKey) {
      if (selectedTypeCode)
        void loadTemplates(selectedTypeCode, subscriptionKey);
      return;
    }
    setSelectedSubscriptionKey(subscriptionKey);
    setTemplates([]);
    replaceSelectionQuery(selectedTypeCode, subscriptionKey);
  };

  const openCreateSubscription = () => {
    if (isOpeningTemplate) return;
    setSubscriptionPaneMode("create");
    setEditingSubscription(null);
    setIsSubscriptionPaneOpen(true);
  };

  const openEditSubscription = (subscription: NotificationSubscription) => {
    if (isOpeningTemplate) return;
    setSubscriptionPaneMode("edit");
    setEditingSubscription(subscription);
    setIsSubscriptionPaneOpen(true);
  };

  const openCreateTemplate = () => {
    if (isOpeningTemplate) return;
    setTemplatePaneMode("create");
    setEditingTemplate(null);
    setIsTemplatePaneOpen(true);
  };

  const openEditTemplate = (template: NotificationTemplateMetadata) => {
    if (isOpeningTemplate) return;
    setTemplatePaneMode("edit");
    setEditingTemplate(template);
    setIsTemplatePaneOpen(true);
  };

  const handleSubscriptionSubmit = async (
    payload: NotificationSubscription,
  ) => {
    if (!selectedTypeCode) return;
    const saved =
      subscriptionPaneMode === "edit"
        ? await updateNotificationSubscription(
            selectedTypeCode,
            payload.subscriptionKey,
            payload,
          )
        : await createNotificationSubscription(selectedTypeCode, payload);

    setSubscriptions((prev) => {
      const exists = prev.some(
        (item) => item.subscriptionKey === saved.subscriptionKey,
      );
      if (exists) {
        return prev.map((item) =>
          item.subscriptionKey === saved.subscriptionKey ? saved : item,
        );
      }
      return [...prev, saved];
    });
    setSelectedSubscriptionKey(saved.subscriptionKey);
    replaceSelectionQuery(selectedTypeCode, saved.subscriptionKey);
    setUserNotification({
      type: "success",
      text:
        subscriptionPaneMode === "edit"
          ? "Subscription updated"
          : "Subscription created",
      time: 2000,
    });
  };

  const handleDeleteSubscription = async (
    subscription: NotificationSubscription,
  ) => {
    if (!selectedTypeCode) return;
    if (
      !window.confirm(`Delete subscription ${subscription.subscriptionKey}?`)
    ) {
      return;
    }
    try {
      await deleteNotificationSubscription(
        selectedTypeCode,
        subscription.subscriptionKey,
      );
      setSubscriptions((prev) =>
        prev.filter(
          (item) => item.subscriptionKey !== subscription.subscriptionKey,
        ),
      );
      if (selectedSubscriptionKey === subscription.subscriptionKey) {
        setSelectedSubscriptionKey(null);
        setTemplates([]);
        replaceSelectionQuery(selectedTypeCode, null);
      }
      setUserNotification({
        type: "success",
        text: "Subscription deleted",
        time: 2000,
      });
    } catch (e) {
      setUserNotification({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete subscription",
        time: 3000,
      });
    }
  };

  const handleTemplateSubmit = async (
    payload: Omit<NotificationTemplateMetadata, "id" | "subscriptionKey">,
  ) => {
    if (!selectedTypeCode || !selectedSubscriptionKey) return;
    const isWhatsApp = isWhatsAppSubscription(selectedSubscriptionKey);

    if (templatePaneMode === "edit" && editingTemplate) {
      const subscriptionKey =
        editingTemplate.subscriptionKey || selectedSubscriptionKey;
      const updatePayload = {
        templateName: payload.templateName,
        subject: payload.subject,
        templateMimeType: payload.templateMimeType,
        language: payload.language,
        primary: editingTemplate.primary,
        ...(shouldShowVendorTemplateId(subscriptionKey)
          ? { vendorTemplateId: payload.vendorTemplateId }
          : {}),
      };
      const saved = await updateNotificationTemplate(
        selectedTypeCode,
        subscriptionKey,
        editingTemplate.id,
        updatePayload,
      );
      setTemplates((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item)),
      );
      setUserNotification({
        type: "success",
        text: "Template updated",
        time: 2000,
      });
      return;
    }

    const createPayload = {
      templateName: payload.templateName,
      subject: payload.subject,
      templateMimeType: payload.templateMimeType,
      language: payload.language,
      primary: false,
      ...(shouldShowVendorTemplateId(selectedSubscriptionKey)
        ? { vendorTemplateId: payload.vendorTemplateId }
        : {}),
    };

    const saved = await createNotificationTemplate(
      selectedTypeCode,
      selectedSubscriptionKey,
      createPayload,
    );
    setTemplates((prev) => [...prev, saved]);

    if (isWhatsApp) {
      setUserNotification({
        type: "success",
        text: WHATSAPP_TEMPLATE_CREATED_MESSAGE,
        time: 2000,
      });
      return;
    }

    await saveNotificationTemplateData(
      selectedTypeCode,
      selectedSubscriptionKey,
      saved.id,
      buildDefaultCommunicationTemplateContent(payload.language),
    );
    setUserNotification({
      type: "success",
      text: "Template created",
      time: 2000,
    });
    router.push(
      `/communications/templates/${encodeURIComponent(String(saved.id))}?type=${encodeURIComponent(selectedTypeCode)}&subscriptionKey=${encodeURIComponent(selectedSubscriptionKey)}`,
    );
  };

  const handleDeleteTemplate = async (
    template: NotificationTemplateMetadata,
  ) => {
    const subscriptionKey = template.subscriptionKey || selectedSubscriptionKey;
    if (!selectedTypeCode || !subscriptionKey) return;
    if (
      !window.confirm(`Delete template ${getTemplateDisplayName(template)}?`)
    ) {
      return;
    }
    try {
      await deleteNotificationTemplate(
        selectedTypeCode,
        subscriptionKey,
        template.id,
      );
      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
      setUserNotification({
        type: "success",
        text: "Template deleted",
        time: 2000,
      });
    } catch (e) {
      setUserNotification({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete template",
        time: 3000,
      });
    }
  };

  const handleSetPrimary = async (template: NotificationTemplateMetadata) => {
    const subscriptionKey = template.subscriptionKey || selectedSubscriptionKey;
    if (!selectedTypeCode || !subscriptionKey || template.primary) {
      return;
    }
    setPrimarySavingId(template.id);
    try {
      const saved = await updateNotificationTemplate(
        selectedTypeCode,
        subscriptionKey,
        template.id,
        toNotificationTemplatePayload(template, true),
      );
      setTemplates((prev) =>
        prev.map((item) =>
          item.id === saved.id
            ? saved
            : {
                ...item,
                primary: false,
              },
        ),
      );
      setUserNotification({
        type: "success",
        text: "Primary template updated",
        time: 2000,
      });
    } catch (e) {
      setUserNotification({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to update primary",
        time: 3000,
      });
    } finally {
      setPrimarySavingId(null);
    }
  };

  const openDesigner = (template: NotificationTemplateMetadata) => {
    const subscriptionKey = template.subscriptionKey || selectedSubscriptionKey;
    if (!selectedTypeCode || !subscriptionKey || isOpeningTemplate) return;

    if (isWhatsAppSubscription(subscriptionKey)) {
      setOpenActionMenuKey(null);
      setUserNotification({
        type: "info",
        text: WHATSAPP_TEMPLATES_EXTERNAL_MESSAGE,
        time: 3000,
      });
      return;
    }

    setOpenActionMenuKey(null);
    setOpeningTemplateId(template.id);
    router.push(
      `/communications/templates/${encodeURIComponent(String(template.id))}?type=${encodeURIComponent(selectedTypeCode)}&subscriptionKey=${encodeURIComponent(subscriptionKey)}`,
    );
  };

  const renderTypesContent = () => {
    if (loadingTypes) {
      return (
        <div className={styles.loading}>Loading notification types...</div>
      );
    }
    if (types.length === 0) {
      return <div className={styles.empty}>No notification types found.</div>;
    }
    return types.map((type) => (
      <div
        key={type.code}
        role="button"
        tabIndex={0}
        className={`${styles.card} ${
          selectedTypeCode === type.code ? styles.selected : ""
        }`}
        onClick={() => handleSelectType(type.code)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelectType(type.code);
          }
        }}
      >
        <span className={styles.cardContent}>
          <span className={styles.cardTitle}>{getTypeTitle(type)}</span>
          <span className={styles.cardSubtitle}>{type.code}</span>
        </span>
      </div>
    ));
  };

  const renderSubscriptionsContent = () => {
    if (loadingSubscriptions) {
      return <div className={styles.loading}>Loading subscriptions...</div>;
    }
    if (!selectedTypeCode) {
      return <div className={styles.empty}>Select a notification type.</div>;
    }
    if (subscriptions.length === 0) {
      return <div className={styles.empty}>No subscriptions found.</div>;
    }
    return subscriptions.map((subscription) => (
      <div
        key={subscription.subscriptionKey}
        role="button"
        tabIndex={0}
        className={`${styles.card} ${
          selectedSubscriptionKey === subscription.subscriptionKey
            ? styles.selected
            : ""
        }`}
        onClick={() => handleSelectSubscription(subscription.subscriptionKey)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelectSubscription(subscription.subscriptionKey);
          }
        }}
      >
        <span className={styles.cardContent}>
          <span className={styles.cardTitle}>
            {getSubscriptionTitle(subscription)}
          </span>
          <span className={styles.cardSubtitle}>
            {subscription.subscriptionKey}
          </span>
          <span className={styles.badgeRow}>
            <span className={styles.badge}>
              {subscription.notificationChannelCode}
            </span>
          </span>
        </span>
        <CardActionMenu
          menuKey={`subscription:${subscription.subscriptionKey}`}
          label={`Actions for ${subscription.subscriptionKey}`}
          openMenuKey={openActionMenuKey}
          onOpenMenuChange={setOpenActionMenuKey}
          disabled={isOpeningTemplate}
        >
          <button
            type="button"
            role="menuitem"
            className={styles.actionMenuItem}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuKey(null);
              openEditSubscription(subscription);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.actionMenuItem} ${styles.danger}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuKey(null);
              void handleDeleteSubscription(subscription);
            }}
          >
            Delete
          </button>
        </CardActionMenu>
      </div>
    ));
  };

  const renderTemplatesContent = () => {
    if (loadingTemplates) {
      return <div className={styles.loading}>Loading templates...</div>;
    }
    if (!selectedSubscriptionKey) {
      return <div className={styles.empty}>Select a subscription.</div>;
    }
    if (templates.length === 0) {
      return <div className={styles.empty}>No templates found.</div>;
    }
    return templates.map((template) => (
      <div
        key={template.id}
        role="button"
        tabIndex={0}
        className={`${styles.card} ${
          openingTemplateId === template.id ? styles.openingCard : ""
        }`}
        onClick={() => openDesigner(template)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDesigner(template);
          }
        }}
      >
        <span className={styles.cardContent}>
          <span className={styles.cardTitle}>
            {getTemplateDisplayName(template)}
          </span>
          <span className={styles.badgeRow}>
            {getTemplateBadges(template).map((badge) => (
              <span
                key={badge}
                className={`${styles.badge} ${
                  badge === "Primary" ? styles.primaryBadge : ""
                }`}
              >
                {badge}
              </span>
            ))}
          </span>
        </span>
        <CardActionMenu
          menuKey={`template:${template.id}`}
          label={`Actions for ${getTemplateDisplayName(template)}`}
          openMenuKey={openActionMenuKey}
          onOpenMenuChange={setOpenActionMenuKey}
          isLoading={openingTemplateId === template.id}
          disabled={isOpeningTemplate}
        >
          <button
            type="button"
            role="menuitem"
            className={styles.actionMenuItem}
            disabled={template.primary}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuKey(null);
              void handleSetPrimary(template);
            }}
          >
            {template.primary ? "Primary template" : "Set as primary"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.actionMenuItem}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuKey(null);
              openEditTemplate(template);
            }}
          >
            Edit metadata
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.actionMenuItem} ${styles.danger}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuKey(null);
              void handleDeleteTemplate(template);
            }}
          >
            Delete
          </button>
        </CardActionMenu>
      </div>
    ));
  };

  return (
    <div className={sharedStyles.pageContainer}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.panes}>
        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <div className={styles.paneTitleRow}>
              <div className={styles.paneTitle}>Notification Types</div>
              <span className={styles.countBadge}>{types.length}</span>
            </div>
          </div>
          <div
            className={`${styles.list} ${
              isOpeningTemplate ? styles.optionsFading : ""
            }`}
          >
            {renderTypesContent()}
          </div>
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <div>
              <div className={styles.paneTitle}>Subscriptions</div>
            </div>
            <button
              className={`${sharedStyles.iconButton} ${sharedStyles.smallSvg}`}
              onClick={openCreateSubscription}
              disabled={!selectedTypeCode || isOpeningTemplate}
              title="Create subscription"
              aria-label="Create subscription"
            >
              <PlusIcon />
            </button>
          </div>
          <div
            className={`${styles.list} ${
              isOpeningTemplate ? styles.optionsFading : ""
            }`}
          >
            {renderSubscriptionsContent()}
          </div>
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <div>
              <div className={styles.paneTitle}>Templates</div>
            </div>
            <button
              className={`${sharedStyles.iconButton} ${sharedStyles.smallSvg}`}
              onClick={openCreateTemplate}
              disabled={!selectedSubscriptionKey || isOpeningTemplate}
              title="Create template"
              aria-label="Create template"
            >
              <PlusIcon />
            </button>
          </div>
          <div
            className={`${styles.list} ${
              isOpeningTemplate ? styles.optionsFading : ""
            }`}
          >
            {renderTemplatesContent()}
          </div>
        </section>
      </div>

      <SubscriptionFormPane
        mode={subscriptionPaneMode}
        isOpen={isSubscriptionPaneOpen}
        typeCode={selectedTypeCode ?? ""}
        channels={channels}
        subscription={editingSubscription}
        onClose={() => setIsSubscriptionPaneOpen(false)}
        onSubmit={handleSubscriptionSubmit}
      />
      <TemplateFormPane
        mode={templatePaneMode}
        isOpen={isTemplatePaneOpen}
        template={editingTemplate}
        showVendorTemplateId={shouldShowVendorTemplateId(
          editingTemplate?.subscriptionKey ?? selectedSubscriptionKey,
        )}
        onClose={() => setIsTemplatePaneOpen(false)}
        onSubmit={handleTemplateSubmit}
      />
      {primarySavingId && <span hidden>Saving primary {primarySavingId}</span>}
    </div>
  );
};

export default CommunicationTemplateManager;
