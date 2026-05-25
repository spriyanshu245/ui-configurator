import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react"; // Added act
import { MicrositeProvider, useMicrosite } from "./MicrositeContext";
import "@testing-library/jest-dom";
import { getRecord, getRecordVersions } from "../utils/dataTableUtils";
import { apiRequest } from "../services/APIService";

// --- Mocks ---
jest.mock("../utils/utils", () => ({
  generateRandomId: jest.fn(() => "test-id"),
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

jest.mock("../utils/dataTableUtils", () => ({
  getRecord: jest.fn(),
  getRecordVersions: jest.fn(),
}));

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../components/Loader/Loader", () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

// --- Test Consumer ---
const TestConsumer: React.FC = () => {
  const {
    isEditing,
    microsite,
    activePageCode,
    setActivePage,
    getPages,
    addPage,
    addNewPage,
    removePage,
    updateMicrositeProperties,
    getActivePageCode,
  } = useMicrosite();

  return (
    <div>
      <div data-testid="microsite-name">{microsite.name}</div>
      <div data-testid="active-page-code">{activePageCode || "none"}</div>
      <div data-testid="first-page-code">{microsite.firstPageCode || "none"}</div>
      <div data-testid="get-active-page-code">{getActivePageCode()}</div>
      {/* Explicitly render fallback text for test assertions */}

      <div data-testid="pages">
        {getPages().map((page) => (
          <div key={page.code} data-testid={`page-${page.code}`}>
            {page.code}
          </div>
        ))}
      </div>
      <button
        onClick={() => setActivePage("custom-page")}
        data-testid="set-active-page"
      >
        Set Active Page
      </button>
      <button onClick={() => addPage("new-page")} data-testid="add-page">
        Add Page
      </button>
      <button
        onClick={() => addNewPage("page-added-new")}
        data-testid="add-new-page"
      >
        Add New Page
      </button>
      <button
        onClick={() => removePage(activePageCode || "")}
        data-testid="remove-page"
      >
        Remove Active Page
      </button>
      <button
        onClick={() => updateMicrositeProperties({ name: "Updated Microsite" })}
        data-testid="update-microsite"
      >
        Update Microsite
      </button>
      <div data-testid="editing">{String(isEditing)}</div>
    </div>
  );
};

describe("MicrositeContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provides default values", () => {
    render(
      <MicrositeProvider>
        <TestConsumer />
      </MicrositeProvider>
    );

    expect(screen.getByTestId("microsite-name")).toHaveTextContent(
      "Untitled Microsite"
    );
    expect(screen.getByTestId("active-page-code")).toHaveTextContent("none");
  });

  it("updates activePageCode when setActivePage is called", () => {
    render(
      <MicrositeProvider>
        <TestConsumer />
      </MicrositeProvider>
    );

    fireEvent.click(screen.getByTestId("set-active-page"));
    expect(screen.getByTestId("active-page-code")).toHaveTextContent(
      "custom-page"
    );
  });

  it("sets firstPageCode and active page when the first new page is added", () => {
    render(
      <MicrositeProvider>
        <TestConsumer />
      </MicrositeProvider>
    );

    fireEvent.click(screen.getByTestId("add-new-page"));

    expect(screen.getByTestId("first-page-code")).toHaveTextContent(
      "page-added-new",
    );
    expect(screen.getByTestId("active-page-code")).toHaveTextContent(
      "page-added-new",
    );
  });

  it("updates microsite properties when updateMicrositeProperties is called", () => {
    render(
      <MicrositeProvider>
        <TestConsumer />
      </MicrositeProvider>
    );

    fireEvent.click(screen.getByTestId("update-microsite"));
    expect(screen.getByTestId("microsite-name")).toHaveTextContent(
      "Updated Microsite"
    );
  });

  it("removes non-active page correctly", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({});

    render(
      <MicrositeProvider workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    fireEvent.click(screen.getByTestId("add-page"));
    fireEvent.click(screen.getByTestId("add-new-page"));
    fireEvent.click(screen.getByTestId("set-active-page")); // active: custom-page

    fireEvent.click(screen.getByTestId("remove-page"));

    await waitFor(() => {
      expect(screen.queryByTestId("page-custom-page")).toBeNull();
    });
  });

  it("updates firstPageCode if removed page was first page", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({});
    (getRecord as jest.Mock).mockResolvedValue({
      firstPageCode: "p1",
      pages: [{ pageCode: "p1" }, { pageCode: "p2" }],
    });
    (getRecordVersions as jest.Mock).mockResolvedValue([]);

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("page-p1")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId("remove-page"));

    await waitFor(() => {
      expect(screen.queryByTestId("page-p1")).not.toBeInTheDocument();
    });
  });

  it("throws an error when useMicrosite is used outside MicrositeProvider", () => {
    const TestWithoutProvider: React.FC = () => {
      useMicrosite();
      return null;
    };

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<TestWithoutProvider />)).toThrow(
      "useMicrosite must be used within a MicrositeProvider"
    );
    consoleSpy.mockRestore();
  });

  it("shows loader while loading microsite", async () => {
    let resolvePromise: any;
    (getRecord as jest.Mock).mockReturnValue(
      new Promise((res) => (resolvePromise = res))
    );
    (getRecordVersions as jest.Mock).mockResolvedValue([]);

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <div data-testid="child">Child</div>
      </MicrositeProvider>
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();

    await act(async () => {
      resolvePromise({ name: "Loaded", pages: [] });
    });
  });

  it("fetches microsite data and sets active page from firstPageCode", async () => {
    (getRecord as jest.Mock).mockResolvedValue({
      name: "Fetched Microsite",
      firstPageCode: "p2",
      pages: [{ pageCode: "p1" }, { pageCode: "p2" }],
    });
    (getRecordVersions as jest.Mock).mockResolvedValue([]);

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("microsite-name")).toHaveTextContent(
        "Fetched Microsite"
      )
    );
    expect(screen.getByTestId("active-page-code")).toHaveTextContent("p2");
  });

  it("fetches microsite data and sets active page to first in array if no firstPageCode", async () => {
    (getRecord as jest.Mock).mockResolvedValue({
      name: "Fetched Microsite",
      firstPageCode: "",
      pages: [{ pageCode: "p1" }, { pageCode: "p2" }],
    });
    (getRecordVersions as jest.Mock).mockResolvedValue([]);

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("microsite-name")).toHaveTextContent(
        "Fetched Microsite"
      )
    );
    expect(screen.getByTestId("active-page-code")).toHaveTextContent("p1");
  });

  it("redirects on fetch error", async () => {
    (getRecord as jest.Mock).mockRejectedValue(new Error("API Error"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/workspaces/WS1/microsites");
    });
    consoleSpy.mockRestore();
  });

  it("sets isEditing based on published status", async () => {
    (getRecord as jest.Mock).mockResolvedValue({ name: "MS", pages: [] });
    (getRecordVersions as jest.Mock).mockResolvedValue([
      { version: 1, published: true },
    ]);

    render(
      <MicrositeProvider code="MS1" version={1} workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("editing")).toHaveTextContent("false");
    });
  });

  it("handles remove page api error gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error("Delete failed"));

    render(
      <MicrositeProvider workspaceCode="WS1">
        <TestConsumer />
      </MicrositeProvider>
    );

    fireEvent.click(screen.getByTestId("add-page"));
    fireEvent.click(screen.getByTestId("remove-page"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to delete page:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });
});
