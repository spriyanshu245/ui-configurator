import TemplateDesigner from "@/app/template-designer/components/TemplateDesigner/TemplateDesigner";
import { TemplateDesignerPageProps } from "@/app/template-designer/types";

const DocumentTemplateDesignerPage = async ({
  params,
}: TemplateDesignerPageProps) => {
  const { templateId } = await params;

  return (
    <TemplateDesigner
      templateId={templateId}
      mode="document"
      listingRoute="/documents/templates"
    />
  );
};

export default DocumentTemplateDesignerPage;
