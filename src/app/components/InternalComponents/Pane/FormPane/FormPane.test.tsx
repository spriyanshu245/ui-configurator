import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import FormPane from "./FormPane";
import {
  createRecord,
  duplicateRecord,
  getRecord,
  updateRecord,
} from "@/app/utils/dataTableUtils";
import { apiRequest } from "@/app/services/APIService";
import { useParams } from "next/navigation";

jest.mock("@/app/utils/dataTableUtils", () => ({
  createRecord: jest.fn(),
  duplicateRecord: jest.fn(),
  getRecord: jest.fn(),
  updateRecord: jest.fn(),
}));

jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("../Pane", () => {
  return function MockPane({
    isOpen,
    onClose,
    title,
    children,
    paneFooter,
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="pane">
        <h2 data-testid="pane-title">{title}</h2>
        <button data-testid="close-btn" onClick={onClose}>
          Close
        </button>
        <div data-testid="pane-content">{children}</div>
        <div data-testid="pane-footer">{paneFooter}</div>
      </div>
    );
  };
});

const mockWorkspaceCode = "ws-123";

const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedGetRecord = getRecord as jest.MockedFunction<typeof getRecord>;
const mockedCreateRecord = createRecord as jest.MockedFunction<
  typeof createRecord
>;
const mockedUpdateRecord = updateRecord as jest.MockedFunction<
  typeof updateRecord
>;
const mockedDuplicateRecord = duplicateRecord as jest.MockedFunction<
  typeof duplicateRecord
>;

describe("FormPane Component", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();
  const mockOnUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ workspaceCode: mockWorkspaceCode });

    mockedApiRequest.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (props: any = {}) => {
    return render(
      <FormPane
        isOpen={true}
        mode="create"
        onClose={mockOnClose}
        dataType="microsites"
        {...props}
      />,
    );
  };

  it("does not render when isOpen is false", () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByTestId("pane")).not.toBeInTheDocument();
  });

  it("renders correctly in Create mode (Microsites)", async () => {
    renderComponent();

    expect(screen.getByTestId("pane-title")).toHaveTextContent(
      "Create microsites",
    );
    expect(screen.getByTestId("microsites-name")).toBeInTheDocument();
    expect(screen.getByTestId("microsites-code")).toBeInTheDocument();
    expect(screen.getByTestId("microsites-slug")).toBeInTheDocument();
    expect(screen.getByTestId("microsites-sourceSystem")).toBeInTheDocument();
    expect(
      screen.getByTestId("microsites-accessControlled"),
    ).toBeInTheDocument();

    expect(screen.getByTestId("microsites-Description")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders correctly in Duplicate mode", () => {
    renderComponent({
      mode: "duplicate",
      sourceDsl: { name: "Original", sourceSystem: "SYS1" },
    });

    expect(screen.getByTestId("pane-title")).toHaveTextContent(
      "Duplicate microsites",
    );
    expect(screen.getByText(/Duplicating from:/)).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
  });

  it("fetches and populates Source Systems on mount", async () => {
    mockedApiRequest.mockResolvedValueOnce([
      { code: "SYS1", name: "System 1" },
    ]);

    renderComponent();

    await waitFor(() => {
      const select = screen.getByTestId(
        "microsites-sourceSystem",
      ) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
      expect(select.options[1].value).toBe("SYS1");
    });
  });

  it("auto-generates Code and Slug from Name (Microsites/Create)", () => {
    renderComponent();

    const nameInput = screen.getByTestId("microsites-name");
    fireEvent.change(nameInput, { target: { value: "My Test Site" } });

    expect(screen.getByTestId("microsites-code")).toHaveValue("my-test-site");
    expect(screen.getByTestId("microsites-slug")).toHaveValue("my-test-site");
  });

  it("stops auto-generating Code if manually edited", () => {
    renderComponent();

    const codeInput = screen.getByTestId("microsites-code");
    fireEvent.change(codeInput, { target: { value: "custom-code" } });

    const nameInput = screen.getByTestId("microsites-name");
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });

    expect(codeInput).toHaveValue("custom-code");

    expect(screen.getByTestId("microsites-slug")).toHaveValue("changed-name");
  });

  it("stops auto-generating Slug if manually edited", () => {
    renderComponent();

    const slugInput = screen.getByTestId("microsites-slug");
    fireEvent.change(slugInput, { target: { value: "custom-slug" } });

    const nameInput = screen.getByTestId("microsites-name");
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });

    expect(slugInput).toHaveValue("custom-slug");
    expect(screen.getByTestId("microsites-code")).toHaveValue("changed-name");
  });

  it("handles Page specific logic: Code = micrositeCode_slug", () => {
    renderComponent({
      dataType: "pages",
      micrositeCode: "parent-site",
    });

    const nameInput = screen.getByTestId("pages-name");
    fireEvent.change(nameInput, { target: { value: "About Us" } });

    expect(screen.getByTestId("pages-slug")).toHaveValue("about-us");
    expect(screen.getByTestId("pages-code")).toHaveValue(
      "parent-site_about-us",
    );

    expect(screen.getByTestId("pages-code")).toHaveAttribute("readonly");
  });

  it("handles Workspace specific logic (No Slug, No SourceSystem)", () => {
    renderComponent({ dataType: "workspace" });

    expect(screen.queryByTestId("workspace-slug")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("workspace-sourceSystem"),
    ).not.toBeInTheDocument();

    const nameInput = screen.getByTestId("workspace-name");
    fireEvent.change(nameInput, { target: { value: "My WS" } });

    expect(screen.getByTestId("workspace-code")).toHaveValue("my-ws");
  });

  it("loads data correctly in Edit mode", async () => {
    mockedGetRecord.mockResolvedValueOnce({
      code: "EDIT_CODE",
      name: "Existing Name",
      slug: "existing-slug",
      sourceSystem: "SYS1",
      accessControlled: true,
      description: "Desc",
    });

    renderComponent({
      mode: "edit",
      dataToEdit: { code: "EDIT_CODE", version: 1 },
    });

    expect(screen.getByText("Save")).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByTestId("microsites-name")).toHaveValue(
        "Existing Name",
      );
      expect(screen.getByTestId("microsites-slug")).toHaveValue(
        "existing-slug",
      );
      expect(screen.getByTestId("microsites-code")).toHaveValue("EDIT_CODE");
      expect(screen.getByTestId("microsites-accessControlled")).toBeChecked();
    });

    expect(screen.getByTestId("microsites-code")).toHaveAttribute("readonly");
    expect(screen.getByTestId("microsites-slug")).toHaveAttribute("readonly");
  });

  it("handles load error in Edit mode", async () => {
    mockedGetRecord.mockRejectedValueOnce(new Error("Network Error"));

    renderComponent({
      mode: "edit",
      dataToEdit: { code: "FAIL_CODE", version: 1 },
    });

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });

    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("submits Create form successfully (Microsite)", async () => {
    mockedCreateRecord.mockResolvedValueOnce(undefined);
    renderComponent({ onCreated: mockOnCreated });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "New Site" },
    });

    fireEvent.change(screen.getByTestId("microsites-Description"), {
      target: { value: "My Desc" },
    });
    fireEvent.click(screen.getByTestId("microsites-accessControlled"));

    const createBtn = screen.getByText("Create");
    await waitFor(() => expect(createBtn).not.toBeDisabled());
    fireEvent.click(createBtn);

    expect(createBtn).toHaveTextContent("Creating...");

    await waitFor(() => {
      expect(mockedCreateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          endpoint: "/api/v1/config/microsites?version=1",
          body: expect.objectContaining({
            code: "new-site",
            name: "New Site",
            slug: "new-site",
            accessControlled: true,
            description: "My Desc",
          }),
          headers: { "workspace-code": mockWorkspaceCode },
        }),
      );
      expect(mockOnCreated).toHaveBeenCalledWith("new-site");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("submits Create form successfully (Workspace - No Header)", async () => {
    mockedCreateRecord.mockResolvedValueOnce(undefined);
    renderComponent({ dataType: "workspace" });

    fireEvent.change(screen.getByTestId("workspace-name"), {
      target: { value: "New WS" },
    });

    const createBtn = screen.getByText("Create");
    fireEvent.click(createBtn);

    await waitFor(() => {
      const callArgs = mockedCreateRecord.mock.calls[0][0];
      expect(callArgs.headers).toEqual({ "workspace-code": mockWorkspaceCode });
      expect(callArgs.body.code).toBe("new-ws");
    });
  });

  it("handles Create error", async () => {
    mockedCreateRecord.mockRejectedValueOnce(new Error("Create Failed"));
    renderComponent();

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "Fail Site" },
    });

    const createBtn = screen.getByText("Create");
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Create Failed/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("waits for async onCreated before closing the page create pane", async () => {
    mockedCreateRecord.mockResolvedValueOnce(undefined);

    let resolveCreated: (() => void) | null = null;
    const asyncOnCreated = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCreated = resolve;
        }),
    );

    renderComponent({
      dataType: "pages",
      micrositeCode: "parent-site",
      onCreated: asyncOnCreated,
    });

    fireEvent.change(screen.getByTestId("pages-name"), {
      target: { value: "About Us" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockedCreateRecord).toHaveBeenCalled();
      expect(asyncOnCreated).toHaveBeenCalledWith("parent-site_about-us");
    });

    fireEvent.click(screen.getByTestId("close-btn"));
    expect(mockOnClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveCreated?.();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("keeps the page create pane open when async onCreated fails", async () => {
    mockedCreateRecord.mockResolvedValueOnce(undefined);
    const failingOnCreated = jest
      .fn()
      .mockRejectedValue(new Error("Failed to link page to microsite"));

    renderComponent({
      dataType: "pages",
      micrositeCode: "parent-site",
      onCreated: failingOnCreated,
    });

    fireEvent.change(screen.getByTestId("pages-name"), {
      target: { value: "About Us" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to link page to microsite"),
      ).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("pane")).toBeInTheDocument();
  });

  it("registers a native beforeunload warning while page creation is being linked", async () => {
    mockedCreateRecord.mockResolvedValueOnce(undefined);

    const addEventListenerSpy = jest.spyOn(globalThis, "addEventListener");

    let resolveCreated: (() => void) | null = null;
    const asyncOnCreated = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCreated = resolve;
        }),
    );

    renderComponent({
      dataType: "pages",
      micrositeCode: "parent-site",
      onCreated: asyncOnCreated,
    });

    fireEvent.change(screen.getByTestId("pages-name"), {
      target: { value: "About Us" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(asyncOnCreated).toHaveBeenCalled();
    });

    const beforeUnloadHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "beforeunload",
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;

    expect(beforeUnloadHandler).toBeDefined();

    const event = {
      preventDefault: jest.fn(),
      returnValue: undefined,
    } as unknown as BeforeUnloadEvent;

    beforeUnloadHandler?.(event);

    expect(event.preventDefault).toHaveBeenCalled();

    await act(async () => {
      resolveCreated?.();
    });
  });

  it("submits Edit form successfully", async () => {
    const initialData = {
      code: "EDIT_ME",
      name: "Old Name",
      slug: "old-slug",
      description: "Old Desc",
    };
    mockedGetRecord.mockResolvedValueOnce(initialData);
    mockedUpdateRecord.mockResolvedValueOnce(undefined);

    renderComponent({
      mode: "edit",
      dataToEdit: { code: "EDIT_ME", version: 1 },
      onUpdated: mockOnUpdated,
    });

    await waitFor(() => {
      expect(screen.getByTestId("microsites-name")).toHaveValue("Old Name");
    });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "New Name " },
    });

    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);

    expect(saveBtn).toHaveTextContent("Saving...");

    await waitFor(() => {
      expect(mockedUpdateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",

          endpoint: "/api/v1/config/microsites/EDIT_ME?version=1",
          body: expect.objectContaining({
            name: "New Name",
            code: "EDIT_ME",
          }),
        }),
      );
      expect(mockOnUpdated).toHaveBeenCalled();
    });
  });

  it("handles Edit validation failure (Missing DSL or Code)", async () => {
    renderComponent({ mode: "edit", dataToEdit: {} });

    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("handles Edit Submit failure (API Error)", async () => {
    mockedGetRecord.mockResolvedValueOnce({ code: "ABC", name: "A" });
    mockedUpdateRecord.mockRejectedValueOnce(new Error("Update Fail"));

    renderComponent({ mode: "edit", dataToEdit: { code: "ABC", version: 1 } });

    await waitFor(() => expect(screen.getByText("Save")).not.toBeDisabled());

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Update Fail")).toBeInTheDocument();
    });
  });

  it("submits Duplicate form successfully", async () => {
    mockedDuplicateRecord.mockResolvedValueOnce(undefined);
    const sourceDsl = { name: "Source", sourceSystem: "SYS1" };

    renderComponent({
      mode: "duplicate",
      sourceDsl: sourceDsl,
      onCreated: mockOnCreated,
    });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "Copy" },
    });

    const dupBtn = screen.getByText("Duplicate");
    fireEvent.click(dupBtn);

    expect(dupBtn).toHaveTextContent("Duplicating...");

    await waitFor(() => {
      expect(mockedDuplicateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            ...sourceDsl,
            code: "copy",
            name: "Copy",
          }),
        }),
      );
    });
  });

  it("shows error if Duplicate called without Source DSL", async () => {
    renderComponent({ mode: "duplicate", sourceDsl: null });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByTestId("microsites-code"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByTestId("microsites-slug"), {
      target: { value: "A" },
    });

    const dupBtn = screen.getByText("Duplicate");
    fireEvent.click(dupBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load source microsites"),
      ).toBeInTheDocument();
    });
  });

  it("resets state when reopening", () => {
    const { rerender } = renderComponent();

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "Dirty" },
    });

    rerender(
      <FormPane
        isOpen={false}
        mode="create"
        onClose={mockOnClose}
        dataType="microsites"
      />,
    );

    rerender(
      <FormPane
        isOpen={true}
        mode="create"
        onClose={mockOnClose}
        dataType="microsites"
      />,
    );

    expect(screen.getByTestId("microsites-name")).toHaveValue("");
  });

  it("focuses name input on open", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId("microsites-name")).toHaveFocus();
    });
  });

  it("handles duplicate mode name change auto-generation logic", () => {
    renderComponent({ mode: "duplicate", sourceDsl: { name: "Src" } });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "Copy 1" },
    });
    expect(screen.getByTestId("microsites-code")).toHaveValue("copy-1");

    fireEvent.change(screen.getByTestId("microsites-code"), {
      target: { value: "manual" },
    });

    fireEvent.change(screen.getByTestId("microsites-name"), {
      target: { value: "Copy 2" },
    });
    expect(screen.getByTestId("microsites-code")).toHaveValue("manual");
    expect(screen.getByTestId("microsites-slug")).toHaveValue("copy-2");
  });

  it("handles manual code change in Create Mode with editable microsite code normalization", () => {
    renderComponent();
    const codeInput = screen.getByTestId("microsites-code");

    fireEvent.change(codeInput, { target: { value: " Manual " } });

    expect(codeInput).toHaveValue("manual-");
  });

  it("updates source system state", async () => {
    mockedApiRequest.mockResolvedValueOnce([
      { code: "SYS1", name: "System 1" },
    ]);

    renderComponent();

    const select = screen.getByTestId("microsites-sourceSystem");

    await waitFor(() => {
      expect(screen.getByText("System 1")).toBeInTheDocument();
    });

    fireEvent.change(select, { target: { value: "SYS1" } });

    expect(select).toHaveValue("SYS1");
  });

  it("handles validation for Pages (require micrositeCode)", () => {
    renderComponent({ dataType: "pages", micrositeCode: undefined });

    fireEvent.change(screen.getByTestId("pages-name"), {
      target: { value: "Page" },
    });

    expect(screen.getByTestId("pages-code")).toHaveValue("");

    expect(screen.getByText("Create")).toBeDisabled();
  });
});
