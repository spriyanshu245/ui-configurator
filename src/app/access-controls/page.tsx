"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AccessControlList from "@/app/access-controls/components/AccessControlList/AccessControlList";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";

const AccessControlsPageInner = () => {
  const { setPageTitle, resetResourceData, setShowCloseIcon, setBackRoute } =
    useHeaderV2();
  const searchParams = useSearchParams();
  const backWs = searchParams.get("backWs");

  useEffect(() => {
    setPageTitle("Access Configurations");
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
        <AccessControlList />
      </Suspense>
    </>
  );
};

const AccessControlsPage = () => (
  <Suspense fallback={null}>
    <AccessControlsPageInner />
  </Suspense>
);

export default AccessControlsPage;
