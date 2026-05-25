import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AccessControlTreeNode from "./AccessControlTreeNode";
import { AccessControlComponent, AccessControlPage } from "../../types/types";
import { findComponentById } from "../../utils/accessControlUtils";

jest.mock("./AccessControlTreeNode.module.scss", () => ({
  treeNode: "treeNode",
  nodeHeader: "nodeHeader",
  expandIcon: "expandIcon",
  expanded: "expanded",
  placeholder: "placeholder",
  namePillGroup: "namePillGroup",
  nodeLabel: "nodeLabel",
  componentTypePill: "componentTypePill",
  defaultTabDropdown: "defaultTabDropdown",
  nodeType: "nodeType",
  controlsGroup: "controlsGroup",
  controlItem: "controlItem",
  children: "children",
  hidden: "hidden",
}));

jest.mock("@/app/utils/accessControlUtils", () => ({
  findComponentById: jest.fn(),
}));

jest.mock(
  "@/app/components/InternalComponents/SelectDropdown/SelectDropdown",
  () =>
    ({ options, value, onChange, placeholder, id }: any) => (
      <select
        data-testid="mock-select-dropdown"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
);

describe("AccessControlTreeNode", () => {
  const mockOnUpdate = jest.fn();

  const createComponentNode = (
    id: string,
    overrides = {},
  ): AccessControlComponent => ({
    componentId: id,
    isVisible: true,
    isEditable: true,
    isDisabled: false,
    ...overrides,
  });

  const mockPageComponents = [
    {
      id: "comp-title",
      type: "input",
      properties: { title: "Title Label" },
    },
    {
      id: "comp-name-simple",
      type: "input",
      properties: { name: "SimpleName" },
    },
    {
      id: "comp-label",
      type: "input",
      properties: { label: "Property Label" },
    },
    {
      id: "comp-no-props",
      type: "container",
    },
    {
      id: "comp-type-only",
      type: "custom-widget",
    },
    {
      id: "comp-tabs",
      type: "tabs",
      components: [
        { id: "tab-1", type: "tab", properties: { title: "Tab 1" } },
        { id: "tab-2", type: "tab", properties: { title: "Tab 2" } },
      ],
    },
    {
      id: "comp-button",
      type: "button-v2",
    },
    {
      id: "comp-table",
      type: "table",
      properties: {
        tableColumns: [
          {
            id: "col-1",
            properties: { label: "Action Col", columnInputType: "api-action" },
          },
          { id: "col-2", properties: { label: "Data Col" } },
        ],
      },
    },
    {
      id: "form-comp",
      type: "form",
      properties: {
        nameKeyIds: [
          { id: "123e4567-e89b-12d3-a456-426614174000", label: "UUID Label" },
        ],
      },
    },
    {
      id: "comp-uuid-name",
      type: "input",
      properties: { name: "123e4567-e89b-12d3-a456-426614174000" },
    },
    {
      id: "wrapper",
      type: "container",
      components: [
        {
          id: "nested-table",
          type: "input-table",
          properties: {
            inputColumns: [
              {
                id: "nested-col",
                properties: {
                  label: "Nested Col",
                  columnDataType: "input",
                  columnInputType: "routing-action",
                },
              },
            ],
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (findComponentById as jest.Mock).mockImplementation((components, id) => {
      const flatten = (list: any[]): any[] =>
        list.reduce(
          (acc, item) => [
            ...acc,
            item,
            ...(item.components ? flatten(item.components) : []),
          ],
          [],
        );
      return flatten(mockPageComponents).find((c) => c.id === id);
    });
  });

  it("renders a basic component node", () => {
    const node = createComponentNode("comp-title");
    render(
      <AccessControlTreeNode
        node={node}
        nodeType="component"
        label="Test Node"
        onUpdate={mockOnUpdate}
        pageComponents={mockPageComponents}
      />,
    );

    expect(screen.getByText("Test Node")).toBeInTheDocument();
    expect(screen.getByText("component")).toBeInTheDocument();
    expect(screen.getByLabelText("Visible")).toBeChecked();
    expect(screen.getByLabelText("Editable")).toBeChecked();
    expect(screen.getByLabelText("Disabled")).not.toBeChecked();
  });

  it("toggles expansion when header is clicked", () => {
    const node = createComponentNode("parent", {
      components: [createComponentNode("child")],
    });

    render(
      <AccessControlTreeNode
        node={node}
        nodeType="component"
        label="Parent"
        onUpdate={mockOnUpdate}
      />,
    );

    const expandIcon = screen.getByText("▶");
    expect(expandIcon).toBeInTheDocument();

    const header = screen.getByText("Parent").closest(".nodeHeader");
    fireEvent.click(header!);
  });

  it("responds to expandAllTrigger prop changes", () => {
    const node = createComponentNode("parent", {
      components: [createComponentNode("child")],
    });

    const { rerender } = render(
      <AccessControlTreeNode
        node={node}
        nodeType="component"
        label="Parent"
        onUpdate={mockOnUpdate}
        expandAllTrigger={{ value: false, version: 1 }}
      />,
    );

    rerender(
      <AccessControlTreeNode
        node={node}
        nodeType="component"
        label="Parent"
        onUpdate={mockOnUpdate}
        expandAllTrigger={{ value: true, version: 2 }}
      />,
    );
  });

  describe("Checkbox Logic & Recursion", () => {
    it("handles Visible toggle (turning OFF should disable children)", () => {
      const node = createComponentNode("parent", {
        components: [createComponentNode("child")],
      });

      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
        />,
      );

      const visibleCheckbox = screen.getAllByLabelText("Visible")[0];
      fireEvent.click(visibleCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: false,
          isEditable: false,
          isDisabled: false,
          components: [
            expect.objectContaining({
              componentId: "child",
              isVisible: false,
            }),
          ],
        }),
      );
    });

    it("handles Disabled toggle (turning ON should disable editable)", () => {
      const node = createComponentNode("comp-1");
      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Comp"
          onUpdate={mockOnUpdate}
        />,
      );

      const disabledCheckbox = screen.getByLabelText("Disabled");
      fireEvent.click(disabledCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isDisabled: true,
          isEditable: false,
        }),
      );
    });

    it("handles Editable toggle", () => {
      const node = createComponentNode("comp-1");
      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Comp"
          onUpdate={mockOnUpdate}
        />,
      );

      const editableCheckbox = screen.getByLabelText("Editable");
      fireEvent.click(editableCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ isEditable: false }),
      );
    });

    it("updates recursive columns when parent visibility changes", () => {
      const node = {
        ...createComponentNode("table"),
        columns: [{ columnId: "col1", isVisible: true, isDisabled: false }],
      };

      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
        />,
      );

      const visibleCheckbox = screen.getAllByLabelText("Visible")[0];
      fireEvent.click(visibleCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: [
            expect.objectContaining({
              columnId: "col1",
              isVisible: false,
            }),
          ],
        }),
      );
    });
  });

  describe("Label Resolution", () => {
    it("resolves label from properties.title", () => {
      const node = createComponentNode("comp-title");
      const parent = createComponentNode("parent", {
        components: [node],
      });

      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.getByText("Title Label")).toBeInTheDocument();
    });

    it("resolves label from properties.name (Simple)", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("comp-name-simple")],
      });
      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("SimpleName")).toBeInTheDocument();
    });

    it("resolves label from properties.name (UUID via NameKeyId)", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("comp-uuid-name")],
      });
      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("UUID Label")).toBeInTheDocument();
    });

    it("resolves label from properties.label", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("comp-label")],
      });
      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("Property Label")).toBeInTheDocument();
    });

    it("resolves label from component.type fallback", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("comp-type-only")],
      });
      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getAllByText("custom-widget")[0]).toBeInTheDocument();
    });

    it("resolves label for columns", () => {
      const tableNode = {
        ...createComponentNode("comp-table"),
        columns: [
          { columnId: "col-1", isVisible: true, isDisabled: false },
          { columnId: "col-2", isVisible: true, isDisabled: false },
        ],
      };

      render(
        <AccessControlTreeNode
          node={tableNode}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.getByText("Action Col")).toBeInTheDocument();
      expect(screen.getByText("Data Col")).toBeInTheDocument();
    });

    it("resolves label to childId if pageComponents is undefined", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("child-id")],
      });
      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={undefined}
        />,
      );
      expect(screen.getByText("child-id")).toBeInTheDocument();
    });

    it("resolves column label to id if recursive find fails", () => {
      const tableNode = {
        ...createComponentNode("comp-table"),
        columns: [
          { columnId: "missing-col", isVisible: true, isDisabled: false },
        ],
      };
      render(
        <AccessControlTreeNode
          node={tableNode}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("missing-col")).toBeInTheDocument();
    });
  });

  describe("Component Type & Pills", () => {
    it("renders 'cta' pill for button-v2", () => {
      render(
        <AccessControlTreeNode
          node={createComponentNode("comp-button")}
          nodeType="component"
          label="Button"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("cta")).toBeInTheDocument();
    });

    it("renders 'cta' pill for table action columns", () => {
      const colNode = createComponentNode("col-1");

      render(
        <AccessControlTreeNode
          node={colNode}
          nodeType="component"
          label="Col"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("cta")).toBeInTheDocument();
    });

    it("renders 'cta' pill for input table routing columns", () => {
      const colNode = createComponentNode("nested-col");

      render(
        <AccessControlTreeNode
          node={colNode}
          nodeType="component"
          label="Col"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("cta")).toBeInTheDocument();
    });

    it("renders standard type pill for others", () => {
      render(
        <AccessControlTreeNode
          node={createComponentNode("comp-title")}
          nodeType="component"
          label="Input"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );
      expect(screen.getByText("input")).toBeInTheDocument();
    });
  });

  describe("Tabs & Default Tab Logic", () => {
    it("renders default tab dropdown for Tabs component", () => {
      const tabsNode = {
        ...createComponentNode("comp-tabs"),
        components: [
          { componentId: "tab-1", isDefault: true } as AccessControlComponent,
          { componentId: "tab-2", isDefault: false } as AccessControlComponent,
        ],
      };

      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.getByText("Default Tab:")).toBeInTheDocument();
      expect(screen.getByTestId("mock-select-dropdown")).toHaveValue("tab-1");
    });

    it("updates default tab", () => {
      const tabsNode = {
        ...createComponentNode("comp-tabs"),
        components: [
          { componentId: "tab-1", isDefault: true } as AccessControlComponent,
          { componentId: "tab-2", isDefault: false } as AccessControlComponent,
        ],
      };

      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      const select = screen.getByTestId("mock-select-dropdown");
      fireEvent.change(select, { target: { value: "tab-2" } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          components: [
            expect.objectContaining({ componentId: "tab-1", isDefault: false }),
            expect.objectContaining({ componentId: "tab-2", isDefault: true }),
          ],
        }),
      );
    });

    it("stops propagation on dropdown click", () => {
      const tabsNode = createComponentNode("comp-tabs", {
        components: [{ componentId: "tab-1", isDefault: true }],
      });

      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      const dropdownContainer = screen.getByText("Default Tab:").parentElement;
      const stopProp = jest.fn();
      fireEvent.click(dropdownContainer!, { stopPropagation: stopProp });
      expect(dropdownContainer).toBeInTheDocument();
    });
  });

  describe("Interactions & Updates", () => {
    it("handles child component update via callback", () => {
      const parent = {
        ...createComponentNode("parent"),
        components: [createComponentNode("child")],
      };

      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
        />,
      );

      const childCheckbox = screen.getAllByLabelText("Visible")[1];
      fireEvent.click(childCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          components: [
            expect.objectContaining({ componentId: "child", isVisible: false }),
          ],
        }),
      );
    });

    it("handles column update via callback", () => {
      const table = {
        ...createComponentNode("comp-table"),
        columns: [{ columnId: "col-1", isVisible: true, isDisabled: false }],
      };

      render(
        <AccessControlTreeNode
          node={table}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      const colCheckbox = screen.getAllByLabelText("Visible")[1];
      fireEvent.click(colCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: [
            expect.objectContaining({ columnId: "col-1", isVisible: false }),
          ],
        }),
      );
    });

    it("stops propagation on controls group click", () => {
      render(
        <AccessControlTreeNode
          node={createComponentNode("c1")}
          nodeType="component"
          label="C1"
          onUpdate={mockOnUpdate}
        />,
      );
      const controls = screen.getByLabelText("Visible").closest("div");
      fireEvent.click(controls!.parentElement!);
    });
  });

  describe("Edge Cases", () => {
    it("handles read-only mode", () => {
      const node = { ...createComponentNode("c1"), isReadOnly: true };
      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="C1"
          onUpdate={mockOnUpdate}
        />,
      );

      const visibleCb = screen.getByLabelText("Visible");
      expect(visibleCb).toBeChecked();
      expect(visibleCb).toBeDisabled();

      const editableCb = screen.getByLabelText("Editable");
      expect(editableCb).toBeDisabled();
    });

    it("handles parentVisible=false", () => {
      const node = createComponentNode("c1");
      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="C1"
          onUpdate={mockOnUpdate}
          parentVisible={false}
        />,
      );

      expect(screen.getByLabelText("Visible")).toBeDisabled();
    });

    it("handles page type node rendering", () => {
      const pageNode: AccessControlPage = {
        pageCode: "p1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        components: [],
      };

      render(
        <AccessControlTreeNode
          node={pageNode}
          nodeType="page"
          label="Page 1"
          onUpdate={mockOnUpdate}
        />,
      );
      expect(screen.getByText("page")).toBeInTheDocument();
    });

    it("handles highlighted component with scrollIntoView", () => {
      jest.useFakeTimers();
      const scrollIntoViewMock = jest.fn();
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const node = createComponentNode("comp-1");
      const { rerender } = render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Test"
          onUpdate={mockOnUpdate}
          highlightedComponentId={null}
        />,
      );

      rerender(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Test"
          onUpdate={mockOnUpdate}
          highlightedComponentId="comp-1"
        />,
      );

      jest.advanceTimersByTime(100);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });

      jest.useRealTimers();
    });

    it("handles highlight animation end", () => {
      jest.useFakeTimers();
      const node = createComponentNode("comp-1");
      const { container } = render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Test"
          onUpdate={mockOnUpdate}
          highlightedComponentId="comp-1"
        />,
      );

      const nodeHeader = container.querySelector(".nodeHeader");
      if (nodeHeader) {
        fireEvent.animationEnd(nodeHeader);
      }

      jest.useRealTimers();
    });

    it("handles nested components recursion when toggling visibility", () => {
      const grandchild = createComponentNode("grandchild");
      const child = createComponentNode("child", {
        components: [grandchild],
      });
      const parent = createComponentNode("parent", {
        components: [child],
      });

      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
        />,
      );

      const visibleCheckbox = screen.getAllByLabelText("Visible")[0];
      fireEvent.click(visibleCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: false,
          components: [
            expect.objectContaining({
              componentId: "child",
              isVisible: false,
              components: [
                expect.objectContaining({
                  componentId: "grandchild",
                  isVisible: false,
                }),
              ],
            }),
          ],
        }),
      );
    });

    it("returns null when getComponentType is called on page node", () => {
      const pageNode: AccessControlPage = {
        pageCode: "p1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        components: [],
      };

      const { container } = render(
        <AccessControlTreeNode
          node={pageNode}
          nodeType="page"
          label="Page 1"
          onUpdate={mockOnUpdate}
        />,
      );

      const typePill = container.querySelector(".componentTypePill");
      expect(typePill).not.toBeInTheDocument();
    });

    it("returns empty array for getTabChildren when node is not tabs", () => {
      const node = createComponentNode("comp-title");
      render(
        <AccessControlTreeNode
          node={node}
          nodeType="component"
          label="Input"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.queryByText("Default Tab:")).not.toBeInTheDocument();
    });

    it("returns empty array for getTabChildren when components is undefined", () => {
      const tabsNode = createComponentNode("comp-tabs");
      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.queryByText("Default Tab:")).not.toBeInTheDocument();
    });

    it("handles input-table column label resolution", () => {
      const tableNode = {
        ...createComponentNode("wrapper"),
        components: [
          {
            componentId: "nested-table",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
          },
        ],
      };

      const childWithColumn = {
        ...createComponentNode("parent"),
        columns: [
          { columnId: "nested-col", isVisible: true, isDisabled: false },
        ],
      };

      render(
        <AccessControlTreeNode
          node={childWithColumn}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.getByText("Nested Col")).toBeInTheDocument();
    });

    it("handles column label fallback when label is undefined", () => {
      const mockPageComponentsWithNoLabel = [
        {
          id: "comp-table-no-label",
          type: "table",
          properties: {
            tableColumns: [{ id: "col-no-label", properties: {} }],
          },
        },
      ];

      const tableNode = {
        ...createComponentNode("comp-table-no-label"),
        columns: [
          { columnId: "col-no-label", isVisible: true, isDisabled: false },
        ],
      };

      render(
        <AccessControlTreeNode
          node={tableNode}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponentsWithNoLabel}
        />,
      );

      expect(screen.getByText("col-no-label")).toBeInTheDocument();
    });

    it("handles input-table column label fallback when label is undefined", () => {
      const mockPageComponentsWithNoLabel = [
        {
          id: "wrapper",
          type: "container",
          components: [
            {
              id: "nested-table-no-label",
              type: "input-table",
              properties: {
                inputColumns: [{ id: "col-no-label", properties: {} }],
              },
            },
          ],
        },
      ];

      const tableNode = {
        ...createComponentNode("nested-table-no-label"),
        columns: [
          { columnId: "col-no-label", isVisible: true, isDisabled: false },
        ],
      };

      render(
        <AccessControlTreeNode
          node={tableNode}
          nodeType="component"
          label="Table"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponentsWithNoLabel}
        />,
      );

      expect(screen.getByText("col-no-label")).toBeInTheDocument();
    });

    it("handles component without DSL match fallback", () => {
      const parent = createComponentNode("parent", {
        components: [createComponentNode("unknown-component")],
      });

      render(
        <AccessControlTreeNode
          node={parent}
          nodeType="component"
          label="Parent"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.getByText("unknown-component")).toBeInTheDocument();
    });

    it("handles tab with name property fallback", () => {
      const mockPageComponentsWithTabName = [
        {
          id: "comp-tabs-with-name",
          type: "tabs",
          components: [
            { id: "tab-with-name", type: "tab", name: "Tab Name Fallback" },
          ],
        },
      ];

      const tabsNode = {
        ...createComponentNode("comp-tabs-with-name"),
        components: [
          {
            componentId: "tab-with-name",
            isDefault: true,
          } as AccessControlComponent,
        ],
      };

      (findComponentById as jest.Mock).mockImplementation((components, id) => {
        if (id === "comp-tabs-with-name") {
          return mockPageComponentsWithTabName[0];
        }
        if (id === "tab-with-name") {
          return mockPageComponentsWithTabName[0].components[0];
        }
        return null;
      });

      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponentsWithTabName}
        />,
      );

      const select = screen.getByTestId("mock-select-dropdown");
      expect(select).toHaveValue("tab-with-name");
    });

    it("handles default tab as empty string when no default is set", () => {
      const tabsNode = {
        ...createComponentNode("comp-tabs"),
        components: [
          { componentId: "tab-1", isDefault: false } as AccessControlComponent,
          { componentId: "tab-2", isDefault: false } as AccessControlComponent,
        ],
      };

      render(
        <AccessControlTreeNode
          node={tabsNode}
          nodeType="component"
          label="Tabs"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      const select = screen.getByTestId("mock-select-dropdown");
      expect(select).toHaveValue("");
    });

    it("handles getTabChildren for page nodeType", () => {
      const pageNode: AccessControlPage = {
        pageCode: "p1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        components: [],
      };

      render(
        <AccessControlTreeNode
          node={pageNode}
          nodeType="page"
          label="Page"
          onUpdate={mockOnUpdate}
          pageComponents={mockPageComponents}
        />,
      );

      expect(screen.queryByText("Default Tab:")).not.toBeInTheDocument();
    });
  });
});
