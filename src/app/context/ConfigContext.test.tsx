import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider, useConfig } from "./ConfigContext";

beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      NEXT_PUBLIC_CONFIG_ENGINE_BASE_URL: "http://localhost",
    }),
  });
});

// A simple test component that consumes the config context.
const TestComponent = () => {
  const { config, isLoading, error } = useConfig();
  return (
    <div>
      {isLoading && <span>Loading</span>}
      {error && <span>Error: {error}</span>}
      {config && <span>Config: {JSON.stringify(config)}</span>}
    </div>
  );
};

describe("ConfigProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets config when fetch is successful", async () => {
    const fakeConfig = {
      NEXT_PUBLIC_CONFIG_ENGINE_BASE_URL: "http://localhost",
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeConfig,
    });
    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(`Config: ${JSON.stringify(fakeConfig)}`)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText("Loading")).toBeNull();
    (global.fetch as jest.Mock).mockRestore();
  });

  test("sets error when fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });
    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );
    await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());
    (global.fetch as jest.Mock).mockRestore();
  });
});
