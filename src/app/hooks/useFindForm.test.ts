import { renderHook } from "@testing-library/react";
import { useFindForm } from "./useFindForm";
import { useUserTask } from "@/app/context/UserTaskContext";

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("../utils/constants", () => ({
  MAX_FORMS_LIMIT: 1,
}));

describe("useFindForm Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty formNames and isFormFound=false when userTask is empty", () => {
    (useUserTask as jest.Mock).mockReturnValue({ userTask: {} });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual([]);
    expect(result.current.isFormFound).toBe(false);
  });

  it("should return empty formNames when components array is undefined", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { components: undefined },
    });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual([]);
    expect(result.current.isFormFound).toBe(false);
  });

  it("should find a single form at the root level", () => {
    const userTask = {
      components: [
        { type: "form", properties: { name: "Root Form" } },
        { type: "button", properties: { name: "Submit" } },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({ userTask });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual(["Root Form"]);

    expect(result.current.isFormFound).toBe(false);
  });

  it("should ignore forms without a name property", () => {
    const userTask = {
      components: [
        { type: "form", properties: { name: "Valid Form" } },
        { type: "form", properties: {} },
        { type: "form" },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({ userTask });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual(["Valid Form"]);
  });

  it("should find nested forms recursively", () => {
    const userTask = {
      components: [
        {
          type: "container",
          components: [
            {
              type: "section",
              components: [
                { type: "form", properties: { name: "Nested Form" } },
              ],
            },
          ],
        },
        { type: "form", properties: { name: "Root Form" } },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({ userTask });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual(["Nested Form", "Root Form"]);

    expect(result.current.isFormFound).toBe(true);
  });

  it("should set isFormFound to true when form count exceeds MAX_FORMS_LIMIT", () => {
    const userTask = {
      components: [
        { type: "form", properties: { name: "Form A" } },
        { type: "form", properties: { name: "Form B" } },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({ userTask });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames.length).toBe(2);
    expect(result.current.isFormFound).toBe(true);
  });

  it("should handle components with empty sub-component arrays safely", () => {
    const userTask = {
      components: [
        {
          type: "container",
          components: [],
        },
        { type: "form", properties: { name: "Form 1" } },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({ userTask });

    const { result } = renderHook(() => useFindForm());

    expect(result.current.formNames).toEqual(["Form 1"]);
  });
});
