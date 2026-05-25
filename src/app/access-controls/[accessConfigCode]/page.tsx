"use client";

import { use } from "react";

import {
  getAccessConfig,
  updateAccessConfig,
} from "@/app/services/accessConfigServices";
import {
  AccessConfigDetail,
  AccessControlConfig,
} from "@/app/types/accessControlConfig";
import { useConfigDetail } from "@/app/hooks/useConfigDetail";
import {
  convertDSLToBaseConfig,
  mapToBaseConfig,
} from "@/app/utils/accessControlUtils";
import BaseConfigDetailPage from "@/app/components/BaseConfigDetailPage/BaseConfigDetailPage";
import { fetchMicrositeDSLBySlug } from "@/app/services/microsite.service";
interface PageProps {
  params: Promise<{ accessConfigCode: string }>;
}
export default function AccessControlDetailPage({ params }: Readonly<PageProps>) {
  const { accessConfigCode } = use(params);
  const code = decodeURIComponent(accessConfigCode);

  const hook = useConfigDetail<AccessControlConfig, AccessConfigDetail>({
    code,
    fetchConfig: getAccessConfig,
    fetchDSL: fetchMicrositeDSLBySlug,
    convertDSL: (dsl) =>
      convertDSLToBaseConfig<AccessControlConfig>(dsl, {
        accessConfigId: "",
        accessConfigCode: "",
      }),
    mapFromApi: (data) =>
      mapToBaseConfig<AccessControlConfig>(data, {
        accessConfigId: data.accessConfigId,
        accessConfigCode: data.accessConfigCode,
      }),
  });

  return (
    <BaseConfigDetailPage<AccessControlConfig>
      {...hook}
      title="Access Configurations"
      code={code}
      listRoute="/access-controls"
      onSave={(config) => updateAccessConfig(code, config)}
    />
  );
}
