"use client";

import { useSyncExternalStore } from "react";
import sessionManager from "./SessionManagerService";

import { SessionState } from "./enums";
export function useSession() {
  const session = useSyncExternalStore(
    sessionManager.subscribe,
    sessionManager.getSnapshot,
    sessionManager.getSnapshot
  );

  return {
    ...session,
    isActive: session.state === SessionState.ACTIVE,
    isInactive: session.state === SessionState.INACTIVE,
    logout: sessionManager.handleLogout,
  };
}
