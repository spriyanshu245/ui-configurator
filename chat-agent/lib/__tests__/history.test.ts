/**
 * @jest-environment node
 */
import { toModelHistory } from "../history";

const call = (id: string, name: string, args: object) => ({
  id,
  type: "function",
  function: { name, arguments: JSON.stringify(args) },
});

const PRIOR = [
  { role: "system", content: "ignored" },
  {
    role: "user",
    content: "Add back all the interceptors from the dev JSON",
    _attachments: [{ handle: "att-0123456789", name: "dev-page.json", kind: "page DSL" }],
  },
  {
    role: "assistant",
    content: "Loading the page.",
    tool_calls: [call("t1", "get_page_dsl", { microsite_id: "m", page_path: "p1" })],
  },
  { role: "tool", tool_call_id: "t1", content: JSON.stringify({ outline: "/a x\n/b y\n/c z" }) },
  {
    role: "assistant",
    content: null,
    tool_calls: [
      call("t2", "query_dsl_path", { queries: [{ tempDslId: "d", path: "/a" }, { tempDslId: "d", id: "abc" }] }),
      call("t3", "propose_dsl_patch", { page_path: "p1", patch: [{}, {}, {}] }),
    ],
  },
  { role: "tool", tool_call_id: "t2", content: JSON.stringify({ results: [1, 2] }) },
  { role: "tool", tool_call_id: "t3", content: "Patch queued for user approval. Patch ID: 9cae.\nmore" },
  { role: "tool", tool_call_id: "t3", content: "Patch approved and applied." },
  { role: "user", content: "do the EDIT section too" },
  { role: "assistant", content: "Done — proposed." },
];

describe("toModelHistory", () => {
  it("keeps all user/assistant text, collapses tool calls to one-line notes and merges steps", () => {
    const history = toModelHistory(PRIOR);
    expect(history.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(history[0].content).toBe(
      'Add back all the interceptors from the dev JSON\n[attached: att-0123456789 "dev-page.json" (page DSL) — still available; read via its handle]',
    );
    expect(history[1].content).toBe(
      [
        "Loading the page.",
        "[get_page_dsl page_path=p1 → outline, 3 nodes]",
        "[query_dsl_path 2 queries → 2 results]",
        "[propose_dsl_patch page_path=p1 3 ops → Patch queued for user approval. Patch ID: 9cae. | Patch approved and applied.]",
      ].join("\n"),
    );
    expect(history[3].content).toBe("Done — proposed.");
  });

  it("is deterministic and never carries tool payloads or reasoning", () => {
    const withReasoning = PRIOR.map((m) =>
      m.role === "assistant" ? { ...m, _bedrockContent: [{ reasoning: { text: "secret" } }] } : m,
    );
    const a = JSON.stringify(toModelHistory(withReasoning));
    expect(a).toBe(JSON.stringify(toModelHistory(PRIOR)));
    expect(a).not.toContain("secret");
    expect(a).not.toContain('"outline"');
  });

  it("handles errors, unknown results, array content and empty input", () => {
    const history = toModelHistory([
      { role: "user", content: [{ type: "text", text: "hi" }, { type: "image", dataBase64: "x" }] },
      { role: "assistant", content: "", tool_calls: [call("e", "find_components", { type: "form" })] },
      { role: "tool", tool_call_id: "e", content: JSON.stringify({ error: "boom" }) },
      { role: "assistant", content: "", tool_calls: [call("n", "list_microsites", {})] },
      { role: "tool", tool_call_id: "n", content: "plain text" },
    ]);
    expect(history).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "[find_components type=form → error: boom]\n[list_microsites → 10 chars]" },
    ]);
    expect(toModelHistory([])).toEqual([]);
    expect(toModelHistory(undefined as any)).toEqual([]);
  });

  it("summarizes matches, not-found and non-string results, and skips unknown roles/null entries", () => {
    const history = toModelHistory([
      null,
      { role: "function", content: "ignored" },
      { role: "user", content: null },
      { role: "user", content: "go", _attachments: [{ handle: "att-1", name: "a.json" }] },
      {
        role: "assistant",
        content: "x",
        tool_calls: [
          call("m", "find_components", { page_paths: ["a", "b"] }),
          call("f", "get_page_dsl", { page_path: "gone" }),
          call("o", "show_page_map", {}),
        ],
      },
      { role: "tool", tool_call_id: "m", content: JSON.stringify({ matches: [1, 2, 3] }) },
      { role: "tool", tool_call_id: "f", content: JSON.stringify({ found: false }) },
      { role: "tool", tool_call_id: "o", content: { pageMap: true } },
    ]);
    expect(history[0].content).toBe('go\n[attached: att-1 "a.json" — still available; read via its handle]');
    expect(history[1].content).toBe(
      [
        "x",
        "[find_components page_paths=a,b → 3 matches]",
        "[get_page_dsl page_path=gone → not found]",
        "[show_page_map → 16 chars]",
      ].join("\n"),
    );
  });

  it("tolerates unparseable or object arguments, nameless calls and batch operations", () => {
    const history = toModelHistory([
      {
        role: "assistant",
        content: null,
        tool_calls: [
          { id: "a", function: { name: "weird", arguments: "{not json" } },
          { id: "b", function: { name: "propose_dsl_batch", arguments: { operations: [{}, {}] } } },
          { id: "c" },
        ],
      },
      { role: "tool", tool_call_id: "b", content: "Batch queued\nrest" },
    ]);
    expect(history).toEqual([
      {
        role: "assistant",
        content: "[weird]\n[propose_dsl_batch 2 pages → Batch queued]\n[tool]",
      },
    ]);
  });

  it("clips very long argument values and long error text", () => {
    const [msg] = toModelHistory([
      {
        role: "assistant",
        content: "",
        tool_calls: [call("e", "get_page_dsl", { page_path: "p".repeat(200) })],
      },
      { role: "tool", tool_call_id: "e", content: JSON.stringify({ error: "e".repeat(400) }) },
    ]);
    expect(msg.content).toContain(`page_path=${"p".repeat(79)}…`);
    expect(msg.content).toContain(`error: ${"e".repeat(159)}…`);
  });
});
