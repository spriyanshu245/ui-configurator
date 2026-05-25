import { render, screen, fireEvent } from "@testing-library/react";
import PageSettingsPanel from "./PageSettingsPanel";
import { PropertyPanels } from "@/app/utils/constants";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import { useMicrosite } from "@/app/context/MicrositeContext";

// --- Mocks ---
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));
jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));
jest.mock("@/app/utils/utils", () => ({
  renderOptions: jest.fn((options) =>
    options.map((opt: string) => ({ label: opt, value: opt }))
  ),
}));

// Mock styles using Proxy to return class names as strings
jest.mock(
  "@/app/styles/properties-pane.module.scss",
  () => new Proxy({}, { get: (_, prop) => String(prop) })
);

jest.mock("../../SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-down" />
));

// Mock Slider to trigger the onChange(value) branch
jest.mock(
  "../../UIComponents/Slider/Slider",
  () =>
    ({ onChange, value, id }: any) =>
      (
        <input
          data-testid={id}
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )
);

// Mock PropertyInput to trigger handleChange(e) branch
jest.mock(
  "../../PropertyInputs/PropertyInput",
  () =>
    ({ label, value, handleChange, type, options, id, disabled }: any) => {
      if (type === "select") {
        return (
          <select
            data-testid={id}
            value={value}
            onChange={handleChange}
            aria-label={label}
          >
            {options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          data-testid={id}
          value={value}
          onChange={handleChange}
          aria-label={label}
          disabled={disabled}
        />
      );
    }
);

describe("PageSettingsPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();
  const mockUpdateMicrositeProperties = jest.fn();

  const baseComponent = {
    id: "page-1",
    code: "page-code-1",
    slug: "test-slug",
    name: "Test Name",
    description: "Test Desc",
    properties: {
      showAsPopup: false,
      panePosition: "center",
      popupWidth: 50,
      closeOnBackdropClick: false,
    },
  };

  const mockMicrosite = { firstPageCode: "other-page-code" };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(
        (panel) => panel === PropertyPanels.PageSettingsPanel
      ),
    });
    (useMicrosite as jest.Mock).mockReturnValue({
      microsite: mockMicrosite,
      updateMicrositeProperties: mockUpdateMicrositeProperties,
    });
  });

  const renderPanel = (
    keys: ComponentProperty[],
    component: any = baseComponent
  ) =>
    render(
      <PageSettingsPanel
        propertyKeys={keys}
        propertyComponent={component}
        setProperty={mockSetProperty}
      />
    );

  it("toggles panel visibility when the header button is clicked", () => {
    renderPanel([]);
    fireEvent.click(screen.getByTestId("toggleButton"));
    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.PageSettingsPanel
    );
  });

  describe("Property Branch Coverage (Switch Cases)", () => {
    it("handles PageCode, PageSlug, PageName, and Description with correct setProperty calls", () => {
      renderPanel([
        ComponentProperty.PageCode,
        ComponentProperty.PageSlug,
        ComponentProperty.PageName,
        ComponentProperty.Description,
      ]);

      fireEvent.change(screen.getByTestId("pageCode"), {
        target: { value: "c-1" },
      });
      fireEvent.change(screen.getByTestId("pageSlug"), {
        target: { value: "s-1" },
      });
      fireEvent.change(screen.getByTestId("pageName"), {
        target: { value: "n-1" },
      });
      fireEvent.change(screen.getByTestId("description"), {
        target: { value: "d-1" },
      });

      // Verifies the 'false' flag used for top-level fields
      expect(mockSetProperty).toHaveBeenCalledWith("code", "c-1", false);
      expect(mockSetProperty).toHaveBeenCalledWith("slug", "s-1", false);
      expect(mockSetProperty).toHaveBeenCalledWith("name", "n-1", false);
      expect(mockSetProperty).toHaveBeenCalledWith("description", "d-1", false);
    });

    it("handles the default case for unknown property keys", () => {
      const { container } = renderPanel(["UNKNOWN" as any]);
      expect(container.querySelectorAll("input")).toHaveLength(0);
    });
  });

  describe("FirstPage logic", () => {
    it("updates microsite properties when checkbox is toggled", () => {
      const { rerender } = renderPanel([ComponentProperty.FirstPage]);
      const checkbox = screen.getByTestId("firstPage");

      // Check
      fireEvent.click(checkbox);
      expect(mockUpdateMicrositeProperties).toHaveBeenCalledWith({
        firstPageCode: "page-code-1",
      });

      // Uncheck (mocking state change)
      (useMicrosite as jest.Mock).mockReturnValue({
        microsite: { firstPageCode: "page-code-1" },
        updateMicrositeProperties: mockUpdateMicrositeProperties,
      });
      rerender(
        <PageSettingsPanel
          propertyKeys={[ComponentProperty.FirstPage]}
          propertyComponent={baseComponent}
          setProperty={mockSetProperty}
        />
      );
      fireEvent.click(screen.getAllByTestId("firstPage")[0]);
      expect(mockUpdateMicrositeProperties).toHaveBeenCalledWith({
        firstPageCode: "",
      });
    });

    it("returns null for FirstPage field if page is a popup", () => {
      renderPanel([ComponentProperty.FirstPage], {
        properties: { showAsPopup: true },
      });
      expect(screen.queryByTestId("firstPage")).not.toBeInTheDocument();
    });
  });

  describe("Popup and setProperty handler coverage", () => {
    const popupComp = {
      code: "page-1",
      properties: {
        showAsPopup: true,
        closeOnBackdropClick: false,
      },
    };

    it("triggers setProperty for ShowAsPopup checkbox", () => {
      renderPanel([ComponentProperty.ShowAsPopup], popupComp);
      fireEvent.click(screen.getByTestId("showAsPopup"));
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.ShowAsPopup,
        false
      );
    });

    it("triggers setProperty for PanePosition select and covers ?? 'center' branch", () => {
      // Scenario: Missing panePosition triggers "center"
      renderPanel([ComponentProperty.PanePosition], popupComp);
      const select = screen.getByTestId("panePosition");
      expect(select).toHaveValue("center");

      fireEvent.change(select, { target: { value: "left" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PanePosition,
        "left"
      );
    });

    it("triggers setProperty for PopupWidth slider and covers || 100 branch", () => {
      // Scenario: Missing width triggers 100
      renderPanel([ComponentProperty.PopupWidth], popupComp);
      const slider = screen.getByTestId("width");
      expect(slider).toHaveValue("100");

      fireEvent.change(slider, { target: { value: "85" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PopupWidth,
        85
      );
    });

    it("triggers setProperty for CloseOnBackdropClick checkbox", () => {
      renderPanel([ComponentProperty.CloseOnBackdropClick], popupComp);
      fireEvent.click(screen.getByTestId("closeOnBackdropClick"));
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CloseOnBackdropClick,
        true
      );
    });

    it("does not render popup fields if showAsPopup is false", () => {
      renderPanel([
        ComponentProperty.PanePosition,
        ComponentProperty.PopupWidth,
        ComponentProperty.CloseOnBackdropClick,
      ]);
      expect(screen.queryByTestId("panePosition")).not.toBeInTheDocument();
      expect(screen.queryByTestId("width")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("closeOnBackdropClick")
      ).not.toBeInTheDocument();
    });
  });

  it("returns null when isPanelOpen is false or undefined", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      isPanelOpen: () => false,
    });
    const { container } = renderPanel([ComponentProperty.PageName]);
    expect(container.querySelector("input")).not.toBeInTheDocument();

    (usePropertyPane as jest.Mock).mockReturnValue({ isPanelOpen: undefined });
    render(
      <PageSettingsPanel
        propertyKeys={[]}
        propertyComponent={baseComponent}
        setProperty={mockSetProperty}
      />
    );
    expect(screen.queryByTestId("pageName")).not.toBeInTheDocument();
  });
});
