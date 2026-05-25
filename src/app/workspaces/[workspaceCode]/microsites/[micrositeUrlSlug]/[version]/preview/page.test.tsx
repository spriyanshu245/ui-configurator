import React from "react";
import { render, waitFor, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewPage from "./page";
import { apiRequest } from "@/app/services/APIService";

const mockUseParams = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

jest.mock("@/app/utils/constants", () => ({
  DATA_TYPE_CONFIG: {
    microsites: { endpoint: "/api/microsites" },
  },
}));

jest.mock(
  "@/app/components/PreviewWindow/PreviewWindow",
  () => (props: any) => {
    return (
      <div data-testid="preview-window">
        <span data-testid="props-active-page">{props.activePageSlug}</span>
        <span data-testid="props-microsite-title">
          {props.microsite?.title}
        </span>
      </div>
    );
  },
);

jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

describe("PreviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders PreviewWindow on successful API response with firstPageCode", async () => {
    mockUseParams.mockReturnValue({
      micrositeUrlSlug: "test-microsite",
      version: "v1.0",
      workspaceCode: "ws-1",
    });

    const mockMicrositeData = {
      title: "My Awesome Site",
      firstPageCode: "home_page",
      sourceSystem: "CMS",
      pages: [{ id: "p1" }],
    };

    (apiRequest as jest.Mock).mockResolvedValue(mockMicrositeData);

    await act(async () => {
      render(<PreviewPage />);
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/api/microsites/test-microsite?version=1.0",
        headers: { "workspace-code": "ws-1" },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("preview-window")).toBeInTheDocument();
    });

    expect(screen.getByTestId("props-active-page")).toHaveTextContent(
      "home_page",
    );
    expect(screen.getByTestId("props-microsite-title")).toHaveTextContent(
      "My Awesome Site",
    );
  });

  test("renders nothing (empty fragment) if API response lacks firstPageCode", async () => {
    mockUseParams.mockReturnValue({
      micrositeUrlSlug: "test-microsite",
      version: "v1",
      workspaceCode: "ws-1",
    });

    const incompleteData = {
      title: "Incomplete Site",
      pages: [],
    };

    (apiRequest as jest.Mock).mockResolvedValue(incompleteData);

    await act(async () => {
      render(<PreviewPage />);
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Loading microsite..."),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("preview-window")).not.toBeInTheDocument();
  });

  test("handles API error by logging error and sticking to loading state", async () => {
    mockUseParams.mockReturnValue({
      micrositeUrlSlug: "test-microsite",
      version: "v1",
      workspaceCode: "ws-1",
    });

    const error = new Error("Network Error");
    (apiRequest as jest.Mock).mockRejectedValue(error);

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await act(async () => {
      render(<PreviewPage />);
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    expect(screen.getByText("Loading microsite...")).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch microsite page:",
      error,
    );

    consoleErrorSpy.mockRestore();
  });
});
