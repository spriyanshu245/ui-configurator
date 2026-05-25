import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlainTextTemplateEditor from "@/app/template-designer/components/PlainTextTemplateEditor/PlainTextTemplateEditor";
import {
  saveNotificationTemplateData,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";

jest.mock("@/app/communications/templates/services", () => ({
  saveNotificationTemplateData: jest.fn(),
  updateNotificationTemplate: jest.fn(),
}));

const mockUseTemplateDesigner = jest.fn();
jest.mock("@/app/template-designer/context/TemplateDesignerContext", () => ({
  useTemplateDesigner: () => mockUseTemplateDesigner(),
}));

const mockSetUserNotification = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({ setUserNotification: mockSetUserNotification }),
}));

jest.mock("@/app/components/SVGIcons/Save", () => () => <span>SaveIcon</span>);
jest.mock("@/app/components/SVGIcons/Settings", () => () => (
  <span>SettingsIcon</span>
));
jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock(
  "@/app/template-designer/components/TemplateSettingsPane/TemplateSettingsPane",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
    }: {
      isOpen: boolean;
      onClose: () => void;
    }) => (
      <div data-testid="settings-pane" data-open={isOpen}>
        <button onClick={onClose}>close-settings</button>
      </div>
    ),
  }),
);

const baseMetadata = {
  id: 1,
  subscriptionKey: "WELCOME_EMAIL",
  templateName: "Initial Name",
  subject: "Subject",
  templateMimeType: "text/plain",
  language: "en",
  primary: false,
  vendorTemplateId: "vendor-1",
};

const renderEditor = (initialContent = "Hello") =>
  render(
    <PlainTextTemplateEditor
      templateId="42"
      communicationType="WELCOME"
      communicationSubscriptionKey="WELCOME_EMAIL"
      initialContent={initialContent}
      metadata={baseMetadata}
    />,
  );

describe("PlainTextTemplateEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTemplateDesigner.mockReturnValue({
      templateName: "Initial Name",
      templateMimeType: "text/plain",
    });
    (saveNotificationTemplateData as jest.Mock).mockResolvedValue(null);
    (updateNotificationTemplate as jest.Mock).mockResolvedValue(null);
  });

  it("renders with template name from context", () => {
    renderEditor();
    expect(screen.getByText("Initial Name")).toBeInTheDocument();
  });

  it("falls back to Untitled Template when context name is empty", () => {
    mockUseTemplateDesigner.mockReturnValue({
      templateName: "",
      templateMimeType: "text/plain",
    });
    renderEditor();
    expect(screen.getByText("Untitled Template")).toBeInTheDocument();
  });

  it("updates content on textarea change", () => {
    renderEditor("first");
    const textarea = screen.getByPlaceholderText(
      "Enter template content...",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "second" } });
    expect(textarea.value).toBe("second");
  });

  it("toggles settings pane open", () => {
    renderEditor();
    fireEvent.click(screen.getByTitle("Settings"));
    expect(screen.getByTestId("settings-pane")).toHaveAttribute(
      "data-open",
      "true",
    );
    fireEvent.click(screen.getByText("close-settings"));
    expect(screen.getByTestId("settings-pane")).toHaveAttribute(
      "data-open",
      "false",
    );
  });

  it("saves template content without metadata update when name and mime type match", async () => {
    renderEditor("body");
    fireEvent.click(screen.getByTitle("Save"));

    await waitFor(() => {
      expect(saveNotificationTemplateData).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        "42",
        "body",
      );
    });
    expect(updateNotificationTemplate).not.toHaveBeenCalled();
    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text: "Template saved successfully",
      }),
    );
  });

  it("updates metadata when template name or mime type changed", async () => {
    mockUseTemplateDesigner.mockReturnValue({
      templateName: "Renamed",
      templateMimeType: "text/html",
    });
    renderEditor("body");
    fireEvent.click(screen.getByTitle("Save"));

    await waitFor(() => {
      expect(updateNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        "42",
        expect.objectContaining({
          templateName: "Renamed",
          templateMimeType: "text/html",
        }),
      );
    });
  });

  it("notifies on save failure with Error message", async () => {
    (saveNotificationTemplateData as jest.Mock).mockRejectedValue(
      new Error("save fail"),
    );
    renderEditor();
    fireEvent.click(screen.getByTitle("Save"));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text: "save fail" }),
      );
    });
  });

  it("notifies on save failure with non-Error rejection", async () => {
    (saveNotificationTemplateData as jest.Mock).mockRejectedValue("oops");
    renderEditor();
    fireEvent.click(screen.getByTitle("Save"));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text: "Failed to save template",
        }),
      );
    });
  });

  it("ignores re-entrant save while saving", async () => {
    let resolveSave: (() => void) | null = null;
    (saveNotificationTemplateData as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = () => resolve();
        }),
    );
    renderEditor();
    const saveBtn = screen.getByTitle("Save");
    fireEvent.click(saveBtn);
    fireEvent.click(saveBtn);
    expect(saveNotificationTemplateData).toHaveBeenCalledTimes(1);
    resolveSave?.();
    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalled();
    });
  });
});
