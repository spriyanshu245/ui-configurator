import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { skillEntries } from "../../../../chat-agent/db/queries/skill-entries";
import { logger } from "../../../../chat-agent/lib/logger";

export async function GET() {
  try {
    const skillPath = path.join(
      process.cwd(),
      "chat-agent/knowledge/agentSkill.md",
    );

    let content = "";
    try {
      if (fs.existsSync(skillPath)) {
        content = fs.readFileSync(skillPath, "utf-8");
      } else {
        content = "# No knowledge base compiled yet.";
      }
    } catch (e) {
      logger.error("Failed to read agentSkill.md", { error: (e as Error).message });
      content = "# No knowledge base compiled yet.";
    }

    let entries: Awaited<ReturnType<typeof skillEntries.findAll>> = [];
    try {
      entries = await skillEntries.findAll();
    } catch (e) {
      logger.error("Failed to load skill entries", { error: (e as Error).message });
    }

    return NextResponse.json({ content, entries });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
