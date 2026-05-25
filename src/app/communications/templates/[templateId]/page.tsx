import TemplateDesigner from "@/app/template-designer/components/TemplateDesigner/TemplateDesigner";

interface CommunicationTemplateDesignerPageProps {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{
    type?: string;
    subscriptionKey?: string;
  }>;
}

const CommunicationTemplateDesignerPage = async ({
  params,
  searchParams,
}: CommunicationTemplateDesignerPageProps) => {
  const { templateId } = await params;
  const { type, subscriptionKey } = await searchParams;

  return (
    <TemplateDesigner
      templateId={templateId}
      mode="communication"
      listingRoute="/communications/templates"
      communicationType={type}
      communicationSubscriptionKey={subscriptionKey}
    />
  );
};

export default CommunicationTemplateDesignerPage;
