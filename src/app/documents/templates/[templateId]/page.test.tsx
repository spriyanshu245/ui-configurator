import { render, screen } from "@testing-library/react";
import DocumentTemplateDesignerPage from "./page";

jest.mock(
  "@/app/template-designer/components/TemplateDesigner/TemplateDesigner",
  () => ({
    __esModule: true,
    default: ({
      templateId,
      mode,
      listingRoute,
    }: {
      templateId: string;
      mode: string;
      listingRoute: string;
    }) => (
      <div
        data-testid="template-designer"
        data-template-id={templateId}
        data-mode={mode}
        data-listing-route={listingRoute}
      />
    ),
  }),
);

describe("DocumentTemplateDesignerPage", () => {
  it("resolves params and renders TemplateDesigner with document mode", async () => {
    const params = Promise.resolve({ templateId: "doc-42" });
    const Page = await DocumentTemplateDesignerPage({ params });
    render(Page);
    const node = screen.getByTestId("template-designer");
    expect(node).toHaveAttribute("data-template-id", "doc-42");
    expect(node).toHaveAttribute("data-mode", "document");
    expect(node).toHaveAttribute("data-listing-route", "/documents/templates");
  });
});
