import { skillEntries } from "../db/queries/skill-entries";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

// Cap how many entries render per category, so a runaway category can't
// crowd out everything else in the compiled skill file.
const MAX_PER_CATEGORY = 20;
// Entries whose titles share this much of their wording are near-duplicates
// ("Popup Page Required Properties" vs "… Properties Bundle"); keep the best one.
const DUPLICATE_TITLE_SIMILARITY = 0.6;
const STOP_WORDS = new Set(["a", "an", "the", "for", "with", "of", "to", "in", "on", "and", "via", "from"]);

function titleTokens(title: string): Set<string> {
  return new Set(
    String(title)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t && !STOP_WORDS.has(t)),
  );
}

function similarTitles(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  const union = a.size + b.size - shared;
  return union > 0 && shared / union >= DUPLICATE_TITLE_SIMILARITY;
}

/** Drop entries whose title nearly repeats a higher-ranked one (input is ranked). */
function withoutNearDuplicates<T extends { title: string }>(ranked: T[]): T[] {
  const kept: Array<{ entry: T; tokens: Set<string> }> = [];
  for (const entry of ranked) {
    const tokens = titleTokens(entry.title);
    if (kept.some((k) => similarTitles(k.tokens, tokens))) continue;
    kept.push({ entry, tokens });
  }
  return kept.map((k) => k.entry);
}

export async function compileAgentSkill() {
  const entries = await skillEntries.findAll({
    orderBy: { category: "asc", usageCount: "desc" },
  });

  const lines: string[] = [];
  lines.push("# Learned DSL Knowledge (compiled from past sessions)");
  // No timestamp: the file is part of the cached system prompt, so it should
  // only change when its content does.
  lines.push(`_Compiled from ${entries.length} entries_`);
  lines.push("---");

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const renderedIds: string[] = [];

  for (const cat of categories) {
    lines.push(`## ${cat.toUpperCase()}`);

    const ranked = entries
      .filter((e) => e.category === cat)
      // Top-N per category by confidence desc, then usageCount desc.
      .sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      });
    const catEntries = withoutNearDuplicates(ranked).slice(0, MAX_PER_CATEGORY);

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
