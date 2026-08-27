import { skillEntries } from "../db/queries/skill-entries";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

// Cap how many entries render per category, so a runaway category can't
// crowd out everything else in the compiled skill file.
const MAX_PER_CATEGORY = 20;

export async function compileAgentSkill() {
  const entries = await skillEntries.findAll({
    orderBy: { category: "asc", usageCount: "desc" },
  });

  const lines: string[] = [];
  lines.push("# Learned DSL Knowledge (compiled from past sessions)");
  lines.push(`_Compiled on ${new Date().toISOString()} from ${entries.length} entries_`);
  lines.push("---");

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const renderedIds: string[] = [];

  for (const cat of categories) {
    lines.push(`## ${cat.toUpperCase()}`);

    const catEntries = entries
      .filter((e) => e.category === cat)
      // Top-N per category by confidence desc, then usageCount desc.
      .sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      })
      .slice(0, MAX_PER_CATEGORY);

    for (const entry of catEntries) {
      lines.push(`### ${entry.title} (Confidence: ${entry.confidence})`);
      lines.push(entry.content);
      renderedIds.push(entry.id);
    }
  }

  const md = lines.join("\n\n");

  const destPath = path.join(
    process.cwd(),
    "chat-agent/knowledge/learnedSkills.md",
  );
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write atomically: write to a temp file then rename, so a concurrent
  // reader (prompt-builder) never observes a half-written file.
  const tmpPath = `${destPath}.tmp`;
  fs.writeFileSync(tmpPath, md);
  fs.renameSync(tmpPath, destPath);

  if (renderedIds.length > 0) {
    try {
      await skillEntries.markUsed(renderedIds);
    } catch (e) {
      logger.error("Failed to mark skill entries as used", { error: (e as Error).message });
    }
  }

  logger.info(
    `Agent skill compiled with ${entries.length} entries (${renderedIds.length} rendered) into ${destPath}`,
  );
}
