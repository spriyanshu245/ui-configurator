import { act, renderHook } from "@testing-library/react";

import { useMicrosite } from "../context/MicrositeContext";
import { apiRequest } from "../services/APIService";
import useDurableMicrositePageCreation from "./useDurableMicrositePageCreation";
import useMicrositePageSave from "./useMicrositePageSave";

jest.mock("../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("./useMicrositePageSave", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({
    workspaceCode: "engineering-workspace",
  })),
}));

const mockedUseMicrosite = useMicrosite as jest.MockedFunction<
  typeof useMicrosite
>;
const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseMicrositePageSave =
  useMicrositePageSave as jest.MockedFunction<typeof useMicrositePageSave>;

describe("useDurableMicrositePageCreation", () => {
  const mockAddNewPage = jest.fn();
  const mockSetActivePage = jest.fn();
  const mockSetHasChanges = jest.fn();
  const mockUpdateMicrositeProperties = jest.fn();
  const mockHandleMicrositeSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseMicrosite.mockReturnValue({
      microsite: {
        code: "application-data-entry",
        name: "Application Data Entry",
        version: 3,
        firstPageCode: "",
        pages: [],
      },
      activePageCode: undefined,
      hasChanges: false,
      isEditing: true,
      setIsEditing: jest.fn(),
      setHasChanges: mockSetHasChanges,
      setActivePage: mockSetActivePage,
      getActivePageCode: jest.fn(),
      getPages: jest.fn(),
      getPageVersion: jest.fn(),
      addPage: jest.fn(),
      addNewPage: mockAddNewPage,
      removePage: jest.fn(),
      updateMicrositeProperties: mockUpdateMicrositeProperties,
    });

    mockedUseMicrositePageSave.mockReturnValue({
      handlePageSave: jest.fn(),
      handleMicrositeSave: mockHandleMicrositeSave,
    });
  });

  it("persists the newly created page by immediately saving the microsite draft", async () => {
    mockHandleMicrositeSave.mockResolvedValue(true);

    const { result } = renderHook(() => useDurableMicrositePageCreation());

    await act(async () => {
      await result.current.persistCreatedPage(
        "application-data-entry_overview",
      );
    });

    expect(mockAddNewPage).toHaveBeenCalledWith(
      "application-data-entry_overview",
    );
    expect(mockHandleMicrositeSave).toHaveBeenCalledWith({
      micrositeOverride: expect.objectContaining({
        firstPageCode: "application-data-entry_overview",
        pages: [
          {
            pageCode: "application-data-entry_overview",
            pageVersion: 3,
          },
        ],
      }),
      forceMicrositeSave: true,
      throwOnError: true,
    });
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("rolls back the created page when the immediate microsite save fails", async () => {
    mockedUseMicrosite.mockReturnValue({
      microsite: {
        code: "application-data-entry",
        name: "Application Data Entry",
        version: 2,
        firstPageCode: "application-data-entry_existing",
        pages: [
          {
            pageCode: "application-data-entry_existing",
            pageVersion: 2,
          },
        ],
      },
      activePageCode: "application-data-entry_existing",
      hasChanges: true,
      isEditing: true,
      setIsEditing: jest.fn(),
      setHasChanges: mockSetHasChanges,
      setActivePage: mockSetActivePage,
      getActivePageCode: jest.fn(),
      getPages: jest.fn(),
      getPageVersion: jest.fn(),
      addPage: jest.fn(),
      addNewPage: mockAddNewPage,
      removePage: jest.fn(),
      updateMicrositeProperties: mockUpdateMicrositeProperties,
    });
    mockHandleMicrositeSave.mockRejectedValueOnce(new Error("Save failed"));
    mockedApiRequest.mockResolvedValueOnce({});

    const { result } = renderHook(() => useDurableMicrositePageCreation());

    await expect(
      act(async () => {
        await result.current.persistCreatedPage(
          "application-data-entry_new-page",
        );
      }),
    ).rejects.toThrow("Save failed");

    expect(mockUpdateMicrositeProperties).toHaveBeenCalledWith({
      pages: [
        {
          pageCode: "application-data-entry_existing",
          pageVersion: 2,
        },
      ],
      firstPageCode: "application-data-entry_existing",
    });
    expect(mockSetActivePage).toHaveBeenCalledWith(
      "application-data-entry_existing",
    );
    expect(mockSetHasChanges).toHaveBeenCalledWith(true);
    expect(mockedApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/api/v1/config/pages/application-data-entry_new-page?version=2",
        method: "DELETE",
      }),
    );
  });

  it("surfaces a stronger error when both save and cleanup fail", async () => {
    mockHandleMicrositeSave.mockRejectedValueOnce(new Error("Save failed"));
    mockedApiRequest.mockRejectedValueOnce(new Error("Cleanup failed"));

    const { result } = renderHook(() => useDurableMicrositePageCreation());

    await expect(
      act(async () => {
        await result.current.persistCreatedPage(
          "application-data-entry_overview",
        );
      }),
    ).rejects.toThrow(
      "Save failed Cleanup also failed: Cleanup failed",
    );
  });
});
