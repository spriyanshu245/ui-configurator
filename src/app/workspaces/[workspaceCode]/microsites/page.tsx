"use client";
import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import MicrositeList from "@/app/workspaces/[workspaceCode]/microsites/components/MicrositeList";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { ControlPanelProvider } from "@/app/context/ControlPanelContext";
import { UserTaskProvider } from "@/app/context/UserTaskContext";

const Microsites = () => {
  const { workspaceCode } = useParams();
  const searchParams = useSearchParams();
  const backQuery = searchParams.get("backQuery");
  const {
    setPageTitle,
    setBackRoute,
    setShowCloseIcon,
    setResourceCode,
    resetResourceData,
  } = useHeaderV2();

  useEffect(() => {
    const wsParam = `ws=${encodeURIComponent(workspaceCode as string)}`;
    const backRoute = backQuery
      ? `/workspaces?${wsParam}&q=${encodeURIComponent(backQuery)}`
      : `/workspaces?${wsParam}`;
    setPageTitle("Microsites");
    setBackRoute(backRoute);
    setShowCloseIcon(true);
    resetResourceData();
    setResourceCode(workspaceCode as string);
  }, [
    backQuery,
    workspaceCode,
    setPageTitle,
    setBackRoute,
    setShowCloseIcon,
    setResourceCode,
    resetResourceData,
  ]);

  return (
    <>
      <ControlPanelProvider>
        <UserTaskProvider>
          <HeaderV2 />
        </UserTaskProvider>
      </ControlPanelProvider>
      <Suspense fallback={null}>
        <MicrositeList />
      </Suspense>
    </>
  );
};

export default Microsites;
