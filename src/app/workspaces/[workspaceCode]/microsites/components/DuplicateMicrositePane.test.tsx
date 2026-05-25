import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import DuplicateMicrositePane from "./DuplicateMicrositePane";
import {
  duplicateMicrosite,
  fetchMicrositeVersions,
  OperationProgress,
} from "@/app/utils/micrositeOrchestration";
import { getRecord } from "@/app/utils/dataTableUtils";

jest.mock("next/navigation", () => ({
  useParams: () => ({ workspaceCode: "engineering-workspace" }),
}));

jest.mock("@/app/components/InternalComponents/Pane/Pane", () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
    children,
    paneFooter,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    paneFooter?: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="duplicate-pane">
        <h2>{title}</h2>
        <div>{children}</div>
        <div>{paneFooter}</div>
      </div>
    ) : null,
}));

jest.mock("@/app/utils/micrositeOrchestration", () => ({
  dedupePageCodes: jest.requireActual("@/app/utils/micrositeOrchestration")
    .dedupePageCodes,
  buildPageCodeWithPrefix: jest.requireActual(
    "@/app/utils/micrositeOrchestration",
  ).buildPageCodeWithPrefix,
  buildDuplicatePageCode: jest.requireActual(
    "@/app/utils/micrositeOrchestration",
  ).buildDuplicatePageCode,
  getPageCodeSuffix: jest.requireActual("@/app/utils/micrositeOrchestration")
    .getPageCodeSuffix,
  normalizePageCodeInput: jest.requireActual(
    "@/app/utils/micrositeOrchestration",
  ).normalizePageCodeInput,
  fetchMicrositeVersions: jest.fn(),
  duplicateMicrosite: jest.fn(),
}));

jest.mock("@/app/utils/dataTableUtils", () => ({
  getRecord: jest.fn(),
}));

jest.mock(
  "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter",
  () => ({
    __esModule: true,
    default: ({
      onSubmit,
      onCancel,
      isValid,
      isSubmitting,
      submitButtonTestId,
    }: {
      onSubmit: () => void;
      onCancel: () => void;
      isValid: boolean;
      isSubmitting: boolean;
      submitButtonTestId?: string;
    }) => (
      <div>
        <button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          data-testid={submitButtonTestId}
        >
          Submit
        </button>
        <button onClick={onSubmit} data-testid="force-submit">
          Force Submit
        </button>
      </div>
    ),
  }),
);

const mockedDuplicateMicrosite = duplicateMicrosite as jest.MockedFunction<
  typeof duplicateMicrosite
>;
const mockedFetchMicrositeVersions =
  fetchMicrositeVersions as jest.MockedFunction<typeof fetchMicrositeVersions>;
const mockedGetRecord = getRecord as jest.MockedFunction<typeof getRecord>;

const getPagesHeading = (count: number) =>
  screen.getByText((_, element) => element?.textContent === `Pages (${count})`);
const getVersionTrigger = () =>
  document.getElementById("duplicate-source-version") as HTMLButtonElement;

const sourceMicrosite = {
  code: "application-data-entry",
  slug: "application-data-entry",
  name: "Application Data Entry",
  description: "Source microsite",
  sourceSystem: "LOS",
  accessControlled: true,
  pages: [
    { pageCode: "application-data-entry_identifier", pageVersion: 1 },
    { pageCode: "application-data-entry_applicant", pageVersion: 1 },
  ],
};

const micrositeVersions = [
  {
    code: "application-data-entry",
    version: 3,
    published: true,
  },
  {
    code: "application-data-entry",
    version: 2,
    published: false,
  },
] as any;

const sourceMicrositeV2 = {
  ...sourceMicrosite,
  description: "Version two source microsite",
  sourceSystem: "LMS",
  accessControlled: false,
  pages: [{ pageCode: "application-data-entry_history", pageVersion: 2 }],
};

const sourceMicrositeWithDuplicatePageReferences = {
  ...sourceMicrosite,
  pages: [
    { pageCode: "application-data-entry_identifier", pageVersion: 1 },
    { pageCode: "application-data-entry_applicant", pageVersion: 1 },
    { pageCode: "application-data-entry_identifier", pageVersion: 1 },
  ],
};

describe("DuplicateMicrositePane", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let scrollIntoViewMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1773932004993);
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    scrollIntoViewMock = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });
    mockedDuplicateMicrosite.mockResolvedValue(undefined);
    mockedFetchMicrositeVersions.mockResolvedValue(micrositeVersions);
    mockedGetRecord.mockResolvedValue(sourceMicrosite as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads page mappings with suggested target codes", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue(
        "application-data-entry-1773932004993",
      );
    });

    await waitFor(() => {
      expect(getVersionTrigger()).toHaveTextContent("v3 · Published");
    });
    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
    expect(getPagesHeading(2)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Page references and session keys will be updated automatically during the process.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("duplicate-microsite-slug")).toHaveValue(
      "application-data-entry-1773932004993",
    );

    expect(mockedDuplicateMicrosite).not.toHaveBeenCalled();
  });

  it("deduplicates repeated source page references before rendering metadata", async () => {
    mockedGetRecord.mockResolvedValueOnce(
      sourceMicrositeWithDuplicatePageReferences as any,
    );

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue(
        "application-data-entry-1773932004993",
      );
    });

    await waitFor(() => {
      expect(getPagesHeading(2)).toBeInTheDocument();
    });
    expect(mockedDuplicateMicrosite).not.toHaveBeenCalled();
  });

  it("keeps the timestamped duplicate code and slug based on the source microsite code", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue(
        "application-data-entry-1773932004993",
      );
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-name"), {
      target: { value: "New Microsite Name" },
    });

    expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue(
      "application-data-entry-1773932004993",
    );
    expect(screen.getByTestId("duplicate-microsite-slug")).toHaveValue(
      "application-data-entry-1773932004993",
    );

    fireEvent.change(screen.getByTestId("duplicate-microsite-code"), {
      target: { value: "custom-code" },
    });
    fireEvent.change(screen.getByTestId("duplicate-microsite-name"), {
      target: { value: "Another Name" },
    });

    expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue(
      "custom-code",
    );
    expect(screen.getByTestId("duplicate-microsite-slug")).toHaveValue(
      "application-data-entry-1773932004993",
    );
  });

  it("submits the duplicate request with the edited mappings", async () => {
    const onCreated = jest.fn();

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={onCreated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-submit")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("duplicate-microsite-submit"));

    await waitFor(() => {
      expect(mockedDuplicateMicrosite).toHaveBeenCalledWith({
        workspaceCode: "engineering-workspace",
        sourceMicrosite,
        targetMicrosite: {
          code: "application-data-entry-1773932004993",
          slug: "application-data-entry-1773932004993",
          name: "Application Data Entry Copy",
          description: "Source microsite",
          sourceSystem: "LOS",
          accessControlled: true,
          version: 1,
          published: false,
        },
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-1773932004993_identifier",
          },
          {
            sourcePageCode: "application-data-entry_applicant",
            targetPageCode: "application-data-entry-1773932004993_applicant",
          },
        ],
        onProgress: expect.any(Function),
      });
    });

    expect(onCreated).toHaveBeenCalledWith(
      "application-data-entry-1773932004993",
    );
  });

  it("loads the clicked version by default and switches source details when version changes", async () => {
    mockedGetRecord
      .mockResolvedValueOnce(sourceMicrosite as any)
      .mockResolvedValueOnce(sourceMicrositeV2 as any);

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getVersionTrigger()).toHaveTextContent("v3 · Published");
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-name"), {
      target: { value: "Custom Duplicate Name" },
    });

    fireEvent.click(getVersionTrigger());
    fireEvent.click(await screen.findByRole("option", { name: "v2 · Draft" }));

    await waitFor(() => {
      expect(getVersionTrigger()).toHaveTextContent("v2 · Draft");
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-description")).toHaveValue(
        "Version two source microsite",
      );
    });
    expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
      "Custom Duplicate Name",
    );
    expect(screen.getByTestId("duplicate-microsite-source-system")).toHaveValue(
      "LMS",
    );
    expect(
      screen.getByTestId("duplicate-microsite-access-controlled"),
    ).not.toBeChecked();
    expect(getPagesHeading(1)).toBeInTheDocument();
    expect(screen.getByText(/Duplicating from:/)).toHaveTextContent(
      "Application Data Entry (v2)",
    );
  });

  it("shows an inline error and disables submit when the selected version fails to load", async () => {
    mockedGetRecord.mockRejectedValueOnce(new Error("Version load failed"));

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Version load failed/)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-submit")).toBeDisabled();
    });
  });

  it("shows inline progress during duplication and keeps the pane open on failure", async () => {
    mockedDuplicateMicrosite.mockImplementation(
      async ({
        onProgress,
      }: {
        onProgress?: (progress: OperationProgress) => void;
      }) => {
        onProgress?.({
          phase: "loading-source-pages",
          label: "Loading source pages...",
          current: 1,
          total: 4,
        });
        onProgress?.({
          phase: "creating-pages",
          label: "Creating duplicated pages...",
          current: 2,
          total: 4,
          detail: "application-data-entry-1773932004993_identifier",
        });
        await Promise.resolve();
        throw new Error("Duplicate failed");
      },
    );

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-submit")).toBeEnabled();
    });
    fireEvent.click(screen.getByTestId("duplicate-microsite-submit"));

    expect(
      await screen.findByTestId("duplicate-progress-panel"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Creating duplicated pages..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("duplicate-microsite-name"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("application-data-entry-1773932004993_identifier"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please do not close the browser while duplication is in progress.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Duplicate failed")).toBeInTheDocument();
    expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
  });

  it("registers a native beforeunload warning while duplication is in progress", async () => {
    let resolveDuplication: (() => void) | null = null;

    mockedDuplicateMicrosite.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDuplication = resolve;
        }),
    );

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-submit")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("duplicate-microsite-submit"));

    const beforeUnloadHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "beforeunload",
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;

    expect(beforeUnloadHandler).toBeDefined();

    const event = {
      preventDefault: jest.fn(),
    } as unknown as BeforeUnloadEvent;

    beforeUnloadHandler?.(event);

    expect(event.preventDefault).toHaveBeenCalled();

    await act(async () => {
      (resolveDuplication as (() => void) | null)?.();
      await Promise.resolve();
    });
  });

  it("does not fetch versions when pane is closed", () => {
    render(
      <DuplicateMicrositePane
        isOpen={false}
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("duplicate-pane")).not.toBeInTheDocument();
    expect(mockedFetchMicrositeVersions).not.toHaveBeenCalled();
  });

  it("does not fetch versions when sourceMicrositeCode is null", () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode={null}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    expect(mockedFetchMicrositeVersions).not.toHaveBeenCalled();
  });

  it("shows error when no versions are found for the microsite", async () => {
    mockedFetchMicrositeVersions.mockResolvedValueOnce([]);

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("No versions found for this microsite."),
      ).toBeInTheDocument();
    });
  });

  it("shows error when version list fetch fails", async () => {
    mockedFetchMicrositeVersions.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows generic error when version fetch throws a non-Error", async () => {
    mockedFetchMicrositeVersions.mockRejectedValueOnce("unexpected");

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load microsite versions."),
      ).toBeInTheDocument();
    });
  });

  it("ignores stale version fetch when source changes before it resolves", async () => {
    let resolveFetch1: (versions: typeof micrositeVersions) => void;

    mockedFetchMicrositeVersions
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch1 = resolve;
          }),
      )
      .mockResolvedValue(micrositeVersions);

    const { rerender } = render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="code-a"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    rerender(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="code-b"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await act(async () => {
      resolveFetch1!(micrositeVersions);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
  });

  it("ignores stale version fetch error when source changes before rejection", async () => {
    let rejectFetch1: (error: Error) => void;

    mockedFetchMicrositeVersions
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFetch1 = reject;
          }),
      )
      .mockResolvedValue(micrositeVersions);

    const { rerender } = render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="code-a"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    rerender(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="code-b"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await act(async () => {
      rejectFetch1!(new Error("Stale error"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
    expect(screen.queryByText("Stale error")).not.toBeInTheDocument();
  });

  it("handles slug change by the user", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-slug")).toHaveValue(
        "application-data-entry-1773932004993",
      );
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-slug"), {
      target: { value: "custom-slug-value" },
    });

    expect(screen.getByTestId("duplicate-microsite-slug")).toHaveValue(
      "custom-slug-value",
    );
  });

  it("prevents submit and shows error when duplicate code matches source code", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-submit")).toBeEnabled();
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-code"), {
      target: { value: "application-data-entry" },
    });

    fireEvent.click(screen.getByTestId("duplicate-microsite-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Duplicate microsite code must be different from the source.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("allows editing source system, access controlled, and description", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-source-system"), {
      target: { value: "LMS" },
    });
    expect(screen.getByTestId("duplicate-microsite-source-system")).toHaveValue(
      "LMS",
    );

    fireEvent.click(
      screen.getByTestId("duplicate-microsite-access-controlled"),
    );

    fireEvent.change(screen.getByTestId("duplicate-microsite-description"), {
      target: { value: "Updated description" },
    });
    expect(screen.getByTestId("duplicate-microsite-description")).toHaveValue(
      "Updated description",
    );
  });

  it("ignores stale record load when version changes before getRecord resolves", async () => {
    let resolveRecord1: (record: typeof sourceMicrosite) => void;

    mockedGetRecord
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRecord1 = resolve;
          }),
      )
      .mockResolvedValue(sourceMicrosite as any);

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(getVersionTrigger()).toHaveTextContent("v3 · Published"),
    );

    fireEvent.click(getVersionTrigger());
    fireEvent.click(await screen.findByRole("option", { name: "v2 · Draft" }));

    await act(async () => {
      resolveRecord1!(sourceMicrosite);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
  });

  it("ignores stale record error when version changes before getRecord rejects", async () => {
    let rejectRecord1: (error: Error) => void;

    mockedGetRecord
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectRecord1 = reject;
          }),
      )
      .mockResolvedValue(sourceMicrosite as any);

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(getVersionTrigger()).toHaveTextContent("v3 · Published"),
    );

    fireEvent.click(getVersionTrigger());
    fireEvent.click(await screen.findByRole("option", { name: "v2 · Draft" }));

    await act(async () => {
      rejectRecord1!(new Error("Stale record error"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });
    expect(screen.queryByText("Stale record error")).not.toBeInTheDocument();
  });

  it("handles sourceMicrositeCode that normalizes to an empty code", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="!@#"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockedFetchMicrositeVersions).toHaveBeenCalledWith(
        "engineering-workspace",
        "!@#",
      );
    });

    expect(screen.getByTestId("duplicate-microsite-code")).toHaveValue("");
  });

  it("short-circuits handleSubmit defensively when sourceMicrosite is null", async () => {
    mockedGetRecord.mockImplementation(() => new Promise(() => {}));

    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("force-submit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("force-submit"));

    expect(mockedDuplicateMicrosite).not.toHaveBeenCalled();
  });

  it("shows required-fields error when submitting with empty name", async () => {
    render(
      <DuplicateMicrositePane
        isOpen
        sourceMicrositeCode="application-data-entry"
        initialVersion={3}
        onClose={jest.fn()}
        onCreated={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-microsite-name")).toHaveValue(
        "Application Data Entry Copy",
      );
    });

    fireEvent.change(screen.getByTestId("duplicate-microsite-name"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByTestId("force-submit"));

    await waitFor(() => {
      expect(
        screen.getByText("Name, code, and slug are required."),
      ).toBeInTheDocument();
    });
  });
});
