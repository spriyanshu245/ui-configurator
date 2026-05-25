"use client";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WorkspaceItem } from "@/app/types/types";

export const useSelectedWorkspace = (
  workspaces: WorkspaceItem[],
): [string | null, (code: string) => void] => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedWorkspaceCode, setSelectedWorkspaceCode] = useState<
    string | null
  >(() => searchParams.get("ws"));

  useEffect(() => {
    if (workspaces.length === 0) return;
    if (
      selectedWorkspaceCode &&
      workspaces.some((ws) => ws.code === selectedWorkspaceCode)
    ) {
      return;
    }
    setSelectedWorkspaceCode(workspaces[0].code);
  }, [workspaces, selectedWorkspaceCode]);

  useEffect(() => {
    if (!selectedWorkspaceCode) return;
    const currentWs = searchParams.get("ws");
    if (currentWs === selectedWorkspaceCode) return;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("ws", selectedWorkspaceCode);
    router.replace(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });
  }, [selectedWorkspaceCode, searchParams, router, pathname]);

  const setSelectedCode = useCallback((code: string) => {
    setSelectedWorkspaceCode(code);
  }, []);

  return [selectedWorkspaceCode, setSelectedCode];
};
