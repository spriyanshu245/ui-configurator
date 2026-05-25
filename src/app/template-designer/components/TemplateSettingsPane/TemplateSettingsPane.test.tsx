import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TemplateSettingsPane from "./TemplateSettingsPane";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { SupportedLanguage } from "../../../types";

jest.mock("../../context/TemplateDesignerContext");
jest.mock("@/app/components/SVGIcons/Delete", () => ({
  __esModule: true,
  default: () => <svg data-testid="delete-icon" />,
}));
jest.mock("@/app/components/SVGIcons/Plus", () => ({
  __esModule: true,
  default: () => <svg data-testid="plus-icon" />,
}));
jest.mock("@/app/components/SVGIcons/LockFilled", () => ({
  __esModule: true,
  default: () => <svg data-testid="lock-icon" />,
}));
jest.mock("@/app/components/SVGIcons/UnlockFilled", () => ({
  __esModule: true,
  default: () => <svg data-testid="unlock-icon" />,
}));
jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({
    children,
    text,
  }: {
    children: React.ReactNode;
    text: string;
  }) => <div data-tooltip={text}>{children}</div>,
}));
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
    }: {
      id: string;
      options: { value: string; label: string }[];
      value: string;
      onChange: (val: string) => void;
      placeholder?: string;
      showSearch?: boolean;
    }) => (
      <select
        data-testid={`select-${id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  })
);
jest.mock(
  "@/app/components/HelperComponents/ColorPicker/ColorPicker",
  () => ({
    __esModule: true,
    default: ({
      id,
      value,
      onChange,
    }: {
      id: string;
      value: string;
      onChange: (color: string) => void;
    }) => (
      <input
        data-testid={`color-picker-${id}`}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  })
);
jest.mock("@/app/components/HelperComponents/Tabs/Tabs", () => ({
  __esModule: true,
  default: ({
    children,
    defaultIndex,
  }: {
    children: React.ReactNode;
    defaultIndex: number;
  }) => (
    <div data-testid="tabs" data-default-index={defaultIndex}>
      {children}
    </div>
  ),
}));
jest.mock("@/app/components/HelperComponents/Tabs/TabList", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tab-list" role="tablist">
      {children}
    </div>
  ),
}));
jest.mock("@/app/components/HelperComponents/Tabs/Tab", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="tab" role="tab">
      {children}
    </button>
  ),
}));
jest.mock("@/app/components/HelperComponents/Tabs/TabPanel", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tab-panel" role="tabpanel">
      {children}
    </div>
  ),
}));

jest.mock("@/app/template-designer/constants", () => ({
  BODY_PADDING_OPTIONS: [
    { value: "0px", label: "None (0px)" },
    { value: "16px", label: "Medium (16px)" },
  ],
  CATEGORY_OPTIONS_BY_MIME_TYPE: {
    "text/html": [
      { value: "Document", label: "Document" },
      { value: "Email", label: "Email" },
    ],
    "text/plain": [
      { value: "SMS", label: "SMS" },
      { value: "Email", label: "Email" },
    ],
  },
  FONT_FAMILY_OPTIONS: [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Georgia, serif", label: "Georgia" },
  ],
  LINE_HEIGHT_OPTIONS: [
    { value: "1.5", label: "1.5 (Normal)" },
    { value: "1.8", label: "1.8 (Loose)" },
  ],
  PAGE_SIZE_OPTIONS: [
    { value: "600", label: "Email (Standard, 600px)" },
    { value: "794", label: "A4 Document (794px)" },
  ],
  SUPPORTED_LANGUAGES: [
    { value: "en", label: "English", nativeName: "English" },
    { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
    { value: "gu", label: "Gujarati", nativeName: "ગુજરાતી" },
  ] as SupportedLanguage[],
}));

const mockUseTemplateDesigner = useTemplateDesigner as jest.MockedFunction<
  typeof useTemplateDesigner
>;

const createMockContext = (overrides = {}) => ({
  templateName: "Test Template",
  templateMimeType: "text/html",
  templateCategory: "Email",
  globalStyles: {
    htmlTitle: "Test Title",
    preheaderText: "Preview text",
    bodyBackgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    textColor: "#333333",
    lineHeight: "1.5",
    contentMaxWidth: { value: "600", label: "Email (Standard, 600px)" },
    bodyPadding: "16px",
    linkColor: "#0066cc",
    linkHoverColor: "#004499",
  },
  setTemplateName: jest.fn(),
  setTemplateCategory: jest.fn(),
  setGlobalStyles: jest.fn(),
  availableLanguages: [
    { value: "en", label: "English", nativeName: "English" },
  ] as SupportedLanguage[],
  defaultLanguage: { value: "en", label: "English", nativeName: "English" },
  isTranslating: false,
  addLanguage: jest.fn().mockResolvedValue(undefined),
  removeLanguage: jest.fn(),
  isLanguageAutoTranslated: jest.fn().mockReturnValue(false),
  ...overrides,
});

describe("TemplateSettingsPane", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={false} onClose={jest.fn()} />);
      expect(screen.queryByTestId("pane")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("pane")).toBeInTheDocument();
    });

    it("should render tabs for HTML template", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const tabs = screen.getAllByTestId("tab");
      expect(tabs).toHaveLength(4);
      expect(tabs[0]).toHaveTextContent("General");
      expect(tabs[1]).toHaveTextContent("Languages");
      expect(tabs[2]).toHaveTextContent("Body Styles");
      expect(tabs[3]).toHaveTextContent("Link Styles");
    });

    it("should render only General and Languages tabs for plain text template", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ templateMimeType: "text/plain" }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const tabs = screen.getAllByTestId("tab");
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveTextContent("General");
      expect(tabs[1]).toHaveTextContent("Languages");
    });

    it("should hide language management for communication HTML templates", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(
        <TemplateSettingsPane
          isOpen={true}
          onClose={jest.fn()}
          mode="communication"
        />
      );

      const tabs = screen.getAllByTestId("tab");
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent("General");
      expect(tabs[1]).toHaveTextContent("Body Styles");
      expect(tabs[2]).toHaveTextContent("Link Styles");
      expect(screen.queryByText("Languages")).not.toBeInTheDocument();
      expect(screen.queryByText("Hindi")).not.toBeInTheDocument();
    });

    it("should hide tab selector for communication plain text templates", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ templateMimeType: "text/plain" }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(
        <TemplateSettingsPane
          isOpen={true}
          onClose={jest.fn()}
          mode="communication"
        />
      );

      expect(screen.queryByTestId("tabs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("tab-list")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Template Name")).toBeInTheDocument();
      expect(screen.queryByText("Languages")).not.toBeInTheDocument();
      expect(screen.queryByText("Hindi")).not.toBeInTheDocument();
    });
  });

  describe("General Tab", () => {
    it("should render template name input with value", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const nameInput = screen.getByLabelText("Template Name");
      expect(nameInput).toHaveValue("Test Template");
    });

    it("should call setTemplateName on name input change", () => {
      const setTemplateName = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setTemplateName }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const nameInput = screen.getByLabelText("Template Name");
      fireEvent.change(nameInput, { target: { value: "New Name" } });
      expect(setTemplateName).toHaveBeenCalledWith("New Name");
    });

    it("should show MIME type as disabled input", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const mimeInput = screen.getByLabelText("MIME Type");
      expect(mimeInput).toBeDisabled();
      expect(mimeInput).toHaveValue("HTML");
    });

    it("should show Text for plain text MIME type", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ templateMimeType: "text/plain" }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const mimeInput = screen.getByLabelText("MIME Type");
      expect(mimeInput).toHaveValue("Text");
    });

    it("should show raw MIME type for unknown types", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({
          templateMimeType: "application/json",
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const mimeInput = screen.getByLabelText("MIME Type");
      expect(mimeInput).toHaveValue("application/json");
    });

    it("should render category dropdown", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(
        screen.getByTestId("select-template-category")
      ).toBeInTheDocument();
    });

    it("should call setTemplateCategory on category change", () => {
      const setTemplateCategory = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setTemplateCategory }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-template-category");
      fireEvent.change(select, { target: { value: "Document" } });
      expect(setTemplateCategory).toHaveBeenCalledWith("Document");
    });

    it("should render HTML title input for HTML templates", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByLabelText("HTML Title")).toBeInTheDocument();
    });

    it("should not render HTML title input for plain text templates", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ templateMimeType: "text/plain" }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.queryByLabelText("HTML Title")).not.toBeInTheDocument();
    });

    it("should call setGlobalStyles when HTML title changes", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const titleInput = screen.getByLabelText("HTML Title");
      fireEvent.change(titleInput, { target: { value: "New Title" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ htmlTitle: "New Title" });
    });

    it("should render preheader text input for HTML templates", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByLabelText("Preheader Text")).toBeInTheDocument();
    });

    it("should call setGlobalStyles when preheader text changes", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const preheaderInput = screen.getByLabelText("Preheader Text");
      fireEvent.change(preheaderInput, { target: { value: "New preheader" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({
        preheaderText: "New preheader",
      });
    });
  });

  describe("Body Styles Tab", () => {
    it("should render background color picker", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(
        screen.getByTestId("color-picker-body-bg-color")
      ).toBeInTheDocument();
    });

    it("should call setGlobalStyles on background color change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const colorPicker = screen.getByTestId("color-picker-body-bg-color");
      fireEvent.change(colorPicker, { target: { value: "#ff0000" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({
        bodyBackgroundColor: "#ff0000",
      });
    });

    it("should render font family dropdown", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("select-font-family")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on font family change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-font-family");
      fireEvent.change(select, { target: { value: "Georgia, serif" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({
        fontFamily: "Georgia, serif",
      });
    });

    it("should render font size input with numeric value only", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const fontSizeInput = screen.getByLabelText("Font Size");
      expect(fontSizeInput).toHaveValue("14");
    });

    it("should call setGlobalStyles on font size change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const fontSizeInput = screen.getByLabelText("Font Size");
      fireEvent.change(fontSizeInput, { target: { value: "16" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ fontSize: "16px" });
    });

    it("should render text color picker", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("color-picker-text-color")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on text color change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const colorPicker = screen.getByTestId("color-picker-text-color");
      fireEvent.change(colorPicker, { target: { value: "#000000" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ textColor: "#000000" });
    });

    it("should render line height dropdown", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("select-line-height")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on line height change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-line-height");
      fireEvent.change(select, { target: { value: "1.8" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ lineHeight: "1.8" });
    });

    it("should render page size dropdown", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("select-page-size")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on page size change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-page-size");
      fireEvent.change(select, { target: { value: "794" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({
        contentMaxWidth: { value: "794", label: "A4 Document (794px)" },
      });
    });

    it("should not call setGlobalStyles for invalid page size", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-page-size");
      fireEvent.change(select, { target: { value: "invalid" } });
      expect(setGlobalStyles).not.toHaveBeenCalled();
    });

    it("should render body padding dropdown", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("select-body-padding")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on body padding change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-body-padding");
      fireEvent.change(select, { target: { value: "0px" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ bodyPadding: "0px" });
    });
  });

  describe("Link Styles Tab", () => {
    it("should render link color picker", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByTestId("color-picker-link-color")).toBeInTheDocument();
    });

    it("should call setGlobalStyles on link color change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const colorPicker = screen.getByTestId("color-picker-link-color");
      fireEvent.change(colorPicker, { target: { value: "#0000ff" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({ linkColor: "#0000ff" });
    });

    it("should render link hover color picker", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(
        screen.getByTestId("color-picker-link-hover-color")
      ).toBeInTheDocument();
    });

    it("should call setGlobalStyles on link hover color change", () => {
      const setGlobalStyles = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ setGlobalStyles }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const colorPicker = screen.getByTestId("color-picker-link-hover-color");
      fireEvent.change(colorPicker, { target: { value: "#0000aa" } });
      expect(setGlobalStyles).toHaveBeenCalledWith({
        linkHoverColor: "#0000aa",
      });
    });
  });

  describe("Languages Tab", () => {
    it("should render available languages", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("should show default badge for default language", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText("Default")).toBeInTheDocument();
    });

    it("should disable delete button for default language", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const deleteButtons = screen.getAllByRole("button");
      const disabledDeleteBtn = deleteButtons.find(
        (btn) =>
          btn.getAttribute("data-tooltip") ===
            "Cannot delete default language" ||
          btn.closest("[data-tooltip='Cannot delete default language']")
      );
      expect(disabledDeleteBtn).toBeDefined();
    });

    it("should render languages to add", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText("Hindi")).toBeInTheDocument();
      expect(screen.getByText("Gujarati")).toBeInTheDocument();
    });

    it("should show native name for non-English available languages", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({
          availableLanguages: [
            { value: "en", label: "English", nativeName: "English" },
            { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
          ],
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText("हिन्दी")).toBeInTheDocument();
    });

    it("should not show native name for English in available languages", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const englishCards = screen.getAllByText("English");
      expect(englishCards).toHaveLength(1);
    });

    it("should call addLanguage when clicking on language to add", async () => {
      const addLanguage = jest.fn().mockResolvedValue(undefined);
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ addLanguage }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const hindiButton = screen.getByText("Hindi").closest("button");
      fireEvent.click(hindiButton!);
      await waitFor(() => {
        expect(addLanguage).toHaveBeenCalledWith({
          value: "hi",
          label: "Hindi",
          nativeName: "हिन्दी",
        });
      });
    });

    it("should call removeLanguage when clicking delete on non-default language", () => {
      const removeLanguage = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({
          removeLanguage,
          availableLanguages: [
            { value: "en", label: "English", nativeName: "English" },
            { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
          ],
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const deleteButtons = screen.getAllByTestId("delete-icon");
      fireEvent.click(deleteButtons[1]);
      expect(removeLanguage).toHaveBeenCalledWith({
        value: "hi",
        label: "Hindi",
        nativeName: "हिन्दी",
      });
    });

    it("should disable language buttons when translating", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ isTranslating: true }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const hindiButton = screen.getByText("Hindi").closest("button");
      expect(hindiButton).toBeDisabled();
    });

    it("should show translating overlay when isTranslating is true", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ isTranslating: true }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      const { container } = render(
        <TemplateSettingsPane isOpen={true} onClose={jest.fn()} />
      );
      expect(
        container.querySelector('[class*="translatingOverlay"]')
      ).toBeInTheDocument();
    });

    it("should disable delete button for non-default language when translating", () => {
      const removeLanguage = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({
          removeLanguage,
          isTranslating: true,
          availableLanguages: [
            { value: "en", label: "English", nativeName: "English" },
            { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
          ],
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const deleteButtons = screen.getAllByTitle("Delete language");
      expect(deleteButtons[0]).toBeDisabled();
    });
  });

  describe("Footer", () => {
    it("should render Done button", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("should call onClose when Done button is clicked", () => {
      const onClose = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByText("Done"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Focus behavior", () => {
    it("should focus name input after pane opens", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const nameInput = screen.getByLabelText("Template Name");
      jest.advanceTimersByTime(400);
      expect(document.activeElement).toBe(nameInput);
    });

    it("should not focus when pane is closed", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={false} onClose={jest.fn()} />);
      jest.advanceTimersByTime(400);
      expect(screen.queryByLabelText("Template Name")).not.toBeInTheDocument();
    });
  });

  describe("Category options", () => {
    it("should use correct category options for HTML mime type", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext() as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-template-category");
      expect(select).toContainHTML("Document");
      expect(select).toContainHTML("Email");
    });

    it("should use correct category options for plain text mime type", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({ templateMimeType: "text/plain" }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-template-category");
      expect(select).toContainHTML("SMS");
    });

    it("should handle unknown mime type with empty category options", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockContext({
          templateMimeType: "application/pdf",
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<TemplateSettingsPane isOpen={true} onClose={jest.fn()} />);
      const select = screen.getByTestId("select-template-category");
      expect(select).toBeInTheDocument();
    });
  });
});
