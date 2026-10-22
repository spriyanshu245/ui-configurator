import { db } from "../client";

export type StoredAttachmentKind = "dsl" | "json" | "text" | "image" | "binary";

export interface ChatAttachment {
  handle: string;
  userId: string;
  micrositeId?: string;
  sessionId?: string;
  name: string;
  format: string;
  kind: StoredAttachmentKind;
  size: number;
  sha256: string;
  /** Raw text for dsl/json/text kinds (parsed on read — DSL keys may contain "$" or "."). */
  text?: string;
  /** Raw bytes for image/binary kinds. */
  dataBase64?: string;
  /** One-line description shown to the model (e.g. component counts). */
  summary?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

export type AttachmentListing = Pick<
  ChatAttachment,
  "handle" | "name" | "kind" | "size" | "summary" | "createdAt"
>;

const COLLECTION = "chat_attachments";

export const chatAttachmentsOps = {
  /** Insert or refresh (same handle = same content for the same user/microsite). */
  save: async (doc: Omit<ChatAttachment, "createdAt" | "lastUsedAt">) => {
    const now = new Date();
    await db.collection(COLLECTION).updateOne(
      { handle: doc.handle },
      {
        $set: { ...doc, lastUsedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  },

  getByHandle: async (handle: string, micrositeId?: string) => {
    const filter: Record<string, unknown> = { handle };
    if (micrositeId) filter.micrositeId = micrositeId;
    const doc = await db
      .collection(COLLECTION)
      .findOneAndUpdate(filter, { $set: { lastUsedAt: new Date() } }, { returnDocument: "after" });
    return (doc as unknown as ChatAttachment | null) ?? null;
  },

  /** Attachments of a session (no bodies), oldest first. */
  listForSession: async (sessionId: string, limit = 20): Promise<AttachmentListing[]> => {
    if (!sessionId) return [];
    return db
      .collection(COLLECTION)
      .find<AttachmentListing>(
        { sessionId },
        { projection: { _id: 0, handle: 1, name: 1, kind: 1, size: 1, summary: 1, createdAt: 1 } },
      )
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  },
};
