import { NextResponse } from "next/server";
import {
  createPage,
  POPUP_DEFAULTS,
} from "../../../../../chat-agent/lib/page-creator";
import { getUserId } from "../../../../../chat-agent/lib/getUserId";
import { logger } from "../../../../../chat-agent/lib/logger";
import { runSkillReflection } from "../../../../../chat-agent/lib/skill-updater";
import { sessionOps } from "../../../../../chat-agent/db/queries/dsl-history";

export async function POST(req: Request) {
  try {
    const { micrositeId, name, isPopup, workspaceCode, description } =
      await req.json();

    if (!micrositeId || !name || !String(name).trim()) {
      return NextResponse.json(
        { error: "micrositeId and a non-empty name are required." },
        { status: 400 },
      );
    }

    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");
    const userId = getUserId(req);

    const result = await createPage({
      micrositeId,
      name,
      description: description ?? "",
      isPopup: Boolean(isPopup),
      auth: {
        authHeader,
        cookieHeader,
        userIdHeader,
        userId,
        workspaceCode: workspaceCode ?? null,
      },
    });

    // Feeds the agent's "Recent changes" memory (chat history isn't resent).
    try {
      await sessionOps.appendOp(userId, micrositeId, result.pageCode, {
        summary: `Created page "${result.name}"${result.isPopup ? " as a popup" : ""}`,
        outcome: "created",
      });
    } catch (e) {
      logger.warn("Failed to append op for page creation", {
        error: (e as Error).message,
      });
    }

    if (result.isPopup) {
      const patchApplied = Object.keys(POPUP_DEFAULTS).map((k) => ({
        op: "add" as const,
        path: `/properties/${k}`,
        value: (POPUP_DEFAULTS as Record<string, unknown>)[k],
      }));
      const patchedDsl = {
        id: result.pageCode,
        type: "page",
        properties: { ...POPUP_DEFAULTS },
      };
      void runSkillReflection({
        userRequest: `Create page "${result.name}" as a popup`,
        patchApplied,
        patchedDsl,
        sourcePatchId: `page-create:${result.pageCode}`,
      }).catch((e) =>
        logger.error("page-create skill reflection failed", {
          error: (e as Error).message,
        }),
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Page creation failed", { error: (error as Error).message });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
