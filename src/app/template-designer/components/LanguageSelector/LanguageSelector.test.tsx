import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LanguageSelector from "./LanguageSelector";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { SupportedLanguage } from "../../../types";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

jest.mock("@/app/template-designer/constants", () => ({
  SUPPORTED_LANGUAGES: [
    { value: "en", label: "English", nativeName: "English" },
    { value: "es", label: "Spanish", nativeName: "Español" },
    { value: "fr", label: "French", nativeName: "Français" },
  ],
}));

jest.mock("@/app/components/SVGIcons/ChevronDown", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down-icon" />,
}));

jest.mock("@/app/components/SVGIcons/Delete", () => ({
  __esModule: true,
  default: () => <span data-testid="delete-icon" />,
}));

jest.mock("@/app/components/SVGIcons/LockFilled", () => ({
  __esModule: true,
  default: () => <span data-testid="lock-icon" />,
}));

jest.mock("@/app/components/SVGIcons/UnlockFilled", () => ({
  __esModule: true,
  default: () => <span data-testid="unlock-icon" />,
}));

jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({
    children,
    text,
  }: {
    children: React.ReactNode;
    text: string;
  }) => <span data-tooltip={text}>{children}</span>,
}));

jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => ({
    __esModule: true,
    default: () => <span data-testid="inline-loader" />,
  })
);

const mockUseTemplateDesigner = useTemplateDesigner as jest.Mock;

const englishLang: SupportedLanguage = {
  value: "en",
  label: "English",
  nativeName: "English",
};
const spanishLang: SupportedLanguage = {
  value: "es",
  label: "Spanish",
  nativeName: "Español",
};
const frenchLang: SupportedLanguage = {
  value: "fr",
  label: "French",
  nativeName: "Français",
};
const allLangs = [englishLang, spanishLang, frenchLang];

const createMockContext = (overrides = {}) => ({
  currentLanguage: englishLang,
  defaultLanguage: englishLang,
  availableLanguages: [englishLang, spanishLang],
  isTranslating: false,
  setCurrentLanguage: jest.fn(),
  addLanguage: jest.fn().mockResolvedValue(undefined),
  removeLanguage: jest.fn(),
  isLanguageAutoTranslated: jest.fn().mockReturnValue(false),
  ...overrides,
});

describe("LanguageSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTemplateDesigner.mockReturnValue(createMockContext());
  });

  it("renders with current language name", () => {
    render(<LanguageSelector />);
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows translating state when isTranslating is true", () => {
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ isTranslating: true })
    );
    render(<LanguageSelector />);
    expect(screen.getByText("Translating")).toBeInTheDocument();
    expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
  });

  it("opens menu when trigger is clicked", () => {
    render(<LanguageSelector />);
    const trigger = screen.getByRole("button", { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("does not open menu when translating", () => {
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ isTranslating: true })
    );
    render(<LanguageSelector />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(screen.queryByText("Español")).not.toBeInTheDocument();
  });

  it("closes menu when clicking outside", async () => {
    render(<LanguageSelector />);
    const trigger = screen.getByRole("button", { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText("Español")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Español")).not.toBeInTheDocument();
    });
  });

  it("closes menu on Escape key", async () => {
    render(<LanguageSelector />);
    const trigger = screen.getByRole("button", { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText("Español")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Español")).not.toBeInTheDocument();
    });
  });

  it("selects a language when clicked", async () => {
    const setCurrentLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ setCurrentLanguage })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Español"));

    expect(setCurrentLanguage).toHaveBeenCalledWith(spanishLang);
  });

  it("selects a language on Enter key", async () => {
    const setCurrentLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ setCurrentLanguage })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const spanishItem = screen.getByText("Español").closest('[role="button"]')!;
    fireEvent.keyDown(spanishItem, { key: "Enter" });

    expect(setCurrentLanguage).toHaveBeenCalledWith(spanishLang);
  });

  it("selects a language on Space key", async () => {
    const setCurrentLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ setCurrentLanguage })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const spanishItem = screen.getByText("Español").closest('[role="button"]')!;
    fireEvent.keyDown(spanishItem, { key: " " });

    expect(setCurrentLanguage).toHaveBeenCalledWith(spanishLang);
  });

  it("shows default badge for default language", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("disables delete button for default language", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const disabledDeleteBtn = screen.getByRole("button", {
      name: "Cannot delete default language",
    });
    expect(disabledDeleteBtn).toBeDisabled();
  });

  it("deletes a non-default language", () => {
    const removeLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ removeLanguage })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const deleteBtn = screen.getByRole("button", { name: "Delete Spanish" });
    fireEvent.click(deleteBtn);

    expect(removeLanguage).toHaveBeenCalledWith(spanishLang);
  });

  it("does not delete default language even if attempted", () => {
    const removeLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({
        removeLanguage,
        currentLanguage: englishLang,
        availableLanguages: [englishLang],
      })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(removeLanguage).not.toHaveBeenCalled();
  });

  it("shows Add Language option when languages are available to add", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByText("Add Language")).toBeInTheDocument();
  });

  it("toggles add menu when Add Language is clicked", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("toggles add menu on Enter key", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const addLangItem = screen
      .getByText("Add Language")
      .closest('[role="button"]')!;
    fireEvent.keyDown(addLangItem, { key: "Enter" });
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("toggles add menu on Space key", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const addLangItem = screen
      .getByText("Add Language")
      .closest('[role="button"]')!;
    fireEvent.keyDown(addLangItem, { key: " " });
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("adds a new language when selected from submenu", async () => {
    const addLanguage = jest.fn().mockResolvedValue(undefined);
    mockUseTemplateDesigner.mockReturnValue(createMockContext({ addLanguage }));
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));
    fireEvent.click(screen.getByText("Français"));

    expect(addLanguage).toHaveBeenCalledWith(frenchLang);
  });

  it("adds a new language on Enter key", async () => {
    const addLanguage = jest.fn().mockResolvedValue(undefined);
    mockUseTemplateDesigner.mockReturnValue(createMockContext({ addLanguage }));
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));
    const frenchItem = screen.getByText("Français").closest('[role="button"]')!;
    fireEvent.keyDown(frenchItem, { key: "Enter" });

    expect(addLanguage).toHaveBeenCalledWith(frenchLang);
  });

  it("adds a new language on Space key", async () => {
    const addLanguage = jest.fn().mockResolvedValue(undefined);
    mockUseTemplateDesigner.mockReturnValue(createMockContext({ addLanguage }));
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));
    const frenchItem = screen.getByText("Français").closest('[role="button"]')!;
    fireEvent.keyDown(frenchItem, { key: " " });

    expect(addLanguage).toHaveBeenCalledWith(frenchLang);
  });

  it("auto-shows add menu when only one language available", () => {
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({
        availableLanguages: [englishLang],
      })
    );
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("highlights the current language in menu", () => {
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ currentLanguage: spanishLang })
    );
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const spanishItems = screen.getAllByText("Español");
    const spanishMenuItem = spanishItems[1].closest('[role="button"]');
    expect(spanishMenuItem).toHaveClass("active");
  });

  it("does not close menu when clicking inside menu", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const menuItem = screen.getAllByText("English")[0];
    fireEvent.mouseDown(menuItem);

    expect(screen.getByText("Add Language")).toBeInTheDocument();
  });

  it("does not close menu when clicking on container", () => {
    const { container } = render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const selectorDiv = container.querySelector('[class*="languageSelector"]');
    fireEvent.mouseDown(selectorDiv!);

    expect(screen.getByText("Add Language")).toBeInTheDocument();
  });

  it("ignores non-enter/space keys on menu items", () => {
    const setCurrentLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({ setCurrentLanguage })
    );
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    const spanishItem = screen.getByText("Español").closest('[role="button"]')!;
    fireEvent.keyDown(spanishItem, { key: "Tab" });

    expect(setCurrentLanguage).not.toHaveBeenCalled();
  });

  it("ignores non-enter/space keys on add language item", () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const addLangItem = screen
      .getByText("Add Language")
      .closest('[role="button"]')!;
    fireEvent.keyDown(addLangItem, { key: "Tab" });

    expect(screen.queryByText("Français")).not.toBeInTheDocument();
  });

  it("ignores non-enter/space keys on submenu items", () => {
    const addLanguage = jest.fn();
    mockUseTemplateDesigner.mockReturnValue(createMockContext({ addLanguage }));
    render(<LanguageSelector />);

    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));

    const frenchItem = screen.getByText("Français").closest('[role="button"]')!;
    fireEvent.keyDown(frenchItem, { key: "Tab" });

    expect(addLanguage).not.toHaveBeenCalled();
  });

  it("closes add menu when menu is closed", async () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByText("Add Language"));
    expect(screen.getByText("Français")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Français")).not.toBeInTheDocument();
    });
  });

  it("does not show add language section when all languages are added", () => {
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext({
        availableLanguages: allLangs,
      })
    );
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.queryByText("Add Language")).not.toBeInTheDocument();
  });
});
