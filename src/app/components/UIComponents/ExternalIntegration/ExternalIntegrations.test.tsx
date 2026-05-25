import React from "react";
import { render, screen } from "@testing-library/react";
import ExternalIntegration from "./ExternalIntegration";
import { BaseComponent } from "@/app/types/types";
import { availableComponents } from "@/app/data/availableComponents";
import { externalServices } from "@/app/utils/constants";

const baseComponent: BaseComponent = {
  id: "ext-1",
  type: "external-integration",
  category: "component",
  properties: {
    label: "External Integration",
    showLabel: true,
  },
};

describe("ExternalIntegration component", () => {
  it("renders fallback content and default icon when no service is selected", () => {
    render(<ExternalIntegration component={baseComponent} />);

    expect(screen.getByText("External Integration")).toBeInTheDocument();
    expect(screen.getByText("Select a Service")).toBeInTheDocument();
    expect(screen.getByText("No API configured")).toBeInTheDocument();
  });

  it("shows the selected service, api name, and mapped icon", () => {
    const componentWithService: BaseComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        selectedService: "kyc-verification",
        apiName: "KYC API",
      },
    };

    render(<ExternalIntegration component={componentWithService} />);

    expect(screen.getByText("kyc-verification")).toBeInTheDocument();
    expect(screen.getByText("API: KYC API")).toBeInTheDocument();

  });
});

describe("External integration configuration", () => {
  it("registers the external-integration component with default properties", () => {
    const externalIntegration = availableComponents.find(
      (component: any) => component.type === "external-integration"
    );

    expect(externalIntegration).toBeDefined();
    expect(externalIntegration?.properties?.selectedService).toBe("");
    expect(externalIntegration?.properties?.method).toBe("POST");
    expect(externalIntegration?.properties?.iconPosition).toBe("left");
    expect(externalIntegration?.properties?.iconSpacing).toBe(4);
  });

  it("exposes external services for selection in the action panel", () => {
    const values = externalServices.map((svc: any) => svc.value);
    expect(values).toEqual([
      "kyc-verification",
      "account-aggregator",
      "offline-kyc-verification",
      "mandate-registration",
    ]);
  });
});
