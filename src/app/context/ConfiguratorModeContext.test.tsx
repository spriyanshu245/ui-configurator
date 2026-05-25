// ConfiguratorModeContext.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ConfiguratorModeProvider,
  useConfiguratorMode,
} from "./ConfiguratorModeContext";

// A simple test consumer component that uses the hook.
const TestConsumer: React.FC = () => {
  const { mode } = useConfiguratorMode();
  return <div data-testid="mode">{mode}</div>;
};

describe("ConfiguratorModeContext", () => {
  it("provides the correct mode when used within the provider", () => {
    render(
      <ConfiguratorModeProvider mode="microsite">
        <TestConsumer />
      </ConfiguratorModeProvider>
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("microsite");
  });

  it("throws an error when used outside the provider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useConfiguratorMode must be used within a ConfiguratorModeProvider"
    );
  });
});
