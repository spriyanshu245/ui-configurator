import { Microsite } from "@/app/types/types";
import BaseConfigFormPane from "@/app/components/BaseConfigFormPane/BaseConfigFormPane";
import { useWorkspaceMicrosite } from "@/app/hooks/useWorkspaceMicrosite";
import {
  createPortalTaskConfig,
  duplicatePortalTaskConfig,
} from "@/app/services/portalTaskServices";
import { PortalTaskConfigListing } from "@/app/types/accessControlConfig";
interface PortalTaskFormPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (portalTaskConfigCode: string) => void;
  mode?: "create" | "duplicate";
  sourcePortalTaskConfig?: PortalTaskConfigListing;
}

const PortalTaskFormPane = (props: PortalTaskFormPaneProps) => {
  const hook = useWorkspaceMicrosite({
    isOpen: props.isOpen,
    isDuplicateMode: props.mode === "duplicate",
    sourceConfig: props.sourcePortalTaskConfig,
    getMicrositeSlug: (s: PortalTaskConfigListing) => s.micrositeSlug,
    getVersion: (s: PortalTaskConfigListing) => s.version,
  });

  return (
    <BaseConfigFormPane
      {...props}
      title="Portal Task Config"
      duplicateLabel="Duplicating from:"
      inputLabel="Portal Task Code"
      placeholder="Enter Portal Task code"
      getSourceCode={(s: PortalTaskConfigListing) => s.portalTaskConfigCode}
      workspaceHook={hook}
      onSubmitHandler={async ({
        code,
        microsite,
        sourceConfig,
        isDuplicate,
      }: {
        code: string;
        microsite: Microsite;
        sourceConfig?: PortalTaskConfigListing;
        isDuplicate: boolean;
      }) => {
        if (isDuplicate && sourceConfig) {
          await duplicatePortalTaskConfig(sourceConfig, code);
        } else {
          await createPortalTaskConfig({
            portalTaskConfigCode: code,
            micrositeSlug: microsite.code,
            version: microsite.version,
          });
        }
      }}
    />
  );
};

export default PortalTaskFormPane;
