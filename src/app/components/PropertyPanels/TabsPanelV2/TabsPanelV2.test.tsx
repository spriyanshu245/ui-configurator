import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TabsPanelV2 from "./TabsPanelV2";
import { ComponentProperty } from "../../../data/componentProperties";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { useMicrosite } from "../../../context/MicrositeContext";
import useDurableMicrositePageCreation from "../../../hooks/useDurableMicrositePageCreation";

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("../../../hooks/useDurableMicrositePageCreation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../utils/utils", () => ({
  generateRandomId: jest.fn().mockReturnValue("mock-id-123"),
}));

jest.mock("../../../styles/properties-pane.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});
jest.mock("../../../styles/shared.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});
jest.mock("./TabsPanel.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});
jest.mock("../../ExpandableColumn/ExpandableColumn.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("../../SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-down" />
));

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({ children, label }: any) => (
    <div data-testid="expandable-column">
      <span>{label}</span>
      {children}
    </div>
  ),
  AddExpandableColumn: ({ handleAddCol, label }: any) => (
    <button data-testid={`add-${label}`} onClick={handleAddCol}>
      Add {label}
    </button>
  ),
}));

jest.mock("./TabsRow", () => ({
  __esModule: true,
  default: () => <div data-testid="tabs-row" />,
}));

jest.mock("../../InternalComponents/Pane/FormPane/FormPane", () => {
  return function MockFormPane({ isOpen, onCreated, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="form-pane">
        <button
          data-testid="create-page-btn"
          onClick={async () => {
            try {
              await onCreated("NEW_PAGE_CODE");
            } catch {}
          }}
        >
          Create Page
        </button>
        <button data-testid="close-form-btn" onClick={onClose}>
          Close Form
        </button>
      </div>
    );
  };
});

jest.mock("../../InternalComponents/Pane/Pane", () => {
  return function MockPane({
    isOpen,
    onClose,
    paneFooter,
    children,
    title,
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="pane-modal">
        <h1>{title}</h1>
        {children}
        <div data-testid="pane-footer">{paneFooter}</div>
        <button data-testid="close-pane-btn" onClick={onClose}>
          Close Pane
        </button>
      </div>
    );
  };
});

jest.mock("../../InternalComponents/SelectDropdown/SelectDropdown", () => {
  return function MockSelectDropdown({ value, onChange, options }: any) {
    return (
      <select
        data-testid="select-page-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

describe("TabsPanelV2 Component", () => {
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();
  const mockSetProperty = jest.fn();
  const mockPersistCreatedPage = jest.fn();

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.TabLayout,
      ComponentProperty.TabLevel,
      ComponentProperty.RowTabCount,
      ComponentProperty.TabOrderV2,
    ],
    propertyComponent: {
      id: "comp-1",
      type: "tabs",
      displayName: "Tabs",
      category: "component",
      components: [
        {
          id: "tab-1",
          properties: { title: "Tab 1" },
          type: "tab",
          category: "component",
          components: [],
        },
      ],
      properties: {
        tabLayout: "horizontal",
        tabLevel: "L1",
      },
      isSection: false,
      isComponent: true,
    },
    setProperty: mockSetProperty,
  };

  const mockMicrosite = {
    code: "MS1",
    pages: [{ pageCode: "PAGE_1" }, { pageCode: "PAGE_2" }, { pageCode: "" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
    (useMicrosite as jest.Mock).mockReturnValue({
      microsite: mockMicrosite,
    });
    (useDurableMicrositePageCreation as jest.Mock).mockReturnValue({
      persistCreatedPage: mockPersistCreatedPage.mockResolvedValue(undefined),
    });
    mockIsPanelOpen.mockReturnValue(true);
  });

  it("renders panel header and toggles visibility", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    const tabsTexts = screen.getAllByText("Tabs");
    expect(tabsTexts.length).toBeGreaterThan(0);
    expect(tabsTexts[0]).toBeInTheDocument();

    const toggleBtn = screen
      .getByTestId("tabsPanel")
      .querySelector("#toggleButton");
    fireEvent.click(toggleBtn!);

    expect(mockTogglePanel).toHaveBeenCalledWith("TabsPanelV2");
  });

  it("renders correctly when collapsed", () => {
    mockIsPanelOpen.mockReturnValue(false);
    render(<TabsPanelV2 {...defaultProps} />);

    expect(screen.queryByText("Tab Layout Type")).not.toBeInTheDocument();

    const headerBtn = screen
      .getByTestId("tabsPanel")
      .querySelector("#toggleButton");

    expect(headerBtn).not.toHaveClass("isOpen");
  });

  it("renders Tab Layout dropdown and handles change", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    expect(screen.getByText("Tab Layout Type")).toBeInTheDocument();
    const select = screen.getByTestId("fieldLayout");
    expect(select).toHaveValue("horizontal");

    fireEvent.change(select, { target: { value: "horizontal" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TabLayout,
      "horizontal"
    );
  });

  it("renders Tab Level options and handles selection", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    expect(screen.getByText("Tabs Level")).toBeInTheDocument();
    const l2Btn = screen.getByText("L2");

    fireEvent.click(l2Btn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TabLevel,
      "L2"
    );
  });

  it("renders Row Tab Count input only when horizontal", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    const input = screen.getByPlaceholderText("Enter row tab count");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "5" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RowTabCount,
      "5"
    );

    fireEvent.change(input, { target: { value: "-1" } });
    expect(mockSetProperty).not.toHaveBeenCalledWith(
      ComponentProperty.RowTabCount,
      "-1"
    );
  });

  it("hides Row Tab Count input when layout is vertical (or not horizontal)", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: { tabLayout: "vertical" },
      },
    };
    render(<TabsPanelV2 {...props} />);

    expect(
      screen.queryByPlaceholderText("Enter row tab count")
    ).not.toBeInTheDocument();
  });

  it("renders Tab Order section with draggable rows", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    const tabsHeaders = screen.getAllByText("Tabs");
    expect(tabsHeaders.length).toBeGreaterThan(0);

    expect(screen.getByTestId("expandable-column")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-row")).toBeInTheDocument();
  });

  it("opens FormPane to create new page tab", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    const addTabBtn = screen.getByTestId("add-tab");
    fireEvent.click(addTabBtn);

    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
  });

  it("closes FormPane", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-tab"));
    const closeBtn = screen.getByTestId("close-form-btn");
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
  });

  it("adds new tab when page is created via FormPane", async () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-tab"));
    const createBtn = screen.getByTestId("create-page-btn");
    await act(async () => {
      fireEvent.click(createBtn);
    });

    await waitFor(() => {
      expect(mockPersistCreatedPage).toHaveBeenCalledWith("NEW_PAGE_CODE");
      expect(mockSetProperty).toHaveBeenCalledWith(
        "components",
        expect.arrayContaining([
          expect.objectContaining({
            id: "mock-id-123",
            pageCode: "NEW_PAGE_CODE",
            properties: expect.objectContaining({
              title: "Tab 2",
            }),
          }),
        ]),
        true,
      );
    });
  });

  it("does not add a new tab when durable page persistence fails", async () => {
    mockPersistCreatedPage.mockRejectedValueOnce(
      new Error("Failed to save microsite"),
    );

    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-tab"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("create-page-btn"));
    });

    await waitFor(() => {
      expect(mockPersistCreatedPage).toHaveBeenCalledWith("NEW_PAGE_CODE");
    });

    expect(mockSetProperty).not.toHaveBeenCalledWith(
      "components",
      expect.arrayContaining([
        expect.objectContaining({
          pageCode: "NEW_PAGE_CODE",
        }),
      ]),
      true,
    );
  });

  it("opens Pane to add existing page tab", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    const addExistingBtn = screen.getByTestId("add-existing page");
    fireEvent.click(addExistingBtn);

    expect(screen.getByTestId("pane-modal")).toBeInTheDocument();

    expect(
      screen.getByText("Create a Tab With Existing page")
    ).toBeInTheDocument();
  });

  it("closes existing page Pane on cancel", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-existing page"));

    const cancelBtn = screen.getByTestId("cancel");
    fireEvent.click(cancelBtn);

    expect(screen.queryByTestId("pane-modal")).not.toBeInTheDocument();
  });

  it("adds existing page as tab on save", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-existing page"));

    const select = screen.getByTestId("select-page-dropdown");
    fireEvent.change(select, { target: { value: "PAGE_1" } });

    const saveBtn = screen.getByTestId("save-button");
    fireEvent.click(saveBtn);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      expect.arrayContaining([
        expect.objectContaining({
          id: "mock-id-123",
          pageCode: "PAGE_1",
          properties: expect.objectContaining({
            title: "Tab 2",
          }),
        }),
      ]),
      true
    );
    expect(screen.queryByTestId("pane-modal")).not.toBeInTheDocument();
  });

  it("handles resetting page code state on pane close/submit", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-existing page"));
    const select = screen.getByTestId("select-page-dropdown");

    fireEvent.change(select, { target: { value: "PAGE_1" } });
    fireEvent.click(screen.getByTestId("cancel"));

    fireEvent.click(screen.getByTestId("add-existing page"));
    expect(screen.getByTestId("select-page-dropdown")).toHaveValue("");
  });

  it("renders correct page options filtering empty codes", () => {
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-existing page"));
    const select = screen.getByTestId("select-page-dropdown");

    expect(select.children.length).toBe(3);
    expect(screen.getByText("PAGE_1")).toBeInTheDocument();
    expect(screen.getByText("PAGE_2")).toBeInTheDocument();
  });

  it("handles empty components array (fallback)", async () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        components: undefined,
      },
    };
    render(<TabsPanelV2 {...props} />);

    expect(screen.queryByTestId("expandable-column")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("add-tab"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("create-page-btn"));
    });

    await waitFor(() => {
      expect(mockSetProperty).toHaveBeenCalledWith(
        "components",
        [
          expect.objectContaining({
            properties: { title: "Tab 1" },
          }),
        ],
        true,
      );
    });
  });

  it("handles microsite context being undefined gracefully", () => {
    (useMicrosite as jest.Mock).mockReturnValue({ microsite: null });
    render(<TabsPanelV2 {...defaultProps} />);

    fireEvent.click(screen.getByTestId("add-existing page"));
    const select = screen.getByTestId("select-page-dropdown");

    expect(select.children.length).toBe(1);
  });

  it("does not render unknown property keys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: ["UnknownKey" as ComponentProperty],
    };
    const { container } = render(<TabsPanelV2 {...props} />);

    const innerProps = container.querySelectorAll(".componentProperty");
    expect(innerProps.length).toBe(0);
  });
});
