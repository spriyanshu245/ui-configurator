import { render, screen } from "@testing-library/react";
import CommunicationTemplateDesignerPage from "./page";

jest.mock(
  "@/app/template-designer/components/TemplateDesigner/TemplateDesigner",
  () => ({
    __esModule: true,
    default: ({
      templateId,
      mode,
      listingRoute,
      communicationType,
      communicationSubscriptionKey,
    }: {
      templateId: string;
      mode: string;
      listingRoute: string;
      communicationType?: string;
      communicationSubscriptionKey?: string;
    }) => (
      <div
        data-testid="template-designer"
        data-template-id={templateId}
        data-mode={mode}
        data-listing-route={listingRoute}
        data-type={communicationType ?? ""}
        data-subscription-key={communicationSubscriptionKey ?? ""}
      />
    ),
  }),
);

describe("CommunicationTemplateDesignerPage", () => {
  it("resolves params and search params and forwards them to the designer", async () => {
    const params = Promise.resolve({ templateId: "tmpl-7" });
    const searchParams = Promise.resolve({
      type: "WELCOME",
      subscriptionKey: "WELCOME_EMAIL",
    });
    const Page = await CommunicationTemplateDesignerPage({
      params,
      searchParams,
    });
    render(Page);

    const node = screen.getByTestId("template-designer");
    expect(node).toHaveAttribute("data-template-id", "tmpl-7");
    expect(node).toHaveAttribute("data-mode", "communication");
    expect(node).toHaveAttribute(
      "data-listing-route",
      "/communications/templates",
    );
    expect(node).toHaveAttribute("data-type", "WELCOME");
    expect(node).toHaveAttribute("data-subscription-key", "WELCOME_EMAIL");
  });

  it("works when no search params are provided", async () => {
    const params = Promise.resolve({ templateId: "tmpl-9" });
    const searchParams = Promise.resolve({});
    const Page = await CommunicationTemplateDesignerPage({
      params,
      searchParams,
    });
    render(Page);

    const node = screen.getByTestId("template-designer");
    expect(node).toHaveAttribute("data-template-id", "tmpl-9");
    expect(node).toHaveAttribute("data-type", "");
    expect(node).toHaveAttribute("data-subscription-key", "");
  });
});
