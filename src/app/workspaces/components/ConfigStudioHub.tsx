"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { WorkspaceItem, IRequestData } from "@/app/types/types";
import { getAllRecords, deleteRecord } from "@/app/utils/dataTableUtils";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import Card from "@/app/components/Card/Card";
import RahiLogo from "@/app/components/SVGIcons/Rahi";
import WorkspaceSelector from "./WorkspaceSelector/WorkspaceSelector";
import { useSelectedWorkspace } from "@/app/hooks/useSelectedWorkspace";
import styles from "./ConfigStudioHub.module.scss";
import { getBaseUrl } from "@/app/utils/utils";

const dataConfig = DATA_TYPE_CONFIG["workspace"];

const ConfigStudioHubInner = () => {
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();
  const appEnv = process.env.NODE_ENV;

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaceCode, setSelectedCode] =
    useSelectedWorkspace(workspaces);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const requestData: IRequestData = {
          method: "GET",
          endpoint: dataConfig.endpoint,
        };
        const data = await getAllRecords<WorkspaceItem>(requestData);
        if (!cancelled) {
          setWorkspaces(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleWorkspaceCreated = (code: string, name: string) => {
    setWorkspaces((prev) => [...prev, { code, name }]);
    setSelectedCode(code);
    setUserNotification({
      type: "success",
      text: "Workspace created",
      time: 2000,
    });
  };

  const handleDelete = useCallback(
    async (item: WorkspaceItem) => {
      try {
        await deleteRecord(dataConfig, item.code);
        setWorkspaces((prev) => prev.filter((ws) => ws.code !== item.code));
        if (selectedWorkspaceCode === item.code) {
          const remaining = workspaces.filter((ws) => ws.code !== item.code);
          if (remaining.length > 0) setSelectedCode(remaining[0].code);
        }
        setUserNotification({
          type: "success",
          text: "Workspace deleted",
          time: 2000,
        });
      } catch (err) {
        setUserNotification({
          type: "error",
          text:
            err instanceof Error ? err.message : "Failed to delete workspace",
          time: 2500,
        });
      }
    },
    [selectedWorkspaceCode, setSelectedCode, workspaces, setUserNotification],
  );

  const handleUpdateSuccess = (payload: { code: string; name: string }) => {
    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.code === payload.code ? { ...ws, name: payload.name } : ws,
      ),
    );
    setUserNotification({
      type: "success",
      text: "Workspace updated",
      time: 2000,
    });
  };

  const requireWorkspace = (action: () => void) => {
    if (!selectedWorkspaceCode) {
      setUserNotification({
        type: "error",
        text: "Please select a workspace first",
        time: 2500,
      });
      return;
    }
    action();
  };

  const navigateTo = (path: string) => router.push(path);
  const navigateExternal = (url: string) => window.open(url, "_blank");

  if (loading) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.hero}>
        <div className={styles.logoContainer}>
          <RahiLogo />
        </div>
        <h1 className={styles.heroTitle}>Welcome to Config Studio</h1>
      </div>

      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={selectedWorkspaceCode}
        onSelect={setSelectedCode}
        onCreated={handleWorkspaceCreated}
        onUpdated={handleUpdateSuccess}
        onDelete={handleDelete}
      />

      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Build & Design</h3>
        <div className={styles.cardGrid}>
          <Card
            title="Microsites"
            icon="microsite"
            description="Microsites are independent websites with multiple pages which can build complex UIs."
            onClickHandler={() =>
              requireWorkspace(() =>
                navigateTo(`/workspaces/${selectedWorkspaceCode}/microsites`),
              )
            }
          />
          <Card
            title="Communications"
            icon="template"
            description="Manage email, SMS, WhatsApp, and other templates and their subscriptions."
            onClickHandler={() =>
              navigateTo(
                selectedWorkspaceCode
                  ? `/communications/templates?backWs=${encodeURIComponent(selectedWorkspaceCode)}`
                  : "/communications/templates",
              )
            }
          />
          <Card
            title="Documents"
            icon="template"
            description="Create reusable document templates for generated statements, PDFs and email attachments."
            onClickHandler={() =>
              navigateTo(
                selectedWorkspaceCode
                  ? `/documents/templates?backWs=${encodeURIComponent(selectedWorkspaceCode)}`
                  : "/documents/templates",
              )
            }
          />
          <Card
            title="Rules"
            icon="rules"
            description="Configure dynamic business logic to personalize content and control behavior."
            isExternal
            onClickHandler={() =>
              requireWorkspace(() =>
                navigateExternal(getBaseUrl("rule-designer", appEnv)),
              )
            }
          />
          <Card
            title="Workflows"
            icon="workflow"
            description="Automate multi-step processes and orchestrate user actions across the platform."
            isExternal
            onClickHandler={() =>
              requireWorkspace(() =>
                navigateExternal(getBaseUrl("workflow-designer", appEnv)),
              )
            }
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Administration</h3>
        <div className={styles.cardGrid}>
          <Card
            title="Portal Tasks"
            icon="fingerprint"
            description="Configure background tasks and automated portal operations."
            onClickHandler={() =>
              navigateTo(
                selectedWorkspaceCode
                  ? `/portal-tasks?backWs=${encodeURIComponent(selectedWorkspaceCode)}`
                  : "/portal-tasks",
              )
            }
          />
          <Card
            title="Access Controls"
            icon="lock"
            description="Manage role-based access and permissions for portal features."
            onClickHandler={() =>
              navigateTo(
                selectedWorkspaceCode
                  ? `/access-controls?backWs=${encodeURIComponent(selectedWorkspaceCode)}`
                  : "/access-controls",
              )
            }
          />
          <Card
            title="Portal Menu"
            icon="menu"
            description="Define and organize the navigation sidebar for the portal."
            onClickHandler={() => navigateTo("/menu")}
          />
        </div>
      </section>
    </div>
  );
};

const ConfigStudioHub = () => (
  <Suspense fallback={null}>
    <ConfigStudioHubInner />
  </Suspense>
);

export default ConfigStudioHub;
