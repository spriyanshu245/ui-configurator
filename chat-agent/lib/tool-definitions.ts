export const DSL_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_microsite_pages",
      description: `Fetch all pages and their complete DSL JSON for a given microsite.
        Call this at the start of every session. Returns every page path and its DSL.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: {
            type: "string",
            description: "The microsite ID to load",
          },
        },
        required: ["microsite_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_microsites",
      description:
        "List all available microsites. Returns id, name, slug, and page count for each.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_page_dsl",
      description:
        "Fetch the current DSL for a specific page. Use to refresh after a patch.",
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: { type: "string", description: "e.g. /home or /about" },
        },
        required: ["microsite_id", "page_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_dsl_path",
      description:
        "Query a specific subdocument or property within a large DSL stored in MongoDB to avoid loading the full JSON into context.",
      parameters: {
        type: "object",
        properties: {
          tempDslId: { type: "string", description: "The temporary DSL ID returned by get_page_dsl" },
          path: { type: "string", description: "Dot notation path to query (e.g. 'components.0.props.title'). Leave empty to get summary of root." },
        },
        required: ["tempDslId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_dsl_patch",
      description: `Propose changes to a page DSL as an RFC 6902 JSON Patch array.
        CRITICAL RULES:
        - NEVER modify DSL directly in text. Always use this tool.
        - This does NOT apply the patch. The user must approve first.
        - One logical change per proposal. Break complex changes into steps.
        - Use 'replace' for edits, 'add' for new components, 'remove' for deletions.
        - Always include a clear human-readable description and preview_hint.
        - Validate all JSON Pointer paths (RFC 6901) before proposing.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: { type: "string" },
          patch: {
            type: "array",
            description: "RFC 6902 JSON Patch operations array",
            items: {
              type: "object",
              properties: {
                op: {
                  type: "string",
                  enum: ["add", "remove", "replace", "move", "copy", "test"],
                },
                path: { type: "string", description: "RFC 6901 JSON Pointer" },
                value: { description: "New value (not needed for remove)" },
                from: {
                  type: "string",
                  description: "Source path for move/copy",
                },
              },
              required: ["op", "path"],
            },
          },
          description: {
            type: "string",
            description: "Human-readable summary: what changes and why",
          },
          preview_hint: {
            type: "string",
            description:
              "What the user will visually see change in the renderer",
          },
          affected_components: {
            type: "array",
            items: { type: "string" },
            description: "List of component IDs or types being modified",
          },
        },
        required: [
          "microsite_id",
          "page_path",
          "patch",
          "description",
          "preview_hint",
          "affected_components",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dsl_history",
      description:
        "Get the last N DSL snapshots for a page. Use to understand recent changes or to prepare a rollback.",
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: { type: "string" },
          limit: {
            type: "number",
            description: "Max snapshots to return, default 3, max 3",
          },
        },
        required: ["microsite_id", "page_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_rollback",
      description: `[FUTURE FEATURE — available but gated]
        Propose reverting a page to a previous snapshot.
        Fetches the snapshot, generates the inverse patch, and sends it through the approval gate.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: { type: "string" },
          steps_back: {
            type: "number",
            description:
              "How many operations back to revert. 1 = last change, max 3.",
          },
          reason: { type: "string" },
        },
        required: ["microsite_id", "page_path", "steps_back", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_user_preference",
      description:
        "Store a user preference learned from this conversation for future sessions.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Preference key in snake_case" },
          value: { type: "string", description: "Preference value" },
          reason: {
            type: "string",
            description: "Why this preference was inferred",
          },
        },
        required: ["key", "value", "reason"],
      },
    },
  },
];
