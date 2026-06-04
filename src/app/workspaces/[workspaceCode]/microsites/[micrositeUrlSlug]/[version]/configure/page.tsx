"use client";
import { useEffect } from "react";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { DragProvider } from "@/app/context/DragContext";
import { ControlPanelProvider } from "@/app/context/ControlPanelContext";
import { MicrositeProvider } from "@/app/context/MicrositeContext";
import MicrositeBuilder from "@/app/components/MicrositeBuilder/MicrositeBuilder";
import { ConfiguratorModeProvider } from "@/app/context/ConfiguratorModeContext";
import { useParams, useSearchParams } from "next/navigation";
import { ChatPanel } from "@/../chat-agent/components/ChatPanel";

const MicrositeConfigurator = () => {
  const { micrositeUrlSlug, version, workspaceCode } = useParams();
  const searchParams = useSearchParams();
  const {
    setPageTitle,
    setBackRoute,
    setShowCloseIcon,
    resetResourceData,
    setResourceCode,
    setResourceVersion,
  } = useHeaderV2();
  const backQuery = searchParams.get("backQuery");
  const micrositeUrl = backQuery
    ? `/workspaces/${workspaceCode}/microsites?q=${encodeURIComponent(backQuery)}`
    : `/workspaces/${workspaceCode}/microsites`;

  useEffect(() => {
    setPageTitle("Microsite Configurator");
    setBackRoute(micrositeUrl);
    setShowCloseIcon(true);
    resetResourceData();
    setResourceCode(micrositeUrlSlug as string);
    setResourceVersion((version ?? "").toString());
  }, [
    setPageTitle,
    setBackRoute,
    setShowCloseIcon,
    resetResourceData,
    setResourceCode,
    setResourceVersion,
  ]);

  return (
    <ControlPanelProvider>
      <MicrositeProvider
        code={micrositeUrlSlug as string}
        version={Number(version?.toString()?.substring(1))}
        workspaceCode={workspaceCode as string}
      >
        <>
          <HeaderV2 />
          <DragProvider>
            <ConfiguratorModeProvider mode="microsite">
              <MicrositeBuilder />
              <ChatPanel />
            </ConfiguratorModeProvider>
          </DragProvider>
        </>
      </MicrositeProvider>
    </ControlPanelProvider>
  );
};

export default MicrositeConfigurator;
