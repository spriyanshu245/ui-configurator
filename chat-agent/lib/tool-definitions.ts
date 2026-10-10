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
      description: `Load the current DSL of one or MORE pages and return a compact OUTLINE per page instead
        of raw JSON: one line per component, "<JSON Pointer> <type> #<id prefix> \\"label\\" {key props}".
        Use the pointer directly in propose_dsl_patch paths. Pages already loaded in this session are
        served from memory (instant); request several pages together with page_paths in ONE call.
        page_paths ["*"] returns only the page LIST (no outlines) — then request just the pages you need.
        After an approved change the stored copy is updated automatically; pass refresh: true only if
        the page may have been edited outside the chat. Then use query_dsl_path / find_components.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_path: { type: "string", description: "A single pageCode." },
          page_paths: {
            type: "array",
            items: { type: "string" },
            description: 'Several pageCodes to load in parallel. ["*"] = list all pageCodes only (no outlines).',
          },
          refresh: { type: "boolean", description: "Reload from the backend instead of the session cache." },
        },
        required: ["microsite_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_dsl_path",
      description: `Read specific nodes/properties of a page loaded by get_page_dsl. Address a node by path —
        JSON Pointer ("/components/0/properties"), dot ("components.0.properties") or bracket
        ("components[0].properties") — or by id (full id or the 8-char #prefix shown in outlines).
        Returns COMPACT JSON (null, "", [], {} omitted; false/0 kept). A node with many nested
        components comes back as a "depth-1" view: its own settings, with each nested component as a
        one-line stub (pointer, type, id, label) to drill into. outline: true returns the subtree
        outline; full: true returns the untouched JSON (use it before replacing a whole node).
        Look up several nodes (across pages) at once with queries[].`,
      parameters: {
        type: "object",
        properties: {
          tempDslId: { type: "string", description: "The DSL id returned by get_page_dsl" },
          path: { type: "string", description: "Path to read. Empty = the whole page." },
          id: { type: "string", description: "Component id or its 8-char prefix (alternative to path)." },
          queries: {
            type: "array",
            description: "Several lookups run in parallel; overrides tempDslId/path.",
            items: {
              type: "object",
              properties: {
                tempDslId: { type: "string" },
                path: { type: "string" },
                id: { type: "string" },
              },
              required: ["tempDslId"],
            },
          },
          outline: { type: "boolean", description: "Return an outline of the subtree instead of JSON." },
          full: { type: "boolean", description: "Return uncompacted JSON." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_components",
      description: `Search one or more pages for components and get matching outline lines (pointer, type,
        id prefix, label, key props) — e.g. every button routing to a page, every clickable table
        column, or a component by its label. Cheaper than reading JSON with query_dsl_path. Filters
        combine (all must match): type (exact), labelContains (case-insensitive), prop (a property name
        that must exist) and optionally equals (its exact value).`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
          page_paths: { type: "array", items: { type: "string" }, description: "pageCodes to search." },
          type: { type: "string", description: 'Component type, e.g. "button-v2", "table-column".' },
          labelContains: { type: "string" },
          prop: { type: "string", description: 'Property name, e.g. "routePage".' },
          equals: { type: "string", description: "Exact value of prop to match." },
        },
        required: ["microsite_id", "page_paths"],
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
        - Validate all JSON Pointer paths (RFC 6901) before proposing.
        - Give every NEW component, and every new nested item that carries an id (e.g. multipleActions, actions, nameKeyIds entries), a fresh UUID "id". Keep ids of existing ones unchanged.
        - Prefer property-level ops (e.g. replace /components/2/properties/label) over replacing whole components.`,
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
        - Give every NEW component, and every new nested item that carries an id (e.g. multipleActions, actions, nameKeyIds entries), a fresh UUID "id". Keep ids of existing ones unchanged.
        - Prefer property-level ops (e.g. replace /components/2/properties/label) over replacing whole components.
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
      description: `Persist a DURABLE user preference so future sessions honor it without being re-told.
        Call this the moment the user states a lasting choice about HOW they want things done —
        e.g. a naming convention, a default styling/spacing/color, a preferred component for a job,
        or a workflow habit ("always ask before deleting"). Do NOT log one-off, page-specific facts
        or anything already obvious from the DSL. Keep the key stable (snake_case) so a later value
        overwrites the same preference instead of piling up duplicates.`,
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Stable preference key in snake_case (e.g. 'default_button_variant')" },
          value: { type: "string", description: "Preference value" },
          reason: {
            type: "string",
            description: "Why this preference was inferred (what the user said/did)",
          },
        },
        required: ["key", "value", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_skill",
      description: `Save a NOVEL, REUSABLE configuration pattern into the agent's long-term knowledge
        base so future sessions start already knowing it. Use your own judgement: call this after you
        work out a non-obvious DSL recipe that WORKED and would help on a similar future task — e.g. a
        multi-step session-data binding, a routing/popup setup, or a component wiring that wasn't
        already covered by your knowledge base. Write the content as a concise, self-contained
        how-to that names the EXACT property/field keys involved (someone should be able to reproduce
        it from the entry alone). Do NOT record: trivial edits (label/text/color tweaks), one-off
        page-specific facts, user preferences (use log_user_preference), or anything already in your
        knowledge base. Prefer one high-quality entry over many small ones.`,
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "component_pattern",
              "dsl_rule",
              "common_operation",
              "error_fix",
              "routing_pattern",
            ],
            description: "Which kind of knowledge this is.",
          },
          title: {
            type: "string",
            description: "Short, specific title (e.g. 'Store clicked table row as API path variable').",
          },
          content: {
            type: "string",
            description:
              "Markdown how-to, 2-6 sentences, naming the exact property/field keys. Self-contained and reproducible.",
          },
        },
        required: ["category", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_next_actions",
      description: `Offer the user 2-4 concise, clickable follow-up actions for what to do NEXT.
        Call this at the END of a turn (after you've answered or after a change is applied/approved)
        when there are natural next steps — e.g. after adding a form: "Add a validation rule",
        "Route the Submit button", "Make this a popup". Each suggestion's 'value' is the exact prompt
        that will be sent as the user's next message if they click it, so phrase it as a first-person
        instruction ("Add a phone number field"). Keep labels short (2-5 words). Skip this if there is
        no obvious next step, or while a proposal is still awaiting the user's approval.`,
      parameters: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            description: "2-4 next-step suggestions.",
            items: {
              type: "object",
              properties: {
                label: {
                  type: "string",
                  description: "Short button text (2-5 words), e.g. 'Route the Submit button'.",
                },
                value: {
                  type: "string",
                  description:
                    "The full prompt sent as the user's message if clicked, e.g. 'Route the Submit button to the confirmation page'.",
                },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["suggestions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_page_map",
      description: `Render an interactive map of the microsite's pages and how they link to each
        other. Use this when the user asks to see the page structure / hierarchy / sitemap, "how do
        these pages connect", "show me the pages", or which page a control routes to. It loads each
        page and derives links from routing config (routePage on buttons/table columns, tabs' pageCode)
        and marks popup pages. The result is shown to the user as a clickable tree; you do not need to
        restate the whole tree in prose — a one-line summary is enough.`,
      parameters: {
        type: "object",
        properties: {
          microsite_id: { type: "string" },
        },
        required: ["microsite_id"],
      },
    },
  },
];

/**
 * Tools with no side effects: the chat route may run these concurrently within
 * one agent step. Anything that writes, navigates, queues a proposal or emits
 * suggestions must NOT be listed here.
 */
export const READ_ONLY_TOOLS = new Set<string>([
  "get_page_dsl",
  "query_dsl_path",
  "find_components",
  "get_microsite_pages",
  "list_microsites",
  "get_dsl_history",
  "show_page_map",
]);
