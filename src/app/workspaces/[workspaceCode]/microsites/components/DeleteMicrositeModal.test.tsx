import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DeleteMicrositeModal from "./DeleteMicrositeModal";
import {
  DeleteMicrositeOperation,
  planMicrositeDelete,
  executeDeleteMicrositeOperation,
} from "@/app/utils/micrositeOrchestration";

jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => ({
    __esModule: true,
    default: () => <span data-testid="inline-loader">loading</span>,
  }),
);

jest.mock("@/app/utils/micrositeOrchestration", () => {
  const actual = jest.requireActual("@/app/utils/micrositeOrchestration");
  return {
    ...actual,
    planMicrositeDelete: jest.fn(),
    executeDeleteMicrositeOperation: jest.fn(),
  };
});

const mockedPlanMicrositeDelete = jest.mocked(planMicrositeDelete);
const mockedExecuteDeleteOperation = jest.mocked(
  executeDeleteMicrositeOperation,
);

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const buildOperation = (
  overrides: Partial<DeleteMicrositeOperation>,
): DeleteMicrositeOperation => ({
  id: "default-op",
  type: "page",
  status: "pending",
  label: "Deleting page v1",
  detail: "ms1_home",
  micrositeCode: "ms1",
  micrositeVersion: 3,
  pageCode: "ms1_home",
  pageVersion: 1,
  requestData: {
    endpoint: "/api/v1/config/pages/ms1_home?version=1",
    method: "DELETE",
    headers: { "workspace-code": "ws1" },
  },
  ...overrides,
});

const defaultPlan = {
  micrositeCode: "ms1",
  micrositeName: "Microsite One",
  totalMicrositeVersions: 2,
  totalUniquePageVersions: 2,
  versions: [
    { version: 3, published: true, pageCount: 2 },
    { version: 2, published: false, pageCount: 1 },
  ],
  operations: [
    buildOperation({
      id: "page-1",
      detail: "ms1_home",
    }),
    buildOperation({
      id: "page-2",
      detail: "ms1_about",
      pageCode: "ms1_about",
      requestData: {
        endpoint: "/api/v1/config/pages/ms1_about?version=1",
        method: "DELETE",
        headers: { "workspace-code": "ws1" },
      },
    }),
    buildOperation({
      id: "microsite-3",
      type: "micrositeVersion",
      label: "Deleting microsite version v3",
      detail: "ms1 (Published)",
      pageCode: undefined,
      pageVersion: undefined,
      requestData: {
        endpoint: "/api/v1/config/microsites/ms1?version=3",
        method: "DELETE",
        headers: { "workspace-code": "ws1" },
      },
    }),
  ],
};

describe("DeleteMicrositeModal", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedPlanMicrositeDelete.mockResolvedValue(defaultPlan);
    mockedExecuteDeleteOperation.mockResolvedValue(undefined);
  });

  it("renders the delete preview with all microsite versions and statuses", async () => {
    render(
      <DeleteMicrositeModal
        isOpen
        workspaceCode="ws1"
        microsite={{ code: "ms1", name: "Microsite One" }}
        onClose={jest.fn()}
        onWorkflowComplete={jest.fn()}
      />,
    );

    expect(screen.getByTestId("delete-preview-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("delete-preview-content")).toBeInTheDocument();
    });

    expect(screen.getByText("Microsite One")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByTestId("delete-version-3")).toHaveTextContent("Published");
    expect(screen.getByTestId("delete-version-2")).toHaveTextContent("Draft");
  });

  it("hides the operation log while the delete workflow is progressing without issues", async () => {
    const firstDelete = createDeferred<void>();

    mockedExecuteDeleteOperation
      .mockImplementationOnce(() => firstDelete.promise)
      .mockResolvedValue(undefined);

    render(
      <DeleteMicrositeModal
        isOpen
        workspaceCode="ws1"
        microsite={{ code: "ms1", name: "Microsite One" }}
        onClose={jest.fn()}
        onWorkflowComplete={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("delete-microsite-start")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-microsite-start"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-progress-content")).toBeInTheDocument();
    });

    expect(screen.queryByText("Delete operations")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-operation-list")).not.toBeInTheDocument();

    firstDelete.resolve(undefined);

    await waitFor(() => {
      expect(screen.getByTestId("delete-summary-content")).toBeInTheDocument();
    });
  });

  it("pauses on hard failure and retries the failed operation before continuing", async () => {
    const onWorkflowComplete = jest.fn();

    mockedExecuteDeleteOperation
      .mockRejectedValueOnce(new Error("Delete page failed"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    render(
      <DeleteMicrositeModal
        isOpen
        workspaceCode="ws1"
        microsite={{ code: "ms1", name: "Microsite One" }}
        onClose={jest.fn()}
        onWorkflowComplete={onWorkflowComplete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("delete-microsite-start")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-microsite-start"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-paused-banner")).toBeInTheDocument();
      expect(
        screen.getAllByText("Delete page failed").length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getByText("Delete operations")).toBeInTheDocument();
    expect(screen.getByTestId("delete-operation-list")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-microsite-retry"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-summary-content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Final operation log")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-operation-list")).not.toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("Deleted microsite versions")).toBeInTheDocument();
    expect(screen.getByText("Deleted page versions")).toBeInTheDocument();
    expect(screen.queryByText("Succeeded")).not.toBeInTheDocument();
    expect(screen.queryByText("Skipped")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();

    expect(onWorkflowComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          result: "success",
          deletedMicrositeVersions: 1,
          deletedPageVersions: 2,
        }),
      }),
    );
    expect(mockedExecuteDeleteOperation).toHaveBeenCalledTimes(4);
  });

  it("skips the failed operation and finishes with a partial-success summary", async () => {
    const onWorkflowComplete = jest.fn();

    mockedPlanMicrositeDelete.mockResolvedValue({
      ...defaultPlan,
      operations: [
        buildOperation({
          id: "page-1",
          detail: "ms1_home",
        }),
        buildOperation({
          id: "microsite-3",
          type: "micrositeVersion",
          label: "Deleting microsite version v3",
          detail: "ms1 (Published)",
          pageCode: undefined,
          pageVersion: undefined,
          requestData: {
            endpoint: "/api/v1/config/microsites/ms1?version=3",
            method: "DELETE",
            headers: { "workspace-code": "ws1" },
          },
        }),
      ],
    });
    mockedExecuteDeleteOperation
      .mockRejectedValueOnce(new Error("Delete page failed"))
      .mockResolvedValueOnce(undefined);

    render(
      <DeleteMicrositeModal
        isOpen
        workspaceCode="ws1"
        microsite={{ code: "ms1", name: "Microsite One" }}
        onClose={jest.fn()}
        onWorkflowComplete={onWorkflowComplete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("delete-microsite-start")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-microsite-start"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-paused-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-microsite-continue"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-summary-content")).toBeInTheDocument();
    });

    expect(screen.getByText("Partial success")).toBeInTheDocument();
    expect(screen.getAllByText("Succeeded").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Skipped").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.getByText("Some delete operations were skipped. Review the final operation log below.")).toBeInTheDocument();
    expect(screen.getByText("Final operation log")).toBeInTheDocument();
    expect(screen.getByTestId("delete-operation-list")).toBeInTheDocument();
    expect(onWorkflowComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          result: "partial_success",
          skipped: 1,
          deletedMicrositeVersions: 1,
        }),
      }),
    );
  });
});
