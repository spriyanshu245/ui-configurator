import React from "react";
import { render, screen } from "@testing-library/react";
import ConfigClientWrapper from "./ConfigClientWrapper";

// We mock ConfigProvider to simply wrap children in a div with a test id.
jest.mock("@/app/context/ConfigContext", () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="config-provider">{children}</div>
  ),
}));

describe("ConfigClientWrapper", () => {
  test("wraps children with ConfigProvider", () => {
    render(
      <ConfigClientWrapper>
        <div data-testid="child">Hello World</div>
      </ConfigClientWrapper>
    );
    expect(screen.getByTestId("config-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent("Hello World");
  });
});
