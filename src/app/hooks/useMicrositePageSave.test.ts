import { act, renderHook } from "@testing-library/react";
import useMicrositePageSave from "./useMicrositePageSave";
import { apiRequest } from "../services/APIService";
import { useMicrosite } from "../context/MicrositeContext";
import { useUserTask } from "../context/UserTaskContext";
import { useHeaderV2 } from "../context/HeaderContextV2";
import { useControlPanel } from "../context/ControlPanelContext";
import { useParams } from "next/navigation";
import { saveMicrosite } from "../utils/userTask/userTaskUtils";

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("../context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("../context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

jest.mock("../context/ControlPanelContext", () => ({
  useControlPanel: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("../utils/userTask/userTaskUtils", () => ({
  saveMicrosite: jest.fn((value) => value),
}));

describe("useMicrositePageSave", () => {
  const mockSetHasChanges = jest.fn();
  const mockUpdateMicrositeProperties = jest.fn();
  const mockGetPageVersion = jest.fn(() => 3);
  const mockSetHasPageChanges = jest.fn();
  const mockSetUserNotification = jest.fn();
  const mockSetIsAutoSaveInProgress = jest.fn();
  const mockSetIsSaveSuccessful = jest.fn();

  const microsite = {
    code: "micro-1",
    version: 2,
    pages: [],
    firstPageCode: "page-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useMicrosite as jest.Mock).mockReturnValue({
      activePageCode: "page-1",
      isEditing: true,
      hasChanges: true,
      microsite,
      setHasChanges: mockSetHasChanges,
      updateMicrositeProperties: mockUpdateMicrositeProperties,
      getPageVersion: mockGetPageVersion,
    });

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { id: "task-1" },
      setHasPageChanges: mockSetHasPageChanges,
      hasPageChanges: true,
    });

    (useHeaderV2 as jest.Mock).mockReturnValue({
      setUserNotification: mockSetUserNotification,
    });

    (useControlPanel as jest.Mock).mockReturnValue({
      setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
      setIsSaveSuccessful: mockSetIsSaveSuccessful,
    });

    (useParams as jest.Mock).mockReturnValue({
      micrositeUrlSlug: "micro-1",
      version: "v2",
      workspaceCode: "WS-1",
    });
  });

  test("handlePageSave logs and rethrows page save errors", async () => {
    const consoleSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const error = new Error("Page save failed");
    (apiRequest as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useMicrositePageSave());

    await expect(result.current.handlePageSave()).rejects.toThrow(
      "Page save failed",
    );

    expect(consoleSpy).toHaveBeenCalledWith(error);

    consoleSpy.mockRestore();
  });

  test("handleMicrositeSave rethrows when throwOnError is true", async () => {
    const error = new Error("Microsite save failed");
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(error);

    const { result } = renderHook(() => useMicrositePageSave());

    await expect(
      result.current.handleMicrositeSave({ throwOnError: true }),
    ).rejects.toThrow("Microsite save failed");

    expect(mockSetIsSaveSuccessful).toHaveBeenCalledWith(false);
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      text: "Microsite save failed",
      time: 7000,
      type: "error",
    });
    expect(mockSetIsAutoSaveInProgress).toHaveBeenLastCalledWith(false);
  });

  test("handleMicrositeSave returns false when throwOnError is false", async () => {
    const error = new Error("Microsite save failed");
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(error);

    const { result } = renderHook(() => useMicrositePageSave());

    await expect(
      result.current.handleMicrositeSave({ throwOnError: false }),
    ).resolves.toBe(false);
  });

  test("handleMicrositeSave uses micrositeOverride when provided", async () => {
    const micrositeOverride = {
      ...microsite,
      code: "override-microsite",
    };

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ micrositeData: { updatedOn: "2026-04-03" } });

    const { result } = renderHook(() => useMicrositePageSave());

    await act(async () => {
      await result.current.handleMicrositeSave({ micrositeOverride });
    });

    expect(saveMicrosite).toHaveBeenCalledWith(micrositeOverride);
    expect(mockUpdateMicrositeProperties).toHaveBeenCalledWith({
      lastUpdatedOn: "2026-04-03",
    });
  });
});
