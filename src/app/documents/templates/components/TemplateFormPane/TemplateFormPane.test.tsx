import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TemplateFormPane from "./TemplateFormPane";
import { createTemplate, duplicateTemplate } from "../../services";

jest.mock("../../services");

jest.mock("@/app/components/InternalComponents/Pane/Pane", () => ({
  __esModule: true,
  default: ({
    children,
    isOpen,
    title,
    paneFooter,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    minWidth?: number;
    paneFooter?: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="pane" data-title={title}>
        {children}
        {paneFooter}
      </div>
    ) : null,
}));

jest.mock(
  "@/app/components/InternalComponents/SelectDropdown/SelectDropdown",
  () => ({
    __esModule: true,
    default: ({
      id,
      options,
      value,
      onChange,
      placeholder,
      disabled,
    }: {
      id: string;
      options: { value: string; label: string }[];
      value: string;
      onChange: (val: string) => void;
      placeholder?: string;
      disabled?: boolean;
      showSearch?: boolean;
    }) => (
      <select
        data-testid={`select-${id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  }),
);

jest.mock(
  "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter",
  () => ({
    __esModule: true,
    default: ({
      onCancel,
      onSubmit,
      isSubmitting,
      isValid,
    }: {
      onCancel: () => void;
      onSubmit: () => void;
      isSubmitting: boolean;
      isValid: boolean;
    }) => (
      <div data-testid="form-pane-footer">
        <button type="button" onClick={onCancel} data-testid="cancel-btn">
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          data-testid="submit-btn"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    ),
  }),
);

jest.mock("@/app/template-designer/constants", () => ({
  MIME_TYPE_OPTIONS: [
    { value: "text/html", label: "HTML" },
    { value: "text/plain", label: "Plain Text" },
  ],
  CATEGORY_OPTIONS_BY_MIME_TYPE: {
    "text/html": [
      { value: "Document", label: "Document" },
      { value: "Email", label: "Email" },
    ],
    "text/plain": [
      { value: "SMS", label: "SMS" },
      { value: "Notification", label: "Notification" },
    ],
  },
  DEFAULT_GLOBAL_STYLES: {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    lineHeight: "1.5",
    textColor: "#000000",
    bodyBackgroundColor: "#ffffff",
    linkColor: "#0000ff",
    linkHoverColor: "#0000cc",
  },
  SUPPORTED_LANGUAGES: [
    { value: "en", label: "English", nativeName: "English" },
    { value: "es", label: "Spanish", nativeName: "Español" },
  ],
  DEFAULT_LANGUAGE: "en",
}));

const mockCreateTemplate = createTemplate as jest.MockedFunction<
  typeof createTemplate
>;
const mockDuplicateTemplate = duplicateTemplate as jest.MockedFunction<
  typeof duplicateTemplate
>;

describe("TemplateFormPane", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockCreateTemplate.mockResolvedValue({
      id: "new-template-123",
      name: "Test Template",
      category: "MICROSITE",
    });
    mockDuplicateTemplate.mockResolvedValue({
      id: "duplicated-template-456",
      name: "Duplicated Template",
      category: "Email",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <TemplateFormPane
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.queryByTestId("pane")).not.toBeInTheDocument();
    });

    it("should render pane when isOpen is true", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("pane")).toBeInTheDocument();
      expect(screen.getByTestId("pane")).toHaveAttribute(
        "data-title",
        "Create Template",
      );
    });

    it("should render all form fields", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByLabelText("Template Name*")).toBeInTheDocument();
      expect(
        screen.getByTestId("select-template-mime-type"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("select-template-category"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("select-template-language"),
      ).toBeInTheDocument();
    });

    it("should render form footer", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("form-pane-footer")).toBeInTheDocument();
    });
  });

  describe("focus behavior", () => {
    it("should focus name input after pane opens", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const nameInput = screen.getByLabelText("Template Name*");

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe("form state reset", () => {
    it("should reset form fields when pane closes", () => {
      const { rerender } = render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const nameInput = screen.getByLabelText("Template Name*");
      fireEvent.change(nameInput, { target: { value: "Test Template" } });

      const categorySelect = screen.getByTestId("select-template-category");
      fireEvent.change(categorySelect, { target: { value: "Email" } });

      rerender(
        <TemplateFormPane
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      rerender(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByLabelText("Template Name*")).toHaveValue("");
      expect(screen.getByTestId("select-template-category")).toHaveValue("");
    });
  });

  describe("form validation", () => {
    it("should have submit button disabled when form is empty", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });

    it("should have submit button disabled with only name filled", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });

      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });

    it("should have submit button disabled with only category filled", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });

    it("should enable submit button when name and category are filled", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      expect(screen.getByTestId("submit-btn")).not.toBeDisabled();
    });

    it("should not validate name with only whitespace", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "   " },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });
  });

  describe("mime type and category interaction", () => {
    it("should reset category when mime type changes", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });
      expect(screen.getByTestId("select-template-category")).toHaveValue(
        "Email",
      );

      fireEvent.change(screen.getByTestId("select-template-mime-type"), {
        target: { value: "text/plain" },
      });

      expect(screen.getByTestId("select-template-category")).toHaveValue("");
    });

    it("should show correct categories for text/plain mime type", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByTestId("select-template-mime-type"), {
        target: { value: "text/plain" },
      });

      const categorySelect = screen.getByTestId("select-template-category");
      expect(categorySelect).toContainHTML("SMS");
      expect(categorySelect).toContainHTML("Notification");
    });
  });

  describe("form submission", () => {
    it("should call createTemplate with correct payload on submit", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Template",
            category: "Email",
            mimeType: "text/html",
          }),
        );
      });
    });

    it("should trim name before submitting", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "  Test Template  " },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Template",
          }),
        );
      });
    });

    it("should call onCreated with template id on success", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith("new-template-123");
      });
    });

    it("should call onClose on success", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should submit form on native form submit event", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      const form = screen.getByLabelText("Template Name*").closest("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled();
      });
    });

    it("should work without onCreated callback", async () => {
      render(<TemplateFormPane isOpen={true} onClose={mockOnClose} />);

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("should display error message on API failure", async () => {
      mockCreateTemplate.mockRejectedValue(new Error("API Error"));

      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(screen.getByText("API Error")).toBeInTheDocument();
      });
    });

    it("should display generic error for non-Error exceptions", async () => {
      mockCreateTemplate.mockRejectedValue("Unknown error");

      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create template"),
        ).toBeInTheDocument();
      });
    });

    it("should clear error when pane closes and reopens", async () => {
      mockCreateTemplate.mockRejectedValue(new Error("API Error"));

      const { rerender } = render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(screen.getByText("API Error")).toBeInTheDocument();
      });

      rerender(
        <TemplateFormPane
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      rerender(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.queryByText("API Error")).not.toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("should call onClose when cancel button is clicked", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.click(screen.getByTestId("cancel-btn"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("language selection", () => {
    it("should default to en language", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("select-template-language")).toHaveValue("en");
    });

    it("should allow changing default language", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByTestId("select-template-language"), {
        target: { value: "es" },
      });

      expect(screen.getByTestId("select-template-language")).toHaveValue("es");
    });

    it("should submit with selected language", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });
      fireEvent.change(screen.getByTestId("select-template-language"), {
        target: { value: "es" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: expect.arrayContaining([
              expect.objectContaining({
                language: "es",
                isDefault: true,
              }),
            ]),
          }),
        );
      });
    });
  });

  describe("edge cases", () => {
    it("should handle unknown mime type with empty categories", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const categorySelect = screen.getByTestId("select-template-category");
      expect(categorySelect.querySelectorAll("option").length).toBeGreaterThan(
        0,
      );
    });

    it("should return empty array for categoryOptions when mime type not found", () => {
      const mockConstants = require("@/app/template-designer/constants");
      const originalOptions = mockConstants.CATEGORY_OPTIONS_BY_MIME_TYPE;

      mockConstants.CATEGORY_OPTIONS_BY_MIME_TYPE = {
        "text/html": [{ value: "Email", label: "Email" }],
      };

      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByTestId("select-template-mime-type"), {
        target: { value: "application/json" },
      });

      const categorySelect = screen.getByTestId("select-template-category");
      const options = categorySelect.querySelectorAll("option");
      expect(options.length).toBe(1);
      expect(options[0]).toHaveTextContent("Select a category");

      mockConstants.CATEGORY_OPTIONS_BY_MIME_TYPE = originalOptions;
    });

    it("should not submit when form is invalid", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Test Template" },
      });

      const submitBtn = screen.getByTestId("submit-btn");
      expect(submitBtn).toBeDisabled();

      fireEvent.click(submitBtn);

      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it("should not submit via form submit when invalid", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "   " },
      });

      const form = screen.getByLabelText("Template Name*").closest("form");
      fireEvent.submit(form!);

      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });
  });

  describe("duplicate mode", () => {
    const mockSourceTemplate = {
      id: "source-123",
      name: "Original Template",
      category: "Email",
      mimeType: "text/html",
      contents: [
        { content: "Hello World", language: "en", isDefault: true },
        { content: "Hola Mundo", language: "es", isDefault: false },
      ],
    };

    it("should render duplicate mode title when mode is duplicate", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("pane")).toHaveAttribute(
        "data-title",
        "Duplicate Template",
      );
    });

    it("should show info banner with source template name", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByText("Duplicating from:")).toBeInTheDocument();
      expect(screen.getByText("Original Template")).toBeInTheDocument();
    });

    it("should pre-fill category from source template", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("select-template-category")).toHaveValue(
        "Email",
      );
    });

    it("should pre-fill mimeType from source template", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("select-template-mime-type")).toHaveValue(
        "text/html",
      );
    });

    it("should leave name field empty in duplicate mode", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByLabelText("Template Name*")).toHaveValue("");
    });

    it("should set default language from source template contents", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );
      expect(screen.getByTestId("select-template-language")).toHaveValue("en");
    });

    it("should call duplicateTemplate on submit", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockDuplicateTemplate).toHaveBeenCalledWith(
          mockSourceTemplate,
          "Duplicated Template",
        );
      });
    });

    it("should not call createTemplate in duplicate mode", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockDuplicateTemplate).toHaveBeenCalled();
      });

      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it("should call onCreated with new template id after duplicate", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith("duplicated-template-456");
      });
    });

    it("should call onClose after successful duplicate", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should show error when source template is missing", async () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={null}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });
      fireEvent.change(screen.getByTestId("select-template-category"), {
        target: { value: "Email" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(
          screen.getByText("Source template not found"),
        ).toBeInTheDocument();
      });
    });

    it("should display error message on duplicate API failure", async () => {
      mockDuplicateTemplate.mockRejectedValue(
        new Error("Duplicate operation failed"),
      );

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(
          screen.getByText("Duplicate operation failed"),
        ).toBeInTheDocument();
      });
    });

    it("should display generic error for non-Error duplicate failures", async () => {
      mockDuplicateTemplate.mockRejectedValue("Some error");

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Duplicated Template" },
      });

      fireEvent.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to duplicate template"),
        ).toBeInTheDocument();
      });
    });

    it("should use default mimeType when source has no mimeType", () => {
      const sourceWithoutMimeType = {
        ...mockSourceTemplate,
        mimeType: undefined,
      };

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={sourceWithoutMimeType}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("select-template-mime-type")).toHaveValue(
        "text/html",
      );
    });

    it("should use default language when source has no contents", () => {
      const sourceWithoutContents = {
        ...mockSourceTemplate,
        contents: undefined,
      };

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={sourceWithoutContents}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("select-template-language")).toHaveValue("en");
    });

    it("should use default language when source has empty contents", () => {
      const sourceWithEmptyContents = {
        ...mockSourceTemplate,
        contents: [],
      };

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={sourceWithEmptyContents}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("select-template-language")).toHaveValue("en");
    });

    it("should find default content language from contents array", () => {
      const sourceWithSpanishDefault = {
        ...mockSourceTemplate,
        contents: [
          { content: "Hello", language: "en", isDefault: false },
          { content: "Hola", language: "es", isDefault: true },
        ],
      };

      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={sourceWithSpanishDefault}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("select-template-language")).toHaveValue("es");
    });

    it("should reset form when switching from duplicate mode back to pane closed", () => {
      const { rerender } = render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      fireEvent.change(screen.getByLabelText("Template Name*"), {
        target: { value: "Some Name" },
      });

      rerender(
        <TemplateFormPane
          isOpen={false}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      rerender(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={mockSourceTemplate}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByLabelText("Template Name*")).toHaveValue("");
    });

    it("should not show info banner when no source template", () => {
      render(
        <TemplateFormPane
          isOpen={true}
          mode="duplicate"
          sourceTemplate={null}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.queryByText("Duplicating from:")).not.toBeInTheDocument();
    });
  });
});
