"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TemplateList from "@/app/documents/templates/components/TemplateList";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";

const DocumentTemplateListingInner = () => {
  const { setPageTitle, resetResourceData, setBackRoute, setShowCloseIcon } =
    useHeaderV2();
  const searchParams = useSearchParams();
  const backWs = searchParams.get("backWs");

  useEffect(() => {
    setPageTitle("Document Templates");
    resetResourceData();
    setShowCloseIcon(true);
    setBackRoute(
      backWs ? `/workspaces?ws=${encodeURIComponent(backWs)}` : "/workspaces",
    );
  }, [setPageTitle, setShowCloseIcon, backWs, setBackRoute, resetResourceData]);

  return (
    <>
      <HeaderV2 />
      <Suspense fallback={null}>
        <TemplateList
          baseRoute="/documents/templates"
          title="Document Templates"
        />
      </Suspense>
    </>
  );
};

const DocumentTemplateListing = () => (
  <Suspense fallback={null}>
    <DocumentTemplateListingInner />
  </Suspense>
);

export default DocumentTemplateListing;
