import { renderHook } from "@testing-library/react";
import { useParentFormProperties } from "./useParentFormProperties";
import { useUserTask } from "@/app/context/UserTaskContext";
import { BaseComponent } from "../types/types";

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

describe("useParentFormProperties", () => {
  const mockBaseComponent: BaseComponent = {
    id: "targetComponent",
    type: "text",
    category: "component",
  };

  const mockFormComponent = {
    id: "form1",
    type: "form",
    category: "form",
    components: [{ id: "sibling1", type: "text" }, mockBaseComponent],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return nulls if the input component is null", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { components: [] },
    });

    const { result } = renderHook(() => useParentFormProperties(null as any));

    expect(result.current.parentForm).toBeNull();
    expect(result.current.formId).toBeNull();
  });

  test("should return nulls if the input component is itself a form", () => {
    const formInput: BaseComponent = {
      id: "myForm",
      type: "form",
      category: "form",
    };

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { components: [formInput] },
    });

    const { result } = renderHook(() => useParentFormProperties(formInput));

    expect(result.current.parentForm).toBeNull();
    expect(result.current.formId).toBeNull();
  });

  test("should return the parent form when component is a direct child of a form", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [mockFormComponent],
      },
    });

    const { result } = renderHook(() =>
      useParentFormProperties(mockBaseComponent)
    );

    expect(result.current.parentForm).toEqual(mockFormComponent);
    expect(result.current.formId).toBe("form1");
  });

  test("should return the parent form when component is nested inside a group within a form", () => {
    const componentInGroup: BaseComponent = {
      id: "innerComponent",
      type: "number",
      category: "component",
    };

    const formWithGroup = {
      id: "formWithGroup",
      type: "form",
      category: "form",
      components: [
        {
          id: "group1",
          type: "group",
          category: "layout",
          components: [componentInGroup],
        },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [formWithGroup],
      },
    });

    const { result } = renderHook(() =>
      useParentFormProperties(componentInGroup)
    );

    expect(result.current.parentForm).toEqual(formWithGroup);
    expect(result.current.formId).toBe("formWithGroup");
  });

  test("should locate form when the form itself is deeply nested in the userTask", () => {
    const deepForm = {
      id: "deepForm",
      type: "form",
      category: "form",
      components: [mockBaseComponent],
    };

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [
          {
            id: "rootLayout",
            type: "column",
            components: [deepForm],
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useParentFormProperties(mockBaseComponent)
    );

    expect(result.current.parentForm).toEqual(deepForm);
    expect(result.current.formId).toBe("deepForm");
  });

  test("should return nulls if the component exists but is not inside any form", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [
          {
            id: "group1",
            type: "group",
            components: [mockBaseComponent],
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useParentFormProperties(mockBaseComponent)
    );

    expect(result.current.parentForm).toBeNull();
    expect(result.current.formId).toBeNull();
  });

  test("should return nulls if the component is not found in the userTask tree", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [mockFormComponent],
      },
    });

    const orphanComponent: BaseComponent = {
      id: "orphan",
      type: "text",
      category: "component",
    };

    const { result } = renderHook(() =>
      useParentFormProperties(orphanComponent)
    );

    expect(result.current.parentForm).toBeNull();
    expect(result.current.formId).toBeNull();
  });

  test("should handle empty userTask or components array gracefully", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { components: [] },
    });

    const { result: resultEmpty } = renderHook(() =>
      useParentFormProperties(mockBaseComponent)
    );
    expect(resultEmpty.current.parentForm).toBeNull();

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: null,
    });

    const { result: resultNull } = renderHook(() =>
      useParentFormProperties(mockBaseComponent)
    );
    expect(resultNull.current.parentForm).toBeNull();
  });

  test("should handle deep recursion with multiple levels of nesting", () => {
    const veryDeepComponent: BaseComponent = {
      id: "deep",
      type: "text",
      category: "",
    };

    const complexForm = {
      id: "complexForm",
      type: "form",
      components: [
        {
          id: "g1",
          components: [
            {
              id: "g2",
              components: [
                {
                  id: "g3",
                  components: [veryDeepComponent],
                },
              ],
            },
          ],
        },
      ],
    };

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { components: [complexForm] },
    });

    const { result } = renderHook(() =>
      useParentFormProperties(veryDeepComponent)
    );

    expect(result.current.formId).toBe("complexForm");
    expect(result.current.parentForm).toEqual(complexForm);
  });
});
