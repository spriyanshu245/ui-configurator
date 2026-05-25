/**
 * @jest-environment jsdom
 */
import React from "react"; // Ensure React is imported
import { renderHook, act } from "@testing-library/react";
import { useImportExport } from "./useImportExport";
import { saveMicrosite } from "../utils/userTask/userTaskUtils";
import { stripKeys, replaceIdsInJson } from "../utils/utils";

// --- Mocks ---

const mockSetUserNotification = jest.fn();
jest.mock("../context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

jest.mock("../utils/userTask/userTaskUtils", () => ({
  saveMicrosite: jest.fn(),
}));

jest.mock("../utils/utils", () => ({
  stripKeys: jest.fn(),
  replaceIdsInJson: jest.fn(),
}));

jest.mock("../utils/constants", () => ({
  keysToRemove: ["tempId"],
}));

// --- Test Suite ---

describe("useImportExport Hook", () => {
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockLinkClick: jest.Mock;
  let mockSetIsModalOpen: jest.Mock;

  const mockComponent = {
    id: "comp-123",
    type: "input",
    properties: { name: "Test Component" },
  };


  beforeAll(() => {
    // Setup global URL mocks once
    mockCreateObjectURL = jest.fn(() => "blob:mock-url");
    mockRevokeObjectURL = jest.fn();

    Object.defineProperty(global.URL, "createObjectURL", {
      writable: true,
      value: mockCreateObjectURL,
    });
    Object.defineProperty(global.URL, "revokeObjectURL", {
      writable: true,
      value: mockRevokeObjectURL,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockLinkClick = jest.fn();
    mockSetIsModalOpen = jest.fn();

    // Mock document.createElement to handle the anchor tag click
    const originalCreateElement = document.createElement.bind(document);
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName, options) => {
        if (tagName === "a") {
          return {
            href: "",
            download: "",
            click: mockLinkClick,
            style: {},
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName, options);
      });

    // Mock append/remove child to prevent errors when adding the link to body
    jest.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    jest.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    // Default Utils Implementations
    (stripKeys as jest.Mock).mockImplementation((data) => data);
    (replaceIdsInJson as jest.Mock).mockImplementation((data) => data);
    (saveMicrosite as jest.Mock).mockImplementation((data) => ({
      ...data,
      saved: true,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("handleExportDslJson", () => {
    it("exports a standard component using stripKeys", () => {
      const { result } = renderHook(() =>
        useImportExport({ component: mockComponent })
      );

      act(() => {
        result.current.handleExportDslJson();
      });

      expect(stripKeys).toHaveBeenCalledWith(mockComponent, ["tempId"]);
      expect(saveMicrosite).not.toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLinkClick).toHaveBeenCalled();
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
        })
      );
    });


    it("does nothing if component is undefined", () => {
      const { result } = renderHook(() => useImportExport({}));

      act(() => {
        result.current.handleExportDslJson();
      });

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("handleImportDslJson", () => {
    const createMockFileEvent = (fileContent: string | null) => {
      const file = {
        text: jest.fn().mockResolvedValue(fileContent),
      };
      return {
        target: {
          files: fileContent === null ? [] : [file],
          value: "some-path",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
    };

    it("successfully imports valid DSL JSON", async () => {
      const validJson = JSON.stringify({
        dslJson: { id: "imported-1", type: "form" },
      });
      const event = createMockFileEvent(validJson);

      const { result } = renderHook(() =>
        useImportExport({ setIsModalOpen: mockSetIsModalOpen })
      );

      await act(async () => {
        await result.current.handleImportDslJson(event);
      });

      expect(replaceIdsInJson).toHaveBeenCalled();
      expect(result.current.importData).toEqual({
        id: "imported-1",
        type: "form",
      });
      expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    });

    it("handles JSON parse errors (malformed file)", async () => {
      const malformedJson = "{ broken json: ";
      const event = createMockFileEvent(malformedJson);

      const { result } = renderHook(() => useImportExport({}));

      await act(async () => {
        await result.current.handleImportDslJson(event);
      });

      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });

    it("returns early if no file is selected", async () => {
      const event = createMockFileEvent(null);
      const { result } = renderHook(() => useImportExport({}));

      await act(async () => {
        await result.current.handleImportDslJson(event);
      });

      expect(replaceIdsInJson).not.toHaveBeenCalled();
    });
  });
});
