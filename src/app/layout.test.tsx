import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata } from "./layout";

// Mock fonts so that we can check the body classes.
jest.mock("@/app/fonts/baseFonts", () => ({
  gotham: { className: "gotham" },
  graphik: { className: "graphik" },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/",
}));

jest.mock("@/platforms/session/SessionBootstrap", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/platforms/session/SessionGuard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  MicrositeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ConfigClientWrapper and HeaderProvider so that we can detect their rendering.
jest.mock("@/app/components/ConfigClientWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="config-client-wrapper">{children}</div>
  ),
}));
jest.mock("@/app/context/HeaderContextV2", () => ({
  HeaderProviderV2: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="header-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  test("renders html element with lang 'en' and body with font classes", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );
    expect(markup).toContain("Test Child");
    expect(markup).toContain("config-client-wrapper");
    expect(markup).toContain("header-provider");
  });

  test("exports metadata correctly", () => {
    expect(metadata.title).toBe("UI Configurator");
    expect(metadata.description).toBe("");
  });
});
