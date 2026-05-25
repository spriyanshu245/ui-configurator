import { Microsite } from "@/app/types/types";
import BaseConfigFormPane from "@/app/components/BaseConfigFormPane/BaseConfigFormPane";
import { useWorkspaceMicrosite } from "@/app/hooks/useWorkspaceMicrosite";
import {
  createAccessConfig,
  duplicateAccessConfig,
} from "@/app/services/accessConfigServices";
import { AccessConfigListing } from "@/app/types/accessControlConfig";
interface AccessControlFormPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (accessConfigCode: string) => void;
  mode?: "create" | "duplicate";
  sourceAccessConfig?: AccessConfigListing;
}

const AccessControlFormPane = (props: AccessControlFormPaneProps) => {
  const hook = useWorkspaceMicrosite({
    isOpen: props.isOpen,
    isDuplicateMode: props.mode === "duplicate",
    sourceConfig: props.sourceAccessConfig,
    getMicrositeSlug: (s: AccessConfigListing) => s.micrositeSlug,
    getVersion: (s: AccessConfigListing) => s.version,
  });

  return (
    <BaseConfigFormPane
      {...props}
      title="Access Config"
      duplicateLabel="Duplicating from:"
      inputLabel="Access Config Code"
      placeholder="Enter access config code"
      getSourceCode={(s: AccessConfigListing) => s.accessConfigCode}
      workspaceHook={hook}
      onSubmitHandler={async ({
        code,
        microsite,
        sourceConfig,
        isDuplicate,
      }: {
        code: string;
        microsite: Microsite;
        sourceConfig?: AccessConfigListing;
        isDuplicate: boolean;
      }) => {
        if (isDuplicate && sourceConfig) {
          await duplicateAccessConfig(sourceConfig, code);
        } else {
          await createAccessConfig({
            accessConfigCode: code,
            micrositeSlug: microsite.code,
            version: microsite.version,
          });
        }
      }}
    />
  );
};

export default AccessControlFormPane;
