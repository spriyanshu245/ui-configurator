/**
 * RFC-6901 JSON Pointer helpers, dependency-free.
 *
 * These are small, pure utilities used by scope-diff.ts to walk DSL document
 * trees given RFC-6902 patch operation paths. Kept dependency-free and
 * unit-testable in isolation.
 */

/**
 * Parse a JSON Pointer string into its reference tokens.
 *
 * Splits on "/", drops the leading empty segment produced by the leading
 * slash, and unescapes "~1" -> "/" and "~0" -> "~" (in that order, per RFC-6901).
 *
 * "" (the whole-document pointer) and "/" both resolve sensibly:
 *   parsePointer("") -> []
 *   parsePointer("/components/2/properties/apiUrl") -> ["components", "2", "properties", "apiUrl"]
 */
export function parsePointer(path: string): string[] {
  if (path == null || path === "") return [];
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return normalized.split("/").map(unescapeToken);
}

function unescapeToken(token: string): string {
  // Order matters: ~1 -> / must be decoded before ~0 -> ~ to match RFC-6901.
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function escapeToken(token: string): string {
  // Order matters: ~ -> ~0 must be encoded before / -> ~1 to avoid double-escaping.
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Serialize reference tokens back into a JSON Pointer string.
 */
export function toPointer(tokens: string[]): string {
  if (tokens.length === 0) return "";
  return "/" + tokens.map(escapeToken).join("/");
}

/**
 * Walk `doc` to the value referenced by JSON Pointer `path`.
 * Returns `undefined` if any segment along the way is missing.
 */
export function resolvePointer(doc: any, path: string): any {
  const tokens = parsePointer(path);
  let current = doc;
  for (const token of tokens) {
    if (current === undefined || current === null) return undefined;
    if (Array.isArray(current)) {
      if (token === "-") return undefined;
      const idx = Number(token);
      if (!Number.isInteger(idx) || idx < 0) return undefined;
      current = current[idx];
    } else if (typeof current === "object") {
      current = current[token];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Return the JSON Pointer to the parent of `path`.
 * getParentPointer("/components/2/properties/apiUrl") -> "/components/2/properties"
 * getParentPointer("/components/2") -> "/components"
 * getParentPointer("/components") -> ""
 * getParentPointer("") -> ""
 */
export function getParentPointer(path: string): string {
  const tokens = parsePointer(path);
  if (tokens.length === 0) return "";
  return toPointer(tokens.slice(0, -1));
}

/**
 * True if `path` is exactly `ancestorPath` or nested underneath it.
 * Used to group/scope patch operations under a shared anchor pointer.
 */
export function isPointerWithin(path: string, ancestorPath: string): boolean {
  const pathTokens = parsePointer(path);
  const ancestorTokens = parsePointer(ancestorPath);
  if (ancestorTokens.length > pathTokens.length) return false;
  for (let i = 0; i < ancestorTokens.length; i++) {
    if (pathTokens[i] !== ancestorTokens[i]) return false;
  }
  return true;
}

/**
 * The last reference token of a pointer, or "" for the root pointer.
 */
export function lastToken(path: string): string {
  const tokens = parsePointer(path);
  return tokens.length > 0 ? tokens[tokens.length - 1] : "";
}
