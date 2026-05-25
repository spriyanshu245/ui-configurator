import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { apiRequest } from "../services/APIService";
import { useUserTaskComponentActions } from "../hooks/useUserTaskComponentActions";
import { useConfig } from "../context/ConfigContext";
import { useMicrosite } from "../context/MicrositeContext";
import { useParams } from "next/navigation";
import { UserTaskProvider, useUserTask } from "./UserTaskContext";

/* -------------------------------------------------
   Mocks
-------------------------------------------------- */

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../hooks/useUserTaskComponentActions", () => ({
  useUserTaskComponentActions: jest.fn(),
}));

jest.mock("../context/ConfigContext", () => ({
  useConfig: jest.fn(),
}));

jest.mock("../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

const mockUserTask = {
  components: [
    {
      id: "root",
      type: "group",
      components: [
        { id: "child-1", type: "text" },
        {
          id: "child-group",
          type: "group",
          components: [{ id: "nested", type: "button" }],
        },
      ],
    },
  ],
};

const renderWithProvider = () =>
  render(
    <UserTaskProvider>
      <TestConsumer />
    </UserTaskProvider>
  );

const TestConsumer = () => {
  const ctx = useUserTask();
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="pageCode">{ctx.pageCode}</span>
      <span data-testid="hasChanges">{String(ctx.hasPageChanges)}</span>
    </div>
  );
};

beforeEach(() => {
  jest.clearAllMocks();

  (useParams as jest.Mock).mockReturnValue({
    workspaceCode: "ws-1",
  });

  (useConfig as jest.Mock).mockReturnValue({
    config: {
      NEXT_PUBLIC_BASE_URL: "http://test",
    },
  });

  (useMicrosite as jest.Mock).mockReturnValue({
    activePageCode: "page-1",
    microsite: {
      pages: [{ pageCode: "page-1", pageVersion: 1 }],
    },
  });

  (useUserTaskComponentActions as jest.Mock).mockReturnValue({
    addComponent: jest.fn(),
    addComponentAtIndex: jest.fn(),
    removeComponent: jest.fn(),
    moveComponentToIndex: jest.fn(),
    addComponentToComponent: jest.fn(),
    updateComponentProperties: jest.fn(),
    moveComponent: jest.fn(),
    importComponent: jest.fn(),
  });
});
describe("UserTask context Tests", () => {
  it("loads page DSL on mount", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockUserTask);

    await act(async () => {
      renderWithProvider();
    });

    expect(apiRequest).toHaveBeenCalled();
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
  it("skips fetch if workspaceCode missing", async () => {
    (useParams as jest.Mock).mockReturnValue({});

    await act(async () => {
      renderWithProvider();
    });

    expect(apiRequest).not.toHaveBeenCalled();
  });
  it("handles API failure gracefully", async () => {
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
  it("updateUserTask updates state and marks page dirty", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockUserTask);

    let ctx: any;

    const Consumer = () => {
      ctx = useUserTask();
      return null;
    };

    await act(async () => {
      render(
        <UserTaskProvider>
          <Consumer />
        </UserTaskProvider>
      );
    });

    act(() => {
      ctx.updateUserTask((prev: any) => ({
        ...prev,
      }));
    });

    expect(ctx.hasPageChanges).toBe(true);
  });
  it("finds nested component by id", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockUserTask);

    let ctx: any;

    const Consumer = () => {
      ctx = useUserTask();
      return null;
    };

    await act(async () => {
      render(
        <UserTaskProvider>
          <Consumer />
        </UserTaskProvider>
      );
    });

    const found = ctx.getComponentById("nested");
    expect(found).toBeTruthy();
    expect(found.id).toBe("nested");
  });
  it("returns null if component not found", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockUserTask);

    let ctx: any;

    const Consumer = () => {
      ctx = useUserTask();
      return null;
    };

    await act(async () => {
      render(
        <UserTaskProvider>
          <Consumer />
        </UserTaskProvider>
      );
    });

    expect(ctx.getComponentById("unknown")).toBeNull();
  });
  it("exposes all component action methods", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockUserTask);

    let ctx: any;

    const Consumer = () => {
      ctx = useUserTask();
      return null;
    };

    await act(async () => {
      render(
        <UserTaskProvider>
          <Consumer />
        </UserTaskProvider>
      );
    });

    [
      "addComponent",
      "addComponentAtIndex",
      "removeComponent",
      "moveComponentToIndex",
      "addComponentToComponent",
      "updateComponentProperties",
      "moveComponent",
      "importComponent",
    ].forEach((key) => {
      expect(typeof ctx[key]).toBe("function");
    });
  });
  it("throws error if useUserTask is used outside provider", () => {
    const Broken = () => {
      useUserTask();
      return null;
    };

    expect(() => render(<Broken />)).toThrow(
      "useUserTask must be used within a UserTaskProvider"
    );
  });
});
