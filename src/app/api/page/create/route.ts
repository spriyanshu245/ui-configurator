import { NextResponse } from "next/server";
import { createPage } from "../../../../../chat-agent/lib/page-creator";
import { getUserId } from "../../../../../chat-agent/lib/getUserId";
import { logger } from "../../../../../chat-agent/lib/logger";

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

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Page creation failed", { error: (error as Error).message });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
