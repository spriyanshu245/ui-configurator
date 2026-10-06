import { userPreferences } from "../db/queries/user-preferences";
import { dslHistory } from "../db/queries/dsl-history";
import {
  fetchMicrositePages,
  fetchMicrosites,
} from "./microsite-loader";
import { tempDslOps } from "../db/queries/temp-dsl";
import {
  compactDsl,
  outlineDsl,
  parseDslPath,
  resolveSegments,
  toPointer,
  pointersForId,
  findComponents,
  countDescendants,
  depthOneView,
} from "./dsl-compact";
import { loadPages, getNodeIndex, parseTempDslKey } from "./dsl-store";

// Nodes with more nested components than this are returned as a depth-1 view.
const DEPTH_ONE_MIN_DESCENDANTS = 10;
import { skillEntries } from "../db/queries/skill-entries";
import { compileAgentSkill } from "./skill-compiler";
import { buildPageMap } from "./page-map";
import { logger } from "./logger";

export interface ToolExecutionContext {
  userId?: string;
  micrositeId?: string;
}

export async function executeTool(
  name: string,
  args: any,
  ctx: ToolExecutionContext = {},
) {
  switch (name) {
    case "get_microsite_pages": {
      // Return only what the agent needs (the raw backend object is large and
      // is resent on every loop iteration once it's in the conversation).
      const data: any = await fetchMicrositePages(args.microsite_id);
      const microsite = data?.dslJson ?? data;
      return {
        code: microsite?.code,
        name: microsite?.name,
        firstPageCode: microsite?.firstPageCode,
        pages: (microsite?.pages ?? []).map((p: any) => ({
          pageCode: p.pageCode,
          pageVersion: p.pageVersion,
        })),
      };
    }
    case "list_microsites":
      try {
        return await fetchMicrosites();
      } catch (e) {
        // Backend list endpoint may be unavailable in some environments; surface
        // the failure to the agent rather than silently returning stale/fake data.
        logger.warn("list_microsites backend fetch failed", {
          error: (e as Error).message,
        });
        return {
          error: `Could not list microsites from the backend: ${(e as Error).message}`,
        };
      }
    case "navigate_to_page": {
      // Verify the page exists before asking the UI to navigate to it. The chat
      // route detects `navigate: true` in this result and emits a `navigate` SSE
      // event that the client handles via MicrositeContext.setActivePage.
      try {
        const micrositeData = await fetchMicrositePages(args.microsite_id);
        const exists = micrositeData?.pages?.some(
          (p: any) => p.pageCode === args.page_path,
        );
        if (!exists) {
          return { error: `Page "${args.page_path}" not found in microsite "${args.microsite_id}".` };
        }
        return {
          navigate: true,
          pageCode: args.page_path,
          reason: args.reason ?? null,
          message: `Navigating the editor to "${args.page_path}".`,
        };
      } catch (e) {
        return { error: `Could not navigate: ${(e as Error).message}` };
      }
    }
    case "get_page_dsl": {
      // Pages come from the read-through store (memory → Mongo → backend), so a
      // page already loaded this session costs no backend or Mongo round trip.
      // Returns a compact outline per page instead of raw JSON.
      const micrositeId = args.microsite_id;

      // "*" lists the pages only. Loading every page's outline was the main
      // context blow-up (155 pages → ~565k chars in a single tool result).
      if (Array.isArray(args.page_paths) && args.page_paths.includes("*")) {
        const micrositeData: any = await fetchMicrositePages(micrositeId);
        const allPages: any[] = (micrositeData?.dslJson ?? micrositeData)?.pages ?? [];
        return {
          totalPages: allPages.length,
          pages: allPages.map((p) => ({ pageCode: p.pageCode, pageVersion: p.pageVersion })),
          note: "Page list only. Call get_page_dsl again with the specific page_paths you need to get their outlines.",
        };
      }

      const requested: string[] = Array.isArray(args.page_paths) && args.page_paths.length
        ? args.page_paths
        : args.page_path
          ? [args.page_path]
          : [];
      if (!requested.length) {
        return { error: "Provide page_path or page_paths." };
      }

      const { pages: loaded, errors } = await loadPages(micrositeId, requested, {
        refresh: Boolean(args.refresh),
      });

      const maxLines = loaded.length > 1 ? 150 : 400;
      const pages = loaded.map((p) => ({
        pageCode: p.pageCode,
        pageVersion: p.pageVersion,
        tempDslId: p.tempDslId,
        outline: outlineDsl(p.dsl, { maxLines }),
      }));

      const note =
        "Outline format: <JSON Pointer> <type> #<id prefix> \"label\" {key props}. Use the pointer in patches, or query_dsl_path (path or id) for a node's JSON.";
      if (requested.length === 1 && pages.length === 1) {
        return { ...pages[0], note };
      }
      return { pages, ...(errors.length ? { errors } : {}), note };
    }
    case "query_dsl_path": {
      // Single lookup or several (queries[]); each by `path` or component `id`
      // (full id or the 8-char prefix shown in outlines). Pages are read through
      // the in-memory store and grouped, so N lookups on a page cost one load.
      const queries: Array<{ tempDslId: string; path?: string; id?: string }> =
        Array.isArray(args.queries) && args.queries.length
          ? args.queries
          : [{ tempDslId: args.tempDslId, path: args.path, id: args.id }];

      // Load every distinct page once, in parallel (grouped per microsite).
      const byMicrosite = new Map<string, Set<string>>();
      for (const q of queries) {
        const key = parseTempDslKey(q.tempDslId);
        if (!key) continue;
        if (!byMicrosite.has(key.micrositeId)) byMicrosite.set(key.micrositeId, new Set());
        byMicrosite.get(key.micrositeId)!.add(key.pageCode);
      }
      const dslByKey = new Map<string, any>();
      await Promise.all(
        [...byMicrosite].map(async ([micrositeId, pageCodes]) => {
          const { pages } = await loadPages(micrositeId, [...pageCodes]);
          for (const p of pages) dslByKey.set(p.tempDslId, p.dsl);
        }),
      );

      const lookup = async (q: { tempDslId: string; path?: string; id?: string }) => {
        const base = { tempDslId: q.tempDslId };
        const dsl = dslByKey.get(q.tempDslId);
        let segments: string[];
        if (q.id) {
          if (dsl === undefined) return { ...base, id: q.id, found: false };
          const pointers = pointersForId(getNodeIndex(dsl), q.id);
          if (pointers.length === 0) return { ...base, id: q.id, found: false };
          if (pointers.length > 1) {
            return { ...base, id: q.id, found: true, ambiguous: true, pointers, note: "Several components match this id prefix; query by pointer." };
          }
          segments = parseDslPath(pointers[0]);
        } else {
          segments = parseDslPath(q.path);
        }
        const pointer = toPointer(segments) || "/";
        // Legacy keys (not in the store) fall back to a direct Mongo lookup.
        const value = dsl !== undefined
          ? resolveSegments(dsl, segments)
          : await tempDslOps.getDslPath(q.tempDslId, q.path ?? "");
        if (value === undefined) return { ...base, pointer, found: false };
        if (args.outline) return { ...base, pointer, found: true, outline: outlineDsl(value, { basePath: segments }) };
        if (args.full) return { ...base, pointer, found: true, data: value };
        if (countDescendants(value) > DEPTH_ONE_MIN_DESCENDANTS) {
          return {
            ...base,
            pointer,
            found: true,
            view: "depth-1",
            data: depthOneView(value, segments),
            note: "Nested components are shown as one-line stubs; query a stub's pointer for its JSON, or use full: true.",
          };
        }
        return { ...base, pointer, found: true, data: compactDsl(value) ?? value };
      };

      const rendered = await Promise.all(queries.map(lookup));
      return queries.length === 1 && !Array.isArray(args.queries) ? rendered[0] : { results: rendered };
    }
    case "find_components": {
      // Search loaded pages via their node index; returns outline lines only.
      const micrositeId = args.microsite_id || ctx.micrositeId;
      const pageCodes: string[] = Array.isArray(args.page_paths) ? args.page_paths.filter((p: string) => p !== "*") : [];
      if (!micrositeId || !pageCodes.length) {
        return { error: "Provide microsite_id and page_paths (specific pageCodes)." };
      }
      const filter = {
        type: args.type,
        labelContains: args.labelContains,
        prop: args.prop,
        equals: args.equals === undefined || args.equals === null ? undefined : String(args.equals),
      };
      const { pages, errors } = await loadPages(micrositeId, pageCodes);
      const results = pages.map((p) => {
        const matches = findComponents(getNodeIndex(p.dsl), filter);
        return { pageCode: p.pageCode, tempDslId: p.tempDslId, count: matches.length, matches };
      });
      return { results, ...(errors.length ? { errors } : {}) };
    }
    case "get_dsl_history":
      // Drop full patch bodies — op count + description is enough to pick a
      // rollback target, and the bodies can be large.
      return (
        (await dslHistory.getHistorySummaries(
          args.microsite_id,
          args.page_path,
          args.limit,
        )) ?? []
      ).map(({ patchApplied, ...rest }: any) => ({
        ...rest,
        patchOpCount: Array.isArray(patchApplied) ? patchApplied.length : 0,
      }));
    case "log_user_preference": {
      const userId = ctx.userId || "anonymous";
      const micrositeId = ctx.micrositeId || "__global__";
      await userPreferences.set(userId, micrositeId, args.key, args.value);
      return { success: true };
    }
    case "show_page_map": {
      try {
        const micrositeId = args.microsite_id || ctx.micrositeId;
        if (!micrositeId) return { error: "No microsite id available for the page map." };
        const pageMap = await buildPageMap(micrositeId);
        return { pageMap };
      } catch (e) {
        return { error: `Could not build the page map: ${(e as Error).message}` };
      }
    }
    case "suggest_next_actions": {
      const raw = Array.isArray(args?.suggestions) ? args.suggestions : [];
      const suggestions = raw
        .filter((s: any) => s && typeof s.label === "string" && typeof s.value === "string")
        .slice(0, 4)
        .map((s: any, i: number) => ({
          id: `sg-${i}`,
          label: s.label.slice(0, 60),
          value: s.value,
        }));
      return { suggestions };
    }
    case "record_skill": {
      const { category, title, content } = args;
      if (!title || !content) {
        return { error: "record_skill requires a title and content." };
      }
      try {
        await skillEntries.upsert({
          category: category || "component_pattern",
          title,
          content,
          confidence: 0.8,
          source: "agent_reflection",
        });
        await compileAgentSkill();
        await skillEntries.enforceBounds();
        return { success: true, message: `Recorded skill: "${title}".` };
      } catch (e) {
        logger.error("record_skill failed", { error: (e as Error).message });
        return { error: `Failed to record skill: ${(e as Error).message}` };
      }
    }
    case "propose_rollback": {
      const { microsite_id, page_path, steps_back, reason } = args;
      const clampedStepsBack = Math.min(3, Math.max(1, Number(steps_back) || 1));

      const summaries = await dslHistory.getHistorySummaries(
        microsite_id,
        page_path,
        3,
      );

      if (!summaries || summaries.length === 0) {
        return {
          queued: false,
          message: `No snapshot history available for "${page_path}" in "${microsite_id}".`,
        };
      }

      const target = summaries[clampedStepsBack - 1];
      if (!target) {
        return {
          queued: false,
          message: `Only ${summaries.length} snapshot(s) available for "${page_path}" — cannot go back ${clampedStepsBack} step(s).`,
        };
      }

      return {
        queued: true,
        rollback: {
          historyId: target.id,
          micrositeId: target.micrositeId,
          pagePath: target.pagePath,
          description: target.description,
          createdAt: target.createdAt,
          reason,
        },
        message: `Rollback proposed to snapshot from ${target.createdAt} ("${target.description}"). Awaiting user confirmation — this does NOT auto-apply.`,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
