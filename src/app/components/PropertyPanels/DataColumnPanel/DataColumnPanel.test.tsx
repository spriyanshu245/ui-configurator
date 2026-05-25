import { render, screen, fireEvent } from "@testing-library/react";
import DataColumnPanel from "./DataColumnPanel";
import "@testing-library/jest-dom";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";

const mockSetProperty = jest.fn();
const mockTogglePanel = jest.fn();
const mockIsPanelOpen = jest.fn(() => true);
const mockSetUserNotification = jest.fn();

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({
    togglePanel: mockTogglePanel,
    isPanelOpen: mockIsPanelOpen,
  }),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

describe("DataColumnPanel", () => {
  let mockProps: any;

  beforeEach(() => {
    mockSetProperty.mockClear();
    mockTogglePanel.mockClear();
    mockIsPanelOpen.mockClear();
    mockSetUserNotification.mockClear();

    mockProps = {
      propertyKeys: [
        ComponentProperty.TableColumns,
        ComponentProperty.DefaultSort,
        ComponentProperty.SortByField,
        ComponentProperty.SortByOrder,
        ComponentProperty.ConfigurePageSize,
        ComponentProperty.DefaultPageSize,
        ComponentProperty.PageSizeOptions,
        ComponentProperty.HideHeaderRow,
        ComponentProperty.HideBorders,
        ComponentProperty.PathToTableData,
        ComponentProperty.ShowFooterRow,
        ComponentProperty.FooterKey,
      ],
      propertyComponent: {
        type: "table",
        properties: {
          tableColumns: [
            {
              id: "col1",
              type: "table-column",
              properties: {
                label: "Column 1",
                name: "col1",
                isInternal: false,
              },
            },
          ],
          defaultSort: false,
          sortByField: "",
          sortByOrder: "asc",
          configurePageSize: false,
          defaultPageSize: 10,
          pageSizeOptions: [10, 20, 50],
          hideHeaderRow: false,
          hideBorders: false,
        },
      },
      setProperty: mockSetProperty,
    };
  });

  it("renders the DataColumnPanel component", () => {
    render(<DataColumnPanel {...mockProps} />);

    expect(screen.getByText(/Data Table/i)).toBeInTheDocument();
  });

  it("toggles the panel when clicked", () => {
    render(<DataColumnPanel {...mockProps} />);

    fireEvent.click(screen.getByTestId("toggleButton"));
    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.DataColumnPanel
    );
  });

  it("renders column data correctly", () => {
    render(<DataColumnPanel {...mockProps} />);

    expect(screen.getByText("Columns")).toBeInTheDocument();
    // expect(screen.getByText("Column 1")).toBeInTheDocument();
  });

  it("changes sort field when selected", () => {
    const updatedProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        properties: {
          ...mockProps.propertyComponent.properties,
          defaultSort: true,
        },
      },
    };

    render(<DataColumnPanel {...updatedProps} />);

    const sortByFieldSelect = screen.getByTestId("sortByField");
    fireEvent.change(sortByFieldSelect, { target: { value: "col1" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SortByField,
      "col1"
    );
  });

  it("adds a new column when Add Column button is clicked", () => {
    render(<DataColumnPanel {...mockProps} />);

    fireEvent.click(screen.getByText("+ Add Column"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            label: expect.stringContaining("Column"),
            name: expect.stringContaining("col"),
          }),
        }),
      ])
    );
  });

  it("displays correct panel title based on type", () => {
    render(<DataColumnPanel {...mockProps} />);
    expect(screen.getByText("Data Table")).toBeInTheDocument();

    const dataGridProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "data-grid",
        properties: {
          ...mockProps.propertyComponent.properties,
          gridData: mockProps.propertyComponent.properties.tableColumns,
        },
      },
    };

    render(<DataColumnPanel {...dataGridProps} />);
    expect(screen.getByText("Data Grid")).toBeInTheDocument();
  });

  it("handles unknown component type for column data property name", () => {
    const unknownTypeProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "unknown-type",
        properties: {
          ...mockProps.propertyComponent.properties,
        },
      },
    };

    render(<DataColumnPanel {...unknownTypeProps} />);
    expect(screen.queryByText("Columns")).not.toBeInTheDocument();
  });

  it("handles empty properties for data-grid", () => {
    const emptyGridProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "data-grid",
        properties: {},
      },
    };

    render(<DataColumnPanel {...emptyGridProps} />);
    expect(screen.getByText("+ Add Column")).toBeInTheDocument();
    expect(screen.queryByText("Label-1")).not.toBeInTheDocument();
  });

  it("handles empty properties for table", () => {
    const emptyTableProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        properties: {
          tableColumns: [],
          pageSizeOptions: [],
          configurePageSize: false,
        },
      },
    };

    render(<DataColumnPanel {...emptyTableProps} />);

    expect(screen.getByTestId("addColumnButton")).toBeInTheDocument();
    expect(screen.queryByText("Column 1")).not.toBeInTheDocument();
  });

  it("handles unknown component type for getColData", () => {
    const unknownTypeProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "unknown-type",
        properties: {
          ...mockProps.propertyComponent.properties,
        },
      },
    };

    render(<DataColumnPanel {...unknownTypeProps} />);
    expect(screen.getByText("+ Add Column")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Add Column"));
    expect(mockSetProperty).toHaveBeenCalledWith("", expect.any(Array));
  });

  it("renders 'Table Panel' as title for unknown component type", () => {
    const unknownTypeProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "unknown-type",
      },
    };

    render(<DataColumnPanel {...unknownTypeProps} />);
    expect(screen.getByText("Table Panel")).toBeInTheDocument();
  });

  it("adds a new column with correct properties for data-grid type", () => {
    const dataGridProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "data-grid",
        properties: {
          ...mockProps.propertyComponent.properties,
          gridData: [],
        },
      },
    };

    render(<DataColumnPanel {...dataGridProps} />);
    fireEvent.click(screen.getByText("+ Add Column"));

    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.GridData, [
      expect.objectContaining({
        properties: expect.objectContaining({
          label: "Label-1",
          value: "Value-1",
        }),
      }),
    ]);
  });

  it("calls setProperty when SelectableRow is toggled", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.SelectableRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: false,
          tableColumns: [],
          pageSizeOptions: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    const checkbox = screen.getByTestId("selectableRow");
    expect(checkbox).toBeInTheDocument();

    // toggle to true
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SelectableRow,
      true
    );
  });

  it("calls setProperty when MetaData is changed", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.MetaData],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: true,
          metaData: "id,name",
          tableColumns: [],
          pageSizeOptions: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    const textarea = screen.getByPlaceholderText(
      "Add comma separated meta data"
    );
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "id,name,email" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MetaData,
      "id,name,email"
    );
  });

  it("renders AutoSelectSingleRow checkbox when category is form and selectableRow is true", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.AutoSelectSingleRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: true,
          autoSelectSingleRow: false,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    const checkbox = screen.getByTestId("autoSelectSingleRow");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AutoSelectSingleRow,
      true
    );
  });

  it("does not render AutoSelectSingleRow when category is not form", () => {
    const nonFormProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.AutoSelectSingleRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "widget",
        properties: {
          selectableRow: true,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...nonFormProps} />);

    expect(screen.queryByTestId("autoSelectSingleRow")).not.toBeInTheDocument();
  });

  it("does not render AutoSelectSingleRow when selectableRow is false", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.AutoSelectSingleRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: false,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    expect(screen.queryByTestId("autoSelectSingleRow")).not.toBeInTheDocument();
  });

  it("renders SingleSelectRow checkbox when category is form and selectableRow is true", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.SingleSelectRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: true,
          singleSelectRow: false,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    const checkbox = screen.getByTestId("singleSelectRow");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SingleSelectRow,
      true
    );
  });

  it("does not render SingleSelectRow when category is not form", () => {
    const nonFormProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.SingleSelectRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "widget",
        properties: {
          selectableRow: true,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...nonFormProps} />);

    expect(screen.queryByTestId("singleSelectRow")).not.toBeInTheDocument();
  });

  it("does not render SingleSelectRow when selectableRow is false", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.SingleSelectRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: false,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    expect(screen.queryByTestId("singleSelectRow")).not.toBeInTheDocument();
  });

  it("renders selectable row, meta data, and primary key fields correctly when category is form", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [
        ComponentProperty.SelectableRow,
        ComponentProperty.MetaData,
        ComponentProperty.PrimaryKey,
      ],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: true,
          metaData: "id,name",
          primaryKey: "id",
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    const selectableRow = screen.getByTestId("selectableRow");
    expect(selectableRow).toBeInTheDocument();

    // Check the <p> for Meta Data text
    expect(screen.getByText("Meta Data")).toBeInTheDocument();

    // Or check the <textarea> by its role
    expect(screen.getByRole("textbox", { name: "" })).toBeInTheDocument();

    expect(screen.getByText("Select primary key")).toBeInTheDocument();
  });

  it("does not render MetaData and PrimaryKey when selectableRow is false", () => {
    const formProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.MetaData, ComponentProperty.PrimaryKey],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "form",
        properties: {
          selectableRow: false,
          tableColumns: [],
        },
      },
    };

    render(<DataColumnPanel {...formProps} />);

    expect(screen.queryByLabelText("Meta Data")).not.toBeInTheDocument();
    expect(screen.queryByText("Select primary key")).not.toBeInTheDocument();
  });

  it("does not render SelectableRow when category is not form", () => {
    const nonFormProps = {
      ...mockProps,
      propertyKeys: [ComponentProperty.SelectableRow],
      propertyComponent: {
        ...mockProps.propertyComponent,
        type: "table",
        category: "widget",
        properties: {
          tableColumns: [],
          pageSizeOptions: [],
          configurePageSize: false,
        },
      },
    };

    render(<DataColumnPanel {...nonFormProps} />);

    expect(screen.queryByTestId("selectableRow")).not.toBeInTheDocument();
  });

  it("returns null for unsupported property keys", () => {
    const customProps = {
      ...mockProps,
      propertyKeys: ["UnsupportedKey" as any],
    };

    const { container } = render(<DataColumnPanel {...customProps} />);
    const propertyElements = container.querySelectorAll(`.component-property`);
    expect(propertyElements.length).toBe(0);
  });

  it("handle set property for hide borders, hide header row, show footer row and path to table data", () => {
    render(<DataColumnPanel {...mockProps} />);

    const borderCheckbox = screen.getByTestId("hideBorders");
    fireEvent.click(borderCheckbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HideBorders,
      true
    );

    const headerCheckbox = screen.getByTestId("hideHeaderRow");
    fireEvent.click(headerCheckbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HideHeaderRow,
      true
    );

    const input = screen.getByTestId("pathToTableData");
    fireEvent.change(input, { target: { value: "summary" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.PathToTableData,
      "summary"
    );

    const footerCheckbox = screen.getByTestId("showFooterRow");
    fireEvent.click(footerCheckbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowFooterRow,
      true
    );
  });

  it("handle footer key property when show footer row is enabled", () => {
    const customProps = {
      ...mockProps,
      propertyComponent: {
        ...mockProps.propertyComponent,
        properties: {
          ...mockProps.propertyComponent.properties,
          showFooterRow: true,
        },
      },
    };

    render(<DataColumnPanel {...customProps} />);

    const input = screen.getByTestId("footerKey");
    fireEvent.change(input, { target: { value: "total" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FooterKey,
      "total"
    );
  });

  describe("Mobile Card View Properties", () => {
    let cardViewProps: any;

    beforeEach(() => {
      cardViewProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.MobileCardViewEnabled,
          ComponentProperty.CardTitleColumn,
          ComponentProperty.CardSubtitleColumn,
          ComponentProperty.CardStatusColumn,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            tableColumns: [
              {
                id: "col-id-1",
                type: "table-column",
                properties: { label: "Document", name: "activityName", isInternal: false },
              },
              {
                id: "col-id-2",
                type: "table-column",
                properties: { label: "Applicant Name", name: "applicantFullName", isInternal: false },
              },
            ],
            mobileCardViewEnabled: true,
          },
        },
      };
    });

    it("does not render card column selectors when mobileCardViewEnabled is false", () => {
      const disabledProps = {
        ...cardViewProps,
        propertyComponent: {
          ...cardViewProps.propertyComponent,
          properties: {
            ...cardViewProps.propertyComponent.properties,
            mobileCardViewEnabled: false,
          },
        },
      };

      render(<DataColumnPanel {...disabledProps} />);

      expect(screen.queryByText("Card Title Column")).not.toBeInTheDocument();
      expect(screen.queryByText("Card Subtitle Column")).not.toBeInTheDocument();
      expect(screen.queryByText("Card Status Column")).not.toBeInTheDocument();
    });

    it("renders card column selectors when mobileCardViewEnabled is true", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      expect(screen.getByText("Card Title Column")).toBeInTheDocument();
      expect(screen.getByText("Card Subtitle Column")).toBeInTheDocument();
      expect(screen.getByText("Card Status Column")).toBeInTheDocument();
    });

    it("populates card column selectors with table column options by id", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      const titleSelect = screen.getByTestId(ComponentProperty.CardTitleColumn);
      expect(titleSelect).toBeInTheDocument();

      const options = titleSelect.querySelectorAll("option");
      expect(options[0]).toHaveValue("");
      expect(options[1]).toHaveValue("col-id-1");
      expect(options[1]).toHaveTextContent("Document");
      expect(options[2]).toHaveValue("col-id-2");
      expect(options[2]).toHaveTextContent("Applicant Name");
    });

    it("calls setProperty with column id when cardTitleColumn is changed", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      const titleSelect = screen.getByTestId(ComponentProperty.CardTitleColumn);
      fireEvent.change(titleSelect, { target: { value: "col-id-1" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardTitleColumn,
        "col-id-1"
      );
    });

    it("calls setProperty with column id when cardSubtitleColumn is changed", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      const subtitleSelect = screen.getByTestId(ComponentProperty.CardSubtitleColumn);
      fireEvent.change(subtitleSelect, { target: { value: "col-id-2" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardSubtitleColumn,
        "col-id-2"
      );
    });

    it("calls setProperty with column id when cardStatusColumn is changed", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      const statusSelect = screen.getByTestId(ComponentProperty.CardStatusColumn);
      fireEvent.change(statusSelect, { target: { value: "col-id-1" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardStatusColumn,
        "col-id-1"
      );
    });

    it("shows None option as default when no card column is selected", () => {
      render(<DataColumnPanel {...cardViewProps} />);

      const titleSelect = screen.getByTestId(
        ComponentProperty.CardTitleColumn
      ) as HTMLSelectElement;
      expect(titleSelect.value).toBe("");
    });

    it("reflects pre-set cardTitleColumn value in the select", () => {
      const propsWithValue = {
        ...cardViewProps,
        propertyComponent: {
          ...cardViewProps.propertyComponent,
          properties: {
            ...cardViewProps.propertyComponent.properties,
            cardTitleColumn: "col-id-1",
          },
        },
      };

      render(<DataColumnPanel {...propsWithValue} />);

      const titleSelect = screen.getByTestId(
        ComponentProperty.CardTitleColumn
      ) as HTMLSelectElement;
      expect(titleSelect.value).toBe("col-id-1");
    });

    it("shows empty column options list when tableColumns is empty", () => {
      const emptyColsProps = {
        ...cardViewProps,
        propertyComponent: {
          ...cardViewProps.propertyComponent,
          properties: {
            tableColumns: [],
            mobileCardViewEnabled: true,
          },
        },
      };

      render(<DataColumnPanel {...emptyColsProps} />);

      const titleSelect = screen.getByTestId(ComponentProperty.CardTitleColumn);
      const options = titleSelect.querySelectorAll("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveValue("");
      expect(options[0]).toHaveTextContent("None");
    });
  });

  it("handles case when panel is not open", () => {
    mockIsPanelOpen.mockImplementation(() => false);

    render(<DataColumnPanel {...mockProps} />);
    expect(screen.queryByText("Apply default sorting")).not.toBeInTheDocument();
  });

  describe("Pagination Properties", () => {
    beforeEach(() => {
      // Ensure panel is open for pagination tests
      mockIsPanelOpen.mockImplementation(() => true);
    });

    it("renders EnablePagination checkbox and calls setProperty when toggled", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [ComponentProperty.EnablePagination],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: false,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      const checkbox = screen.getByLabelText("Enable Pagination");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.EnablePagination,
        true
      );
    });

    it("renders EnablePagination as checked when enablePagination is true", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [ComponentProperty.EnablePagination],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      const checkbox = screen.getByLabelText("Enable Pagination");
      expect(checkbox).toBeChecked();
    });

    it("renders DefaultPageSize input when enablePagination is true", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.DefaultPageSize,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            defaultPageSize: 20,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      expect(screen.getByText("Default page size")).toBeInTheDocument();
      const input = screen.getByPlaceholderText("e.g., 20");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(20);
    });

    it("does not render DefaultPageSize input when enablePagination is false", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.DefaultPageSize,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: false,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      expect(screen.queryByText("Default page size")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("e.g., 20")).not.toBeInTheDocument();
    });

    it("calls setProperty when DefaultPageSize value is changed", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.DefaultPageSize,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            defaultPageSize: 20,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      const input = screen.getByPlaceholderText("e.g., 20");
      fireEvent.change(input, { target: { value: "50" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DefaultPageSize,
        50
      );
    });

    it("renders PageSizeOptions input when enablePagination is true", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.PageSizeOptions,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            pageSizeOptions: "10, 20, 50",
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      expect(screen.getByText("Page size options")).toBeInTheDocument();
      const input = screen.getByPlaceholderText("10, 20, 50, 100");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("10, 20, 50");
    });

    it("does not render PageSizeOptions input when enablePagination is false", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.PageSizeOptions,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: false,
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      expect(screen.queryByText("Page size options")).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("10, 20, 50, 100")
      ).not.toBeInTheDocument();
    });

    it("calls setProperty when PageSizeOptions value is changed", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.PageSizeOptions,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            pageSizeOptions: "10, 20",
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      const input = screen.getByPlaceholderText("10, 20, 50, 100");
      fireEvent.change(input, { target: { value: "10, 20, 50, 100" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PageSizeOptions,
        "10, 20, 50, 100"
      );
    });

    it("renders all pagination properties together when enablePagination is true", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.DefaultPageSize,
          ComponentProperty.PageSizeOptions,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            defaultPageSize: 25,
            pageSizeOptions: "10, 25, 50",
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      expect(screen.getByLabelText("Enable Pagination")).toBeChecked();
      expect(screen.getByText("Default page size")).toBeInTheDocument();
      expect(screen.getByText("Page size options")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., 20")).toHaveValue(25);
      expect(screen.getByPlaceholderText("10, 20, 50, 100")).toHaveValue(
        "10, 25, 50"
      );
    });

    it("handles enablePagination being undefined (defaults to false)", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [ComponentProperty.EnablePagination],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            // enablePagination is undefined
          },
        },
      };

      render(<DataColumnPanel {...paginationProps} />);

      const checkbox = screen.getByLabelText("Enable Pagination");
      expect(checkbox).not.toBeChecked();
    });

    it("toggles pagination from enabled to disabled", () => {
      const paginationProps = {
        ...mockProps,
        propertyKeys: [
          ComponentProperty.EnablePagination,
          ComponentProperty.DefaultPageSize,
          ComponentProperty.PageSizeOptions,
        ],
        propertyComponent: {
          ...mockProps.propertyComponent,
          properties: {
            ...mockProps.propertyComponent.properties,
            enablePagination: true,
            defaultPageSize: 20,
            pageSizeOptions: "10, 20, 50",
          },
        },
      };

      const { rerender } = render(<DataColumnPanel {...paginationProps} />);

      // Initially all fields are visible
      expect(screen.getByLabelText("Enable Pagination")).toBeChecked();
      expect(screen.getByText("Default page size")).toBeInTheDocument();
      expect(screen.getByText("Page size options")).toBeInTheDocument();

      // Update to disable pagination
      const updatedProps = {
        ...paginationProps,
        propertyComponent: {
          ...paginationProps.propertyComponent,
          properties: {
            ...paginationProps.propertyComponent.properties,
            enablePagination: false,
          },
        },
      };

      rerender(<DataColumnPanel {...updatedProps} />);

      // After disabling, dependent fields should not be visible
      expect(screen.getByLabelText("Enable Pagination")).not.toBeChecked();
      expect(screen.queryByText("Default page size")).not.toBeInTheDocument();
      expect(screen.queryByText("Page size options")).not.toBeInTheDocument();
    });
  });
});
