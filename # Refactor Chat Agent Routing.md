# Refactor Chat Agent Routing And Complete DSL Patch Approval

## Summary

- Keep `freellm-client` server-only and make `ChatPanel` use the existing Next route at `/api/chat` instead of the broken `/api/v1/chat/completions` path.
- Refactor `ChatPanel` to use typed chat state, preserve full conversation history, and derive its runtime context from the existing microsite page instead of relying on missing props.
- Complete patch approval by adding a reusable patch-application helper in `chat-agent/lib/dsl-patcher.ts` and using it in the approve route to turn a queued RFC 6902 patch into the full page payload sent to the backend.

## Key Changes

- `chat-agent/components/ChatPanel.tsx`
  - Replace the hardcoded `/api/v1/chat/completions` fetch with `/api/chat`.
  - Stop trying to use `freellm-client` in the browser; the panel will only talk to the server route.
  - Use `useMicrosite()` to read the active microsite code and create a stable per-panel `sessionId` locally, so the existing `<ChatPanel />` call site can stay simple.
  - Rework message state to use `ChatMessageType` as the base shape plus local UI-only fields for streaming, patch proposals, and status entries.
  - Preserve prior messages on send, approve, and reject; remove stale-closure updates by building new history from the latest state.
  - Add request guards for missing microsite context, non-OK responses, and empty/missing response bodies.

- `src/app/api/chat/route.ts`
  - Keep `freeLLMClient.chat.completions.create(...)` as the only place that talks to FreeLLM.
  - Fix SSE framing to emit valid `data: ...\n\n` events and keep the existing event contract (`text_chunk`, `patch_proposed`, `sync_messages`, `done`, `error`).
  - Keep message sanitization, but tighten it around the typed client payload so tool continuation messages still pass through correctly.

- `chat-agent/lib/dsl-patcher.ts` and `src/app/api/patch/approve/route.ts`
  - Export a reusable helper that validates and applies an RFC 6902 patch to a provided DSL snapshot, returning the patched document or a clear error.
  - In approval, load the queued patch record, re-apply the stored patch against the stored snapshot, and use that computed patched DSL as the backend `PUT` body.
  - Move history persistence to the success path so we only record `patch_applied` after the backend accepts the update.
  - Keep deleting the pending patch only after a successful backend write; leave it intact on failure for retry/debugging.
  - Return a success payload that still works as the tool-response content for the follow-up agent turn.

## Interfaces And Behavior

- Browser-to-server chat entrypoint becomes `/api/chat`.
- `ChatPanel` no longer depends on external `micrositeId`/`sessionId` props for this configurator flow; it resolves context internally from `MicrositeContext`.
- The reusable patch helper will accept `currentDsl + patch` and return `patchedDsl`; approval will use this helper rather than trusting the previously stored `patchedDsl` blob.

## Test Plan

- Add `ChatPanel` tests covering:
  - sends to `/api/chat`
  - appends user messages instead of resetting history
  - handles streamed `text_chunk`, `patch_proposed`, and `sync_messages` events
  - continues the conversation after approve/reject with the correct tool message
- Add chat route tests covering:
  - valid SSE framing
  - tool-call flow that queues a patch and returns `patch_proposed`
  - non-tool flow that ends with `sync_messages` and `done`
- Add patch approval route tests covering:
  - missing patch ID returns 404
  - invalid patch application returns 500 without deleting the pending patch
  - successful approval applies the patch, calls backend `PUT`, writes history, and removes the pending patch

## Assumptions

- We are not keeping backward compatibility for `/api/v1/chat/completions`; `/api/chat` is the canonical route.
- Approval should apply the patch against the queued snapshot captured at proposal time, not a freshly fetched backend version.
- The backend page update API expects the full page DSL document via `PUT`, which matches current save behavior elsewhere in the app.
