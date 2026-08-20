import { userPreferences } from "../db/queries/user-preferences";
import { dslHistory } from "../db/queries/dsl-history";
import {
  fetchMicrositePages,
  fetchMicrosites,
  fetchPageDsl,
} from "./microsite-loader";
import { tempDslOps } from "../db/queries/temp-dsl";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";

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
    case "get_microsite_pages":
      const data = await fetchMicrositePages(args.microsite_id);
      return data;
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
      const micrositeData = await fetchMicrositePages(args.microsite_id);
      const page = micrositeData.pages?.find(
        (p: any) => p.pageCode === args.page_path,
      );
      if (!page) {
        return { error: `Page "${args.page_path}" not found.` };
      }
      const version = page.pageVersion || 1;
      const dsl = await fetchPageDsl(args.page_path, version);

      const tempDslId = uuidv4();
      await tempDslOps.storeDsl(tempDslId, dsl);

      return {
        tempDslId,
        message: "DSL is large and has been stored in MongoDB. Use query_dsl_path to query specific JSON paths.",
        rootSummary: {
          id: dsl.id,
          type: dsl.type,
          componentCount: dsl.components ? dsl.components.length : 0,
        }
      };
    }
    case "query_dsl_path": {
      const { tempDslId, path } = args;
      if (!path) {
        const full = await tempDslOps.getDsl(tempDslId);
        return { data: full ? { id: full.id, type: full.type, keys: Object.keys(full) } : null };
      }
      const data = await tempDslOps.getDslPath(tempDslId, path);
      return { data };
    }
    case "get_dsl_history":
      return await dslHistory.getHistorySummaries(
        args.microsite_id,
        args.page_path,
        args.limit,
      );
    case "log_user_preference": {
      const userId = ctx.userId || "anonymous";
      const micrositeId = ctx.micrositeId || "__global__";
      await userPreferences.set(userId, micrositeId, args.key, args.value);
      return { success: true };
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
