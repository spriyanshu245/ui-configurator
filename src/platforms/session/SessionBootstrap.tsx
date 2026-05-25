"use client";

import sessionManager from "@/platforms/session/SessionManagerService";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SESSION_CONSTANTS } from "./session.constants";
import { getApiBaseUrl } from "@/app/utils/utils";

export default function SessionBootstrap() {
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    const boot = async () => {
      try {
        const API_BASE_URL = getApiBaseUrl();
        const url = `${API_BASE_URL}${SESSION_CONSTANTS.TOKEN_REFRESH_ENDPOINT}`;
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-user-type": "employee",
          },
        });

        if (!res.ok) {
          await sessionManager.handleLogout();
          return;
        }

        const user = await res.json();
        sessionManager.restore(user);
      } catch {
        await sessionManager.handleLogout();
      }
    };
    if (!pathName?.includes("/customers")) boot();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__RAHI_SESSION_MANAGER__ = sessionManager;
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sessionManager.notifyActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleFocus = () => {
      sessionManager.notifyActivity();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      if (!pathName.includes("/customers")) router.replace("/login");
    };

    window.addEventListener("session-logout", handleLogout);

    return () => window.removeEventListener("session-logout", handleLogout);
  }, []);

  return null;
}
