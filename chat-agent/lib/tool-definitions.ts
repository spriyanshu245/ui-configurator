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
      name: "propose_dsl_batch",
      description: `Propose changes spanning MULTIPLE pages as a single atomic batch.
        Use this INSTEAD OF propose_dsl_patch when the user's request spans more than
        one page, OR when it requires saving changes on the current page and then
        navigating to another page. All patches in the batch are validated up-front
        before any of them are applied. The user approves (or rejects) the entire
        batch as one unit — there is no partial/per-page approval. If applying the
        batch fails partway through, every page that was already written is
        automatically reverted back to its pre-batch state (auto-revert/compensation),
        so the microsite is never left partially modified.
        CRITICAL RULES:
        - NEVER modify DSL directly in text. Always use this tool for multi-page changes.
        - This does NOT apply anything. The user must approve the whole batch first.
        - Each operation must target a different page via page_path.
        - Use 'replace' for edits, 'add' for new components, 'remove' for deletions.
        - Always include a clear human-readable description and preview_hint per page.
        - Validate all JSON Pointer paths (RFC 6901) before proposing.
        - Set navigate_to if, after approval, the user should land on a specific page
          (e.g. the last page touched by the batch).`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          operations: {
            type: "array",
            description: "One entry per page affected by this batch.",
            items: {
              type: "object",
              properties: {
                page_path: { type: "string" },
                patch: {
                  type: "array",
                  description: "RFC 6902 JSON Patch operations array for this page",
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
                  description: "Human-readable summary: what changes and why on this page",
                },
                preview_hint: {
                  type: "string",
                  description: "What the user will visually see change on this page",
                },
                affected_components: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of component IDs or types being modified on this page",
                },
              },
              required: ["page_path", "patch", "description", "preview_hint", "affected_components"],
            },
          },
          navigate_to: {
            type: "string",
            description: "Optional page_path to navigate the user to after the batch is approved.",
          },
          batch_description: {
            type: "string",
            description: "Human-readable summary of the whole batch, shown to the user before approval.",
          },
        },
        required: ["microsite_id", "operations", "batch_description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_create_page",
      description: `Propose creating a NEW page in the microsite. Use this when the user
        asks to add a page. Suggest a sensible page name from their request (they can edit it).
        This does NOT create the page directly — it opens a small input card in the chat where
        the user confirms the page NAME and ticks an "Open as popup" checkbox, then submits to
        create it. After creation the editor auto-navigates to the new page. The page code is
        derived from the name (lowercased, hyphenated, prefixed with the microsite id) — you do
        NOT choose the code. Once the page exists you can route a control to it and/or configure
        its DSL (e.g. with propose_dsl_batch). Do NOT call get_page_dsl on a page you have just
        proposed but that has not been created/confirmed yet.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          suggested_name: {
            type: "string",
            description:
              "A human-readable page name to pre-fill (e.g. 'Customer Update Banks'). The user can edit it before creating.",
          },
          purpose: {
            type: "string",
            description: "Optional short note on what the page is for (shown to the user).",
          },
        },
        required: ["microsite_id", "suggested_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to_page",
      description: `Navigate the configurator editor UI to a specific page by its pageCode.
        Use this to take the user to a page so they can see it — e.g. after creating a
        page, or when the user asks "show me / go to <page>", or before/after applying a
        patch so they can review the result. This is a non-destructive UI action (it just
        switches the active page); it does NOT require approval and does NOT modify any DSL.
        The page_path must be an existing pageCode in the microsite.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: {
            type: "string",
            description: "The pageCode to navigate to (must already exist in the microsite).",
          },
          reason: {
            type: "string",
            description: "Short human-readable reason for navigating (shown to the user).",
          },
        },
        required: ["microsite_id", "page_path"],
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
      description: `Propose reverting a page to a previous snapshot.
        Resolves steps_back against the last 3 stored snapshots and returns a
        rollback proposal for the user to confirm. Does NOT auto-apply — the
        user must confirm via the rollback UI, which re-applies the stored
        pre-image DSL as-is (no inverse-patch computation).`,
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
