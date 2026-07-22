import { logger } from "./logger";

/**
 * Resolve the acting userId for an incoming request.
 *
 * Resolution order:
 * 1. `x-user-id` header, if present.
 * 2. Decode the `Authorization: Bearer <jwt>` payload and take
 *    `preferred_username`, stripped of all non-digit characters.
 * 3. Fallback to "anonymous".
 *
 * This ports the previously copy-pasted logic from:
 * - src/app/api/chat/route.ts
 * - src/app/api/patch/approve/route.ts
 * - src/app/api/patch/reject/route.ts
 * - src/app/api/session/restore/route.ts
 */
export function getUserId(req: Request): string {
  const userIdHeader = req.headers.get("x-user-id");
  if (userIdHeader) {
    return userIdHeader;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const tokenPart = authHeader.split(" ")[1];
      const payloadBase64 = tokenPart.split(".")[1];
      const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const payloadJson = atob(base64);
      const payload = JSON.parse(payloadJson);
      if (payload.preferred_username) {
        const digits = payload.preferred_username.replace(/\D/g, "");
        if (digits) {
          return digits;
        }
      }
    } catch (e) {
      logger.warn("Failed to decode JWT for userId", { error: (e as Error).message });
    }
  }

  return "anonymous";
}
