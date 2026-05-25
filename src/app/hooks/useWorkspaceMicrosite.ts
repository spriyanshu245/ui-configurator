"use client";

import { useEffect, useState } from "react";
import {
  fetchMicrositeList,
  fetchWorkspaceList,
} from "@/app/services/microsite.service";
import { WorkspaceItem, Microsite } from "@/app/types/types";

interface UseWorkspaceMicrositeProps<T> {
  isOpen: boolean;
  isDuplicateMode: boolean;
  sourceConfig?: T;
  getMicrositeSlug: (source: T) => string;
  getVersion: (source: T) => number;
}

export const useWorkspaceMicrosite = <T>({
  isOpen,
  isDuplicateMode,
  sourceConfig,
  getMicrositeSlug,
  getVersion,
}: UseWorkspaceMicrositeProps<T>) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceItem | null>(null);
  const [micrositeVersions, setMicrositeVersions] = useState<Microsite[]>([]);
  const [selectedMicrosite, setSelectedMicrosite] = useState<Microsite | null>(
    null
  );

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingMicrosites, setLoadingMicrosites] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedWorkspace(null);
      setSelectedMicrosite(null);
      setMicrositeVersions([]);
      return;
    }

    const loadWorkspaces = async () => {
      try {
        setLoadingWorkspaces(true);
        const list = await fetchWorkspaceList();
        setWorkspaces(list);

        if (isDuplicateMode && sourceConfig) {
          const slug = getMicrositeSlug(sourceConfig);

          const workspace = list.find((w: any) =>
            w.microsites?.some((m: any) => m.code === slug)
          );

          if (workspace) setSelectedWorkspace(workspace);
        }
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedWorkspace) {
      setMicrositeVersions([]);
      setSelectedMicrosite(null);
      return;
    }

    const loadMicrosites = async () => {
      try {
        setLoadingMicrosites(true);
        
        const versions = await fetchMicrositeList(selectedWorkspace.code);
        setMicrositeVersions(versions);

        if (isDuplicateMode && sourceConfig) {
          const slug = getMicrositeSlug(sourceConfig);
          const version = getVersion(sourceConfig);

          const found = versions.find(
            (m) => m.code === slug && m.version === version
          );

          if (found) setSelectedMicrosite(found);
        }
      } finally {
        setLoadingMicrosites(false);
      }
    };

    loadMicrosites();
  }, [selectedWorkspace]);

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    micrositeVersions,
    selectedMicrosite,
    setSelectedMicrosite,
    loadingWorkspaces,
    loadingMicrosites,
  };
};
