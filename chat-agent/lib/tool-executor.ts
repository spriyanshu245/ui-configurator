import { userPreferences } from "../db/queries/user-preferences";
import { dslHistory } from "../db/queries/dsl-history";
import { fetchMicrositePages, fetchPageDsl } from "./microsite-loader";
import { tempDslOps } from "../db/queries/temp-dsl";
import { v4 as uuidv4 } from "uuid";

export async function executeTool(name: string, args: any) {
  switch (name) {
    case "get_microsite_pages":
      const data = await fetchMicrositePages(args.microsite_id);
      return data;
    case "list_microsites":
      return [{ id: "loan-accounts", name: "Loan Accounts" }];
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
      return await dslHistory.getHistory(
        args.microsite_id,
        args.page_path,
        args.limit,
      );
    case "log_user_preference":
      await userPreferences.set(args.key, args.value);
      return { success: true };
    case "propose_rollback":
      return { queued: true, message: "Rollback proposed" };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
