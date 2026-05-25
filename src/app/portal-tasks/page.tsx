"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import PortalTaskList from "./components/PortalTaskList/PortalTaskList";

const PortalTasksPageInner = () => {
  const { setPageTitle, resetResourceData, setShowCloseIcon, setBackRoute } =
    useHeaderV2();
  const searchParams = useSearchParams();
  const backWs = searchParams.get("backWs");

  useEffect(() => {
    setPageTitle("Portal Task Configurations");
    resetResourceData();
    setShowCloseIcon(true);
    setBackRoute(
      backWs ? `/workspaces?ws=${encodeURIComponent(backWs)}` : "/workspaces",
    );
  }, [setPageTitle, setShowCloseIcon, resetResourceData, setBackRoute, backWs]);

  return (
    <>
      <HeaderV2 />
      <Suspense fallback={null}>
        <PortalTaskList />
      </Suspense>
    </>
  );
};

const PortalTasksPage = () => (
  <Suspense fallback={null}>
    <PortalTasksPageInner />
  </Suspense>
);

export default PortalTasksPage;
