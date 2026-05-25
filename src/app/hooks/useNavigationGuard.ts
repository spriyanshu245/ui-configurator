import { useCallback, useEffect, useRef, useState } from "react";

type Resolver = (value: boolean) => void;

export function useNavigationGuard(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  const resolverRef = useRef<Resolver | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isBlockingRef = useRef(false);

  const confirm = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setShowModal(true);
    });
  }, []);

  const allow = () => {
    resolverRef.current?.(true);
    cleanup();
  };

  const block = () => {
    resolverRef.current?.(false);
    cleanup();
  };

  const cleanup = () => {
    resolverRef.current = null;
    setShowModal(false);
    if (pendingActionRef.current) {
      pendingActionRef.current = null;
    }
  };

  /* -------------------------------
     HARD BLOCK: Reload / Tab Close
  -------------------------------- */
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* -------------------------------
     HARD BLOCK: Back / Forward
  -------------------------------- */
  useEffect(() => {
    if (!isDirty) return;

    isBlockingRef.current = true;
    window.history.pushState(null, "", window.location.href);

    const onPopState = async () => {
      if (!isBlockingRef.current) return;

      const confirmed = await confirm();

      if (confirmed) {
        isBlockingRef.current = false;
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      isBlockingRef.current = false;
    };
  }, [isDirty, confirm]);

  /* -------------------------------
     PROGRAMMATIC NAVIGATION GUARD
  -------------------------------- */
  const guardedNavigate = async (action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }

    pendingActionRef.current = action;
    const confirmed = await confirm();

    if (!confirmed) {
      pendingActionRef.current = null;
    }
  };

  return {
    showModal,
    allow,
    block,
    guardedNavigate,
  };
}
