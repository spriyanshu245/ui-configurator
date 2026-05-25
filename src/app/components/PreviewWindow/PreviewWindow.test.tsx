import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PreviewWindow from "./PreviewWindow";

const mockApiRequest = jest.fn();
jest.mock("@/app/services/APIService", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("@/app/utils/utils", () => ({
  ...jest.requireActual("@/app/utils/utils"),
  reloadWindow: jest.fn(),
  closeWindow: jest.fn(),
}));

import { reloadWindow, closeWindow } from "@/app/utils/utils";

let capturedGetPageDSL: ((pageCode: string) => Promise<unknown>) | null = null;

jest.mock("@rahi/web-renderer-lib", () => ({
  MicrositeRenderer: (props: {
    getPageDSL: (pageCode: string) => Promise<unknown>;
  }) => {
    capturedGetPageDSL = props.getPageDSL;
    return <div data-testid="microsite-renderer" />;
  },
}));

const mockMicrosite = {
  pages: [],
  metadata: {
    title: "Test Microsite",
  },
};

describe("PreviewWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedGetPageDSL = null;
  });

  it("renders preview heading", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders MicrositeRenderer with correct props", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    expect(screen.getByTestId("microsite-renderer")).toBeInTheDocument();
  });

  it("calls reloadWindow when refresh button is clicked", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    fireEvent.click(screen.getByTitle("Refresh Preview"));
    expect(reloadWindow).toHaveBeenCalledTimes(1);
  });

  it("calls closeWindow when exit button is clicked", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    fireEvent.click(screen.getByTitle("Close Preview"));
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });

  it("changes to mobile view when mobile button is clicked", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    const mobileButton = screen.getByTitle("Mobile View");
    fireEvent.click(mobileButton);
    expect(mobileButton.className).toContain("active");
  });

  it("changes to desktop view when desktop button is clicked", () => {
    render(
      <PreviewWindow
        microsite={mockMicrosite}
        activePageSlug="test-page"
        micrositeSlug="test-site"
      />,
    );
    const mobileButton = screen.getByTitle("Mobile View");
    const desktopButton = screen.getByTitle("Desktop View");

    fireEvent.click(mobileButton);
    expect(mobileButton.className).toContain("active");

    fireEvent.click(desktopButton);
    expect(desktopButton.className).toContain("active");
  });

  describe("getPageDSL", () => {
    it("returns page data when API call succeeds", async () => {
      const mockPageData = {
        code: "page-1",
        name: "Test Page",
        components: [],
      };
      mockApiRequest.mockResolvedValueOnce(mockPageData);

      render(
        <PreviewWindow
          microsite={mockMicrosite}
          activePageSlug="test-page"
          micrositeSlug="test-site"
        />,
      );

      expect(capturedGetPageDSL).toBeDefined();
      const result = await capturedGetPageDSL!("page-code");
      expect(result).toEqual(mockPageData);
      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/pages/page-code?version=1",
        method: "GET",
      });
    });

    it("logs error and returns undefined when API returns error", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      mockApiRequest.mockResolvedValueOnce({ error: "Not found" });

      render(
        <PreviewWindow
          microsite={mockMicrosite}
          activePageSlug="test-page"
          micrositeSlug="test-site"
        />,
      );

      const result = await capturedGetPageDSL!("invalid-code");
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch page DSL",
        "Not found",
      );
      consoleSpy.mockRestore();
    });

    it("logs error when API call throws exception", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      mockApiRequest.mockRejectedValueOnce(error);

      render(
        <PreviewWindow
          microsite={mockMicrosite}
          activePageSlug="test-page"
          micrositeSlug="test-site"
        />,
      );

      const result = await capturedGetPageDSL!("error-code");
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch page by code:",
        "error-code",
        error,
      );
      consoleSpy.mockRestore();
    });

    it("passes sourceSystem prop to renderer", () => {
      render(
        <PreviewWindow
          microsite={mockMicrosite}
          activePageSlug="test-page"
          micrositeSlug="test-site"
          sourceSystem="test-system"
        />,
      );
      expect(screen.getByTestId("microsite-renderer")).toBeInTheDocument();
    });
  });
});
