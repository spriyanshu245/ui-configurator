import {
  extractAddedComponents,
  extractAddedRawNodes,
  type PreviewComponent,
} from "../lib/added-components";
import {
  createParser,
  type ParsedEventLocal,
  type ReconnectIntervalLocal,
} from "../lib/eventsource-parser-wrapper";
import type {
  ChatMessage as ChatMessageType,
  ChatSuggestion,
} from "../types/types";
import {
  classifyAttachment,
  maxBytesFor,
  formatBytes,
  MAX_ATTACHMENTS,
  type AttachmentKind,
  type ClassifiedAttachment,
} from "../lib/attachments";

type ToolCall = {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type PendingPatch = {
  id: string;
  currentDsl: unknown;
  patchedDsl: unknown;
  description?: string;
  previewHint?: string;
};

type PageCreationProposal = {
  micrositeId: string;
  suggestedName: string;
  purpose?: string | null;
};

export type AttachedFile = {
  id: string;
  name: string;
  kind: AttachmentKind; // image | document
  format: string; // png|jpeg|gif|webp for images; pdf|csv|txt|md|... for documents
  size: number; // bytes
  dataBase64: string; // raw base64 (no data: prefix)
  previewUrl?: string; // data: URL for image thumbnail rendering (images only)
};

type ProposedRollback = {
  historyId: string;
  micrositeId: string;
  pagePath: string;
  description?: string;
  createdAt: string;
  reason?: string;
};

type PendingBatchOperation = {
  pagePath: string;
  description?: string;
  previewHint?: string;
  affectedComponents?: string[];
  currentDsl: unknown;
  patchedDsl: unknown;
  status?: string;
};

type PendingBatch = {
  id: string;
  batchDescription?: string;
  navigateTo?: string | null;
  operations: PendingBatchOperation[];
};

export type ChatPanelMessage = ChatMessageType & {
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  type?:
    | "patch_proposed"
    | "rollback_proposed"
    | "batch_proposed"
    | "page_creation_proposed"
    | "page_map";
  patch?: PendingPatch;
  rollback?: ProposedRollback;
  batch?: PendingBatch;
  pageCreation?: PageCreationProposal;
  pageMap?: unknown;
  _isStatus?: boolean;
  _isStreaming?: boolean;
  _isError?: boolean;
  _retryMessages?: ChatPanelMessage[];
  _changeStatus?: "proposed" | "applied" | "reverted";
  _attachedImageNames?: string[];
};

type RouteMessage = Pick<
  ChatPanelMessage,
  "role" | "content" | "name" | "tool_call_id" | "tool_calls"
>;

export type PreviewData = {
  title: string;
  subtitle?: string;
  components: PreviewComponent[];
  rawNodes: Record<string, any>[];
};

type SseEventData = {
  type?: string;
  content?: string;
  patch?: PendingPatch;
  rollback?: ProposedRollback;
  batch?: PendingBatch;
  tool_call_id?: string;
  message?: string;
  messages?: Partial<ChatPanelMessage>[];
  pageCode?: string;
  reason?: string | null;
  micrositeId?: string;
  suggestedName?: string;
  purpose?: string | null;
  pageMap?: unknown;
  suggestions?: ChatSuggestion[];
};

// Static starter prompts shown on the empty state (hybrid pills: these seed the
// conversation; the agent emits contextual "next actions" via suggest_next_actions).
export const STARTER_SUGGESTIONS: ChatSuggestion[] = [
  { id: "starter-explain", label: "Explain this page", value: "Explain what this page does and list its main components." },
  { id: "starter-form", label: "Add a form", value: "Add a form with a few input fields to this page." },
  { id: "starter-table", label: "Add a table", value: "Add a table to display a list of records on this page." },
  { id: "starter-page", label: "Create a page", value: "Create a new page in this microsite." },
];

export const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Build the identity headers the backend expects, mirroring the app's shared
 * APIService: an `Authorization: Bearer` token plus an `x-user-id` resolved from
 * `global.login.userDetails`. The backend rejects config PUTs with a
 * ContextException ("Failed to get User Id from context") when x-user-id is
 * absent, so every approve/reject/rollback request must forward it — the server
 * route relays these headers on to the backend PUT.
 */
export const buildAuthHeaders = (
  base: Record<string, string> = {},
): Record<string, string> => {
  const headers: Record<string, string> = { ...base };
  try {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const rawDetails = sessionStorage.getItem("global.login.userDetails");
    const userId = rawDetails ? JSON.parse(rawDetails)?.userId : undefined;
    if (userId !== undefined && userId !== null && `${userId}` !== "") {
      headers["x-user-id"] = `${userId}`;
    }
  } catch {
    // sessionStorage/JSON access can throw in some contexts — send whatever we have.
  }
  return headers;
};

/** POST a JSON body with the shared auth headers; resolves the parsed response. */
export const postJson = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
};

/** Server error string when present, otherwise the supplied fallback. */
export const errorText = (data: any, fallback: string): string =>
  typeof data?.error === "string" ? data.error : fallback;

export const errorMessageOf = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const createMessage = (
  message: Omit<ChatPanelMessage, "id">,
): ChatPanelMessage => ({
  id: createMessageId(),
  ...message,
});

export const withoutStatusMessages = (messages: ChatPanelMessage[]) =>
  messages.filter((message) => !message._isStatus);

const normalizeIncomingMessage = (
  message: Partial<ChatPanelMessage>,
): ChatPanelMessage =>
  createMessage({
    role: message.role ?? "assistant",
    content: typeof message.content === "string" ? message.content : "",
    name: message.name,
    tool_call_id: message.tool_call_id,
    tool_calls: message.tool_calls,
  });

const replaceAssistantMessage = (
  currentMessages: ChatPanelMessage[],
  assistantMessage: ChatPanelMessage,
) => {
  const nextMessages = [...currentMessages];

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index].role === "assistant") {
      nextMessages[index] = {
        ...nextMessages[index],
        ...assistantMessage,
        id: nextMessages[index].id,
      };
      return nextMessages;
    }
  }

  return nextMessages;
};

export const toRouteMessages = (messages: ChatPanelMessage[]): RouteMessage[] =>
  messages.map(({ role, content, name, tool_call_id, tool_calls }) => ({
    role,
    content,
    name,
    tool_call_id,
    tool_calls,
  }));

export const buildChatRequestBody = (args: {
  messages: ChatPanelMessage[];
  micrositeId: string;
  activePageCode?: string;
  sessionId: string;
  clientSessionId: string;
  workspaceCode?: string;
  taskContext?: Record<string, any>;
  pageOps?: Record<string, any[]>;
  files?: AttachedFile[];
}) =>
  JSON.stringify({
    messages: toRouteMessages(args.messages),
    micrositeId: args.micrositeId,
    pageCode: args.activePageCode,
    id: args.activePageCode,
    sessionId: args.sessionId,
    clientSessionId: args.clientSessionId,
    workspaceCode: args.workspaceCode,
    taskContext: args.taskContext,
    pageOps: args.pageOps,
    attachments: args.files?.length
      ? args.files.map((f) => ({
          kind: f.kind,
          format: f.format,
          name: f.name,
          dataBase64: f.dataBase64,
        }))
      : undefined,
  });

/** Human-readable reason for a non-2xx chat response. */
export const describeFailedResponse = async (
  response: Response,
): Promise<string> => {
  const errData = await response.json().catch(() => null);
  return (
    errData?.message ||
    errData?.error ||
    `Chat request failed with status ${response.status}.`
  );
};

/** Text shown as the user's bubble when they send attachments without typing. */
export const attachmentOnlyContent = (files: AttachedFile[]): string => {
  const plural = files.length > 1;
  return files.some((f) => f.kind === "image")
    ? `Configure this page to match the attached ${plural ? "designs" : "design"}.`
    : `Use the attached file${plural ? "s" : ""} as input.`;
};

export const inputPlaceholder = (
  isLoading: boolean,
  hasMicrosite: boolean,
  hasFiles: boolean,
): string => {
  if (isLoading) return "Waiting for the agent to respond...";
  if (!hasMicrosite) return "Open a microsite configurator page to start chatting...";
  return hasFiles
    ? "Describe what to do with the attached file(s)..."
    : "Ask me to modify the layout, or attach files...";
};

/** Preview-panel contents for a patch/batch proposal message. */
export const buildPreviewData = (message: ChatPanelMessage): PreviewData => {
  let components: PreviewComponent[] = [];
  let rawNodes: Record<string, any>[] = [];
  let subtitle: string | undefined;
  if (message.type === "patch_proposed" && message.patch) {
    components = extractAddedComponents((message.patch as any).patch);
    rawNodes = extractAddedRawNodes((message.patch as any).patch);
    subtitle = message.patch.description;
  } else if (message.type === "batch_proposed" && message.batch) {
    for (const op of (message.batch.operations ?? []) as any[]) {
      components = components.concat(extractAddedComponents(op.patch));
      rawNodes = rawNodes.concat(extractAddedRawNodes(op.patch));
    }
    subtitle = message.batch.batchDescription;
  }
  // Short, stable header title; the (possibly long) change description rides
  // along as a truncated subtitle so the header never overflows.
  const count = components.length;
  const title =
    count > 0 ? `Preview · ${count} component${count > 1 ? "s" : ""}` : "Preview";
  return { title, subtitle, components, rawNodes };
};

/** Assistant-message fields for a proposal-style SSE event, or null if not one. */
const proposalUpdate = (
  data: SseEventData,
  micrositeId: string,
): Partial<ChatPanelMessage> | null => {
  const base = { tool_call_id: data.tool_call_id, _isStreaming: false };
  switch (data.type) {
    case "patch_proposed":
      return data.patch
        ? { ...base, type: "patch_proposed", patch: data.patch, _changeStatus: "proposed" }
        : null;
    case "batch_proposed":
      return data.batch
        ? { ...base, type: "batch_proposed", batch: data.batch, _changeStatus: "proposed" }
        : null;
    case "rollback_proposed":
      return data.rollback
        ? { ...base, type: "rollback_proposed", rollback: data.rollback, _changeStatus: "proposed" }
        : null;
    case "page_creation_proposed":
      return typeof data.suggestedName === "string"
        ? {
            ...base,
            type: "page_creation_proposed",
            pageCreation: {
              micrositeId: data.micrositeId ?? micrositeId,
              suggestedName: data.suggestedName,
              purpose: data.purpose ?? null,
            },
          }
        : null;
    case "page_map":
      return data.pageMap ? { ...base, type: "page_map", pageMap: data.pageMap } : null;
    default:
      return null;
  }
};

type StreamSessionContext = {
  currentMessages: ChatPanelMessage[];
  micrositeId: string;
  setMessages: (messages: ChatPanelMessage[]) => void;
  setSuggestions: (suggestions: ChatSuggestion[]) => void;
  setActivePage: (pageCode: string) => void;
  addStatusMessage: (content: string) => void;
  appendErrorMessage: (content: string, retry?: ChatPanelMessage[]) => void;
};

/**
 * Stateful SSE consumer for one agent turn: tracks the streaming assistant
 * message (and any server-synced history) and pushes updates to React state.
 */
export const createStreamSession = (ctx: StreamSessionContext) => {
  let syncedMessages = [...ctx.currentMessages];
  let hasSyncedMessages = false;
  let assistantMessage = createMessage({
    role: "assistant",
    content: "",
    _isStreaming: true,
  });

  const publish = () =>
    ctx.setMessages(
      hasSyncedMessages
        ? replaceAssistantMessage(syncedMessages, assistantMessage)
        : [...syncedMessages, assistantMessage],
    );

  const updateAssistant = (update: Partial<ChatPanelMessage>) => {
    assistantMessage = { ...assistantMessage, ...update };
    publish();
  };

  const handleNavigate = (data: SseEventData) => {
    if (!data.pageCode) return;
    // Agent-driven, non-destructive UI navigation.
    ctx.setActivePage(data.pageCode);
    ctx.addStatusMessage(
      data.reason
        ? `Navigated to "${data.pageCode}" — ${data.reason}`
        : `Navigated to "${data.pageCode}".`,
    );
  };

  const handleData = (data: SseEventData) => {
    switch (data.type) {
      case "text_chunk":
        if (typeof data.content === "string") {
          updateAssistant({ content: assistantMessage.content + data.content });
        }
        return;
      case "navigate":
        handleNavigate(data);
        return;
      case "suggestions":
        if (Array.isArray(data.suggestions)) ctx.setSuggestions(data.suggestions);
        return;
      case "sync_messages":
        if (Array.isArray(data.messages)) {
          hasSyncedMessages = true;
          syncedMessages = data.messages.map(normalizeIncomingMessage);
          ctx.setMessages(syncedMessages);
        }
        return;
      case "error":
        if (typeof data.message === "string") {
          ctx.appendErrorMessage(data.message, ctx.currentMessages);
        }
        return;
      default: {
        const update = proposalUpdate(data, ctx.micrositeId);
        if (update) updateAssistant(update);
      }
    }
  };

  const handleEvent = (event: ParsedEventLocal | ReconnectIntervalLocal) => {
    if (event.type !== "event") return;
    try {
      handleData(JSON.parse(event.data) as SseEventData);
    } catch (error) {
      console.error("Error parsing SSE event data", error);
    }
  };

  return {
    /** Show the empty streaming bubble. */
    start: publish,
    /** Pump an SSE body to completion through the parser. */
    consume: async (body: ReadableStream<Uint8Array>) => {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      const parser = createParser(handleEvent);
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value));
      }
    },
  };
};

/** Resize the panel by dragging its left edge; width is clamped to [320, 1200]. */
export const clampPanelWidth = (clientX: number, viewportWidth: number) => {
  const next = viewportWidth - clientX;
  return next >= 320 && next <= 1200 ? next : null;
};

/** Validate a picked file; returns its classification or a user-facing rejection note. */
export const checkAttachment = (
  file: File,
): { classified: ClassifiedAttachment } | { error: string } => {
  const classified = classifyAttachment(file.type, file.name);
  if (!classified) {
    return {
      error: `"${file.name}" is not a supported file type (images, PDF, CSV, HTML, Word/Excel, or text/code files).`,
    };
  }
  const limit = maxBytesFor(classified.kind);
  if (file.size > limit) {
    return {
      error: `"${file.name}" is too large (max ${formatBytes(limit)} for ${classified.kind}s).`,
    };
  }
  return { classified };
};

export const tooManyFilesNote = (fileName: string) =>
  `You can attach up to ${MAX_ATTACHMENTS} files at a time. "${fileName}" was skipped.`;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Read a validated file into the base64 shape the chat route expects. */
export const toAttachedFile = async (
  file: File,
  classified: ClassifiedAttachment,
): Promise<AttachedFile> => {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: createMessageId(),
    name: file.name,
    kind: classified.kind,
    format: classified.format,
    size: file.size,
    dataBase64: dataUrl.split(",")[1] ?? "",
    previewUrl: classified.kind === "image" ? dataUrl : undefined,
  };
};
