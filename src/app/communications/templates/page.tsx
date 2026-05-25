"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import CommunicationTemplateManager from "@/app/communications/templates/components/CommunicationTemplateManager";

const CommunicationTemplateListingInner = () => {
  const { setPageTitle, resetResourceData, setBackRoute, setShowCloseIcon } =
    useHeaderV2();
  const searchParams = useSearchParams();
  const backWs = searchParams.get("backWs");

  useEffect(() => {
    setPageTitle("Communication Templates");
    resetResourceData();
    setShowCloseIcon(true);
    setBackRoute(
      backWs ? `/workspaces?ws=${encodeURIComponent(backWs)}` : "/workspaces",
    );
  }, [setPageTitle, resetResourceData, setShowCloseIcon, setBackRoute, backWs]);

  return (
    <>
      <HeaderV2 />
      <CommunicationTemplateManager />
    </>
  );
};

const CommunicationTemplateListing = () => (
  <Suspense fallback={null}>
    <CommunicationTemplateListingInner />
  </Suspense>
);

export default CommunicationTemplateListing;
