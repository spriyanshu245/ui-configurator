"use client";

import { use } from "react";
import { useConfigDetail } from "@/app/hooks/useConfigDetail";
import {
  convertDSLToBaseConfig,
  mapToBaseConfig,
} from "@/app/utils/accessControlUtils";
import BaseConfigDetailPage from "@/app/components/BaseConfigDetailPage/BaseConfigDetailPage";
import {
  getPortalTaskConfig,
  updatePortalTaskConfig,
} from "@/app/services/portalTaskServices";
import { fetchMicrositeDSLBySlug } from "@/app/services/microsite.service";
import {
  PortalTaskDetail,
  PortalTaskConfig,
} from "@/app/types/accessControlConfig";
interface PageProps {
  params: Promise<{ portalTaskCode: string }>;
}
export default function AccessControlDetailPage({ params }: Readonly<PageProps>) {
  const { portalTaskCode } = use(params);
  const code = decodeURIComponent(portalTaskCode);

  const hook = useConfigDetail<PortalTaskConfig, PortalTaskDetail>({
    code,
    fetchConfig: getPortalTaskConfig,
    fetchDSL: fetchMicrositeDSLBySlug,
    convertDSL: (dsl) =>
      convertDSLToBaseConfig<PortalTaskConfig>(dsl, {
        portalTaskConfigCode: "",
      }),
    mapFromApi: (data) =>
      mapToBaseConfig<PortalTaskConfig>(data, {
        portalTaskConfigCode: data.portalTaskConfigCode,
      }),
  });

  return (
    <BaseConfigDetailPage<PortalTaskConfig>
      {...hook}
      title="Portal Task Configurations"
      code={code}
      listRoute="/portal-tasks"
      onSave={(config) => updatePortalTaskConfig(code, config)}
    />
  );
}
