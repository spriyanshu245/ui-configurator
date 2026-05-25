import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks ---

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));
jest.mock("../../../context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("../../../context/ConfigContext", () => ({
  useConfig: jest.fn(),
}));

jest.mock("../../../hooks/useFindForm", () => ({
  useFindForm: jest.fn(),
}));

jest.mock("../../../hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({
    workspaceCode: "ws1",
    micrositeUrlSlug: "current-site",
  })),
}));

jest.mock("../../../utils/dataTableUtils", () => ({
  getAllRecords: jest.fn(),
  getRecordVersions: jest.fn(),
}));

jest.mock("../../JsonTextArea/JsonTextArea", () => ({
  __esModule: true,
  default: ({ onChange, onValidJson, value, id }: any) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        try {
          const parsed = JSON.parse(e.target.value);
          onValidJson(parsed);
        } catch (err) {
          console.log(err);
        }
      }}
    />
  ),
}));

jest.mock("../../ToggleSwitch/ToggleSwitch", () => ({
  __esModule: true,
  default: ({ onToggle, label, isToggled, id }: any) => (
    <div data-testid={id}>
      <label>{label}</label>
      <button onClick={onToggle}>{isToggled ? "ON" : "OFF"}</button>
    </div>
  ),
}));

jest.mock("./ConditonalRouting", () => ({
  __esModule: true,
  default: ({
    handleAddConditionalRoute,
    handleRouteChange,
    deleteCondition,
    properties,
  }: any) => (
    <div data-testid="conditional-routing">
      <button onClick={handleAddConditionalRoute}>Add Condition</button>
      {properties.conditionalRoutes?.map((route: any, index: number) => (
        <div
          key={`route-${index}-${route.route || "default"}`}
          data-testid={`route-${index}`}
        >
          <button
            onClick={() => handleRouteChange("route", "new-route", index)}
          >
            Update
          </button>
          <button onClick={() => deleteCondition(index)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({ children, id }: any) => (
    <div data-testid={`expandable-column-${id}`}>{children}</div>
  ),
  AddExpandableColumn: ({ handleAddCol, label }: any) => (
    <button data-testid="add-expandable-column" onClick={handleAddCol}>
      Add {label}
    </button>
  ),
}));

jest.mock("./ActionTypePanel", () => ({
  __esModule: true,
  default: ({ id, column, propertyComponent, setProperty }: any) => (
    <div data-testid={`action-type-panel-${id}`}>
      <select
        data-testid="action-type-select"
        value={column.properties?.tableColumnActionTypes || ""}
        onChange={(e) => {
          const updatedData = (
            propertyComponent.properties.multipleActions || []
          ).map((c: any) =>
            c.id === column.id
              ? {
                  ...c,
                  properties: {
                    ...c.properties,
                    tableColumnActionTypes: e.target.value,
                  },
                }
              : c,
          );
          setProperty("multipleActions", updatedData);
        }}
      >
        <option value="">Select</option>
        <option value="button">Button</option>
        <option value="link">Link</option>
      </select>
    </div>
  ),
}));

jest.mock("../../PropertyInputs/PropertyInput", () => ({
  __esModule: true,
  default: ({ handleChange, value, id, type, label }: any) => {
    if (type === "checkbox") {
      return (
        <div>
          <label htmlFor={id}>{label}</label>
          <input
            type="checkbox"
            id={id}
            data-testid={id}
            checked={!!value}
            onChange={handleChange}
          />
        </div>
      );
    }
    return (
      <input
        data-testid={id}
        value={value || ""}
        onChange={handleChange}
        placeholder={id}
      />
    );
  },
}));

jest.mock("../../../components/SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-down" />
));

jest.mock("../../../utils/constants", () => ({
  ...jest.requireActual("../../../utils/constants"),
  externalServices: [{ label: "Service 1", value: "s1" }],
  actionTypes: [
    { label: "Submit", value: "submit" },
    { label: "Reset", value: "reset" },
  ],
  requestBodyTypes: [{ label: "Flat", value: "flat" }],
  DATA_TYPE_CONFIG: { microsites: { endpoint: "/microsites" } },
  renderOptions: (opts: any[]) => opts.map((o) => ({ label: o, value: o })),
  renderNameKeyOptions: (opts: any[]) =>
    opts?.map((o) => ({ label: o, value: o })) || [],
}));

jest.mock("./MultiActionTypePanel", () => ({
  __esModule: true,
  default: ({ id, action, setProperty, propertyComponent }: any) => (
    <div data-testid={`multi-action-type-panel-${id}`}>
      <select
        data-testid={`multi-action-select-${id}`}
        value={action.actionType || ""}
        onChange={(e) => {
          const updatedData = (propertyComponent.properties.actions || []).map(
            (a: any) =>
              a.id === action.id ? { ...a, actionType: e.target.value } : a,
          );
          setProperty("actions", updatedData);
        }}
      >
        <option value="">Select</option>
        <option value="submit">Submit</option>
        <option value="routing">Routing</option>
      </select>
    </div>
  ),
}));

import ActionPanel from "./ActionPanel";
import { ComponentProperty } from "../../../data/componentProperties";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { useMicrosite } from "../../../context/MicrositeContext";
import { useConfig } from "../../../context/ConfigContext";
import {
  getAllRecords,
  getRecordVersions,
} from "../../../utils/dataTableUtils";
import { PropertyPanels } from "../../../utils/constants";
import { useFindForm } from "../../../hooks/useFindForm";
import { useParentFormProperties } from "../../../hooks/useParentFormProperties";
import { useUserTask } from "../../../context/UserTaskContext";

describe("ActionPanel", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.SelectedService,
      ComponentProperty.Method,
      ComponentProperty.ApiUrl,
      ComponentProperty.ApiKey,
      ComponentProperty.ApiName,
      ComponentProperty.ApiValue,
      ComponentProperty.VisibleOnApiSuccess,
      ComponentProperty.LinkedForm,
      ComponentProperty.ApiHeaders,
      ComponentProperty.RequestBodyType,
      ComponentProperty.RequestBodySpecs,
      ComponentProperty.SubmitOnChange,
      ComponentProperty.ButtonPosition,
      ComponentProperty.ClearFormDataOnAction,
      ComponentProperty.SessionKeys,
      ComponentProperty.RouteOnActionSuccess,
      ComponentProperty.RoutingType,
      ComponentProperty.ExternalURL,
      ComponentProperty.RouteMicrosite,
      ComponentProperty.RouteMicrositeVersion,
      ComponentProperty.NavigateWithoutDataTransfer,
      ComponentProperty.IsConditional,
      ComponentProperty.RoutePage,
      ComponentProperty.OnCloseAction,
      ComponentProperty.ConditionalRoutes,
      ComponentProperty.StoreDataInSession,
      ComponentProperty.ActionType,
      ComponentProperty.IsClickable,
      ComponentProperty.ShowConfirmation,
      ComponentProperty.EnableComponentLinking,
      ComponentProperty.LinkToComponent,
    ],
    propertyComponent: {
      id: "comp-1",
      type: "button-v2",
      category: "component",
      properties: {
        actionType: "submit",
        method: "POST",
        routingType: "Internal",
        routeMicrosite: "",
        conditionalRoutes: [],
      },
    },
    component: {
      properties: {
        name: "default-component",
      },
    },
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });

    (useMicrosite as jest.Mock).mockReturnValue({
      microsite: {
        pages: [{ pageCode: "page_Home" }, { pageCode: "page_About" }],
      },
      activePageCode: "page_Home",
    });

    (useConfig as jest.Mock).mockReturnValue({
      config: { NEXT_PUBLIC_BASE_URL: "http://api.com" },
    });

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { code: "page_Home", components: [] },
      formsNamekeys: {
        form1: ["field1", "field2"],
        "": ["defaultField1", "defaultField2"],
      },
      getPageDSL: jest.fn(() =>
        Promise.resolve({
          code: "page_About",
          components: [],
          properties: { showAsPopup: true },
        }),
      ),
    });
    // Mock useFindForm to return dummy form names
    (useFindForm as jest.Mock).mockReturnValue({
      formNames: ["form1", "form2"],
    });

    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: { properties: { name: "" } },
    });

    (getAllRecords as jest.Mock).mockResolvedValue([
      { code: "site1", name: "Site 1" },
      { code: "current-site", name: "Current" },
    ]);

    (getRecordVersions as jest.Mock).mockResolvedValue([
      { version: "1.0" },
      { version: "2.0" },
    ]);
  });

  test("renders panel header and toggles", () => {
    render(<ActionPanel {...defaultProps} />);
    const toggleBtn = screen.getByTestId("toggleButton");
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.ActionPanel);
  });

  test("renders SelectedService input", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("selectedService");
    fireEvent.change(input, { target: { value: "s1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SelectedService,
      "s1",
    );
  });

  test("renders API configuration fields (Method, URL, Key, Name)", () => {
    render(<ActionPanel {...defaultProps} />);

    const methodInput = screen.getByTestId("method");
    fireEvent.change(methodInput, { target: { value: "GET" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Method,
      "GET",
    );

    const urlInput = screen.getByTestId("apiUrl");
    fireEvent.change(urlInput, { target: { value: "/api/test" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiUrl,
      "/api/test",
    );

    const keyInput = screen.getByTestId("apiKey");
    fireEvent.change(keyInput, { target: { value: "123" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiKey,
      "123",
    );

    const nameInput = screen.getByTestId("apiName");
    fireEvent.change(nameInput, { target: { value: "test-api" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiName,
      "test-api",
    );
  });

  test("hides API fields if visibleOnApiSuccess is true", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          visibleOnApiSuccess: true,
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("method")).not.toBeInTheDocument();
    expect(screen.queryByTestId("apiUrl")).not.toBeInTheDocument();
  });

  test("renders ApiValue input", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("apiValue");
    fireEvent.change(input, { target: { value: "val" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiValue,
      "val",
    );
  });

  test("toggles VisibleOnApiSuccess", () => {
    render(<ActionPanel {...defaultProps} />);
    const toggle = within(screen.getByTestId("visibleOnApiSuccess")).getByRole(
      "button",
    );
    fireEvent.click(toggle);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.VisibleOnApiSuccess,
      true,
    );
  });

  test("renders LinkedForm input", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("linkedForm");
    fireEvent.change(input, { target: { value: "form1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.LinkedForm,
      "form1",
    );
  });

  test("renders API Headers JsonTextArea", () => {
    render(<ActionPanel {...defaultProps} />);
    const textArea = screen.getByTestId("apiHeaders");
    fireEvent.change(textArea, {
      target: { value: '{"Authorization": "Bearer 1"}' },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiHeaders,
      '{"Authorization": "Bearer 1"}',
    );
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApiHeaders,
      '{"Authorization":"Bearer 1"}',
    );
  });

  test("renders RequestBodyType input", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("requestBodyType");
    fireEvent.change(input, { target: { value: "raw" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RequestBodyType,
      "raw",
    );
  });

  test("renders RequestBodySpecs when type is NOT flat and method is NOT GET", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          requestBodyType: "raw",
          method: "POST",
        },
      },
    };
    render(<ActionPanel {...props} />);
    const textArea = screen.getByTestId("requestBodySpecs");
    fireEvent.change(textArea, { target: { value: "{}" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RequestBodySpecs,
      "{}",
    );
  });

  test("renders SubmitOnChange checkbox", () => {
    render(<ActionPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("submitOnChange");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubmitOnChange,
      true,
    );
  });

  test("renders ButtonPosition select", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("buttonPosition");
    fireEvent.change(input, { target: { value: "left" } });
    expect(mockSetProperty).toHaveBeenCalledWith("buttonPosition", "left");
  });

  test("renders ClearFormDataOnAction checkbox (submit action)", () => {
    render(<ActionPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("clearFormDataOnAction");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ClearFormDataOnAction,
      true,
    );
  });

  test("renders SessionKeys textarea (submit action)", () => {
    render(<ActionPanel {...defaultProps} />);
    const textarea = screen.getByTestId("sessionKeys");
    fireEvent.change(textarea, { target: { value: "key1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SessionKeys,
      "key1",
    );
  });

  test("renders RouteOnActionSuccess checkbox", () => {
    render(<ActionPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("routeOnActionSuccess");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RouteOnActionSuccess,
      true,
    );
  });

  describe("Routing Logic", () => {
    const routingProps = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          routeOnActionSuccess: true,
          routingType: "Internal",
          isConditional: false,
        },
      },
    };

    test("renders RoutingType select", () => {
      render(<ActionPanel {...routingProps} />);
      const input = screen.getByTestId("routingType");
      fireEvent.change(input, { target: { value: "External" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RoutingType,
        "External",
      );
    });

    test("renders ExternalURL input when type is External", () => {
      const props = {
        ...routingProps,
        propertyComponent: {
          ...routingProps.propertyComponent,
          properties: {
            ...routingProps.propertyComponent.properties,
            routingType: "External",
          },
        },
      };
      render(<ActionPanel {...props} />);
      const input = screen.getByTestId("externalURL");
      fireEvent.change(input, { target: { value: "http://google.com" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.ExternalURL,
        "http://google.com",
      );
    });

    test("handles Microsite Routing: fetches sites and versions", async () => {
      const props = {
        ...routingProps,
        propertyComponent: {
          ...routingProps.propertyComponent,
          properties: {
            ...routingProps.propertyComponent.properties,
            routingType: "Microsite",
            routeMicrosite: "site1",
          },
        },
      };
      render(<ActionPanel {...props} />);

      await waitFor(() => expect(getAllRecords).toHaveBeenCalled());

      // Wait for the option to be rendered to ensure state is updated
      await screen.findByText("Site 1");

      const micrositeSelect = screen.getByTestId("routeMicrosite");
      fireEvent.change(micrositeSelect, { target: { value: "site1" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RouteMicrosite,
        "site1",
      );

      await waitFor(() =>
        expect(getRecordVersions).toHaveBeenCalledWith(
          "site1",
          expect.anything(),
          expect.anything(),
        ),
      );

      const versionSelect = screen.getByTestId("routeMicrositeVersion");
      fireEvent.change(versionSelect, { target: { value: "1.0" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RouteMicrositeVersion,
        "1.0",
      );
    });

    test("renders NavigateWithoutDataTransfer checkbox (Internal)", () => {
      render(<ActionPanel {...routingProps} />);
      const checkbox = screen.getByTestId("navigateWithoutDataTransfer");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NavigateWithoutDataTransfer,
        true,
      );
    });

    test("toggles IsConditional switch", () => {
      render(<ActionPanel {...routingProps} />);
      const toggle = within(screen.getByTestId("isConditional")).getByRole(
        "button",
      );
      fireEvent.click(toggle);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.IsConditional,
        true,
      );
    });

    test("renders RoutePage select when Internal and NOT conditional", () => {
      render(<ActionPanel {...routingProps} />);
      const input = screen.getByTestId("routePage");
      fireEvent.change(input, { target: { value: "About" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RoutePage,
        "About",
      );
    });

    test("renders OnCloseAction when page logic applies", async () => {
      const routingPropsWithRoutePage = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            routeOnActionSuccess: true,
            routingType: "Internal",
            routePage: "page_About",
            isConditional: false,
          },
        },
      };

      await waitFor(() =>
        render(<ActionPanel {...routingPropsWithRoutePage} />),
      );
      await waitFor(() =>
        expect(screen.getByTestId("onCloseAction")).toBeInTheDocument(),
      );
      const input = screen.getByTestId("onCloseAction");
      fireEvent.change(input, { target: { value: "action" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.OnCloseAction,
        "action",
      );
    });

    test("renders ConditionalRoutes component when conditional is true", () => {
      const props = {
        ...routingProps,
        propertyComponent: {
          ...routingProps.propertyComponent,
          properties: {
            ...routingProps.propertyComponent.properties,
            isConditional: true,
          },
        },
      };
      render(<ActionPanel {...props} />);
      const container = screen.getByTestId("conditional-routing");
      expect(container).toBeInTheDocument();

      const addBtn = within(container).getByText("Add Condition");
      fireEvent.click(addBtn);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.ConditionalRoutes,
        expect.any(Array),
      );
    });
  });

  test("renders StoreDataInSession checkbox", () => {
    render(<ActionPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("storeDataInSession");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.StoreDataInSession,
      true,
    );
  });

  test("renders ActionType select", () => {
    render(<ActionPanel {...defaultProps} />);
    const input = screen.getByTestId("actionType");
    // Change value to "reset" to ensure change event fires (default is "submit")
    fireEvent.change(input, { target: { value: "reset" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ActionType,
      "reset",
    );
  });

  test("renders IsClickable checkbox for non-api-action table columns", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "t1",
        type: "table-column",
        category: "component",
        properties: { columnInputType: "text" },
      },
    };
    render(<ActionPanel {...props} />);
    const checkbox = screen.getByTestId("isClickable");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsClickable,
      true,
    );
  });

  test("renders ShowConfirmation checkbox for api-action table columns", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "t1",
        type: "table-column",
        category: "component",
        properties: { columnInputType: "api-action" },
      },
    };
    render(<ActionPanel {...props} />);
    const checkbox = screen.getByTestId("showConfirmation");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowConfirmation,
      true,
    );
  });

  test("handles fetch error in getMicrosites", async () => {
    (getAllRecords as jest.Mock).mockRejectedValue(new Error("Fetch failed"));
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          routingType: "Microsite",
        },
      },
    };
    render(<ActionPanel {...props} />);
    await waitFor(() => expect(getAllRecords).toHaveBeenCalled());
  });

  test("handles fetch error in getMicrositeVersions", async () => {
    (getRecordVersions as jest.Mock).mockRejectedValue(
      new Error("Fetch failed"),
    );
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          routingType: "Microsite",
          routeMicrosite: "site1",
        },
      },
    };
    render(<ActionPanel {...props} />);
    await waitFor(() => expect(getRecordVersions).toHaveBeenCalled());
  });

  test("Conditional Routing handlers (Add/Delete/Update)", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          routeOnActionSuccess: true,
          routingType: "Internal",
          isConditional: true,
          conditionalRoutes: [{ route: "old" }],
        },
      },
    };
    render(<ActionPanel {...props} />);

    const updateBtn = screen.getByText("Update");
    fireEvent.click(updateBtn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ConditionalRoutes,
      expect.arrayContaining([expect.objectContaining({ route: "new-route" })]),
    );

    const deleteBtn = screen.getByText("Delete");
    fireEvent.click(deleteBtn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ConditionalRoutes,
      [],
    );
  });

  test("renders Enable Component Linking checkbox", () => {
    render(<ActionPanel {...defaultProps} />);
    expect(screen.getByTestId("enableComponentLinking")).toBeInTheDocument();
  });

  test("toggles ComponentProperty.EnableComponentLinking checkbox and updates state", () => {
    render(<ActionPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("enableComponentLinking");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "enableComponentLinking",
      true,
    );
  });

  test("initializes multipleActions when columnInputType is multiple-actions and array is empty", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "tc-1",
        type: "table-column",
        category: "component",
        properties: {
          columnInputType: "multiple-actions",
          multipleActions: [],
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MultipleActions,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            label: "",
          }),
        }),
      ]),
    );
  });

  test("hides LinkedForm for table with visibleOnApiSuccess false", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "t1",
        type: "table",
        category: "component",
        properties: {
          visibleOnApiSuccess: false,
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("linkedForm")).not.toBeInTheDocument();
  });

  test("hides LinkedForm for button-v2 with form category", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "form",
        properties: {
          actionType: "submit",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("linkedForm")).not.toBeInTheDocument();
  });

  test("hides LinkedForm for button-v2 with component category and routing action", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          actionType: "routing",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("linkedForm")).not.toBeInTheDocument();
  });

  test("hides ApiHeaders for button-v2 with download action type", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          actionType: "download",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.getByTestId("apiHeaders")).toBeInTheDocument();
  });

  test("hides ApiHeaders for table-column without api-action", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "tc1",
        type: "table-column",
        category: "component",
        properties: {
          columnInputType: "text",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("apiHeaders")).not.toBeInTheDocument();
  });

  test("hides ClearFormDataOnAction for button-v2 with non-submit action", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          actionType: "reset",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(
      screen.queryByTestId("clearFormDataOnAction"),
    ).not.toBeInTheDocument();
  });

  test("hides RouteOnActionSuccess for button-v2 with non-submit action", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          actionType: "reset",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(
      screen.queryByTestId("routeOnActionSuccess"),
    ).not.toBeInTheDocument();
  });

  test("renders MultipleActions panel for table-column with multiple-actions type", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MultipleActions],
      propertyComponent: {
        id: "tc-1",
        type: "table-column",
        category: "component",
        properties: {
          columnInputType: "multiple-actions",
          name: "table-1",
          multipleActions: [
            {
              id: "a1",
              properties: { tableColumnActionTypes: "", label: "" },
            },
          ],
        },
      },
      component: {
        properties: {
          name: "table-1",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.getByTestId("action-type-panel-0")).toBeInTheDocument();
  });

  test("adds new action when Add Action button is clicked", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MultipleActions],
      propertyComponent: {
        id: "tc-1",
        type: "table-column",
        category: "component",
        properties: {
          columnInputType: "multiple-actions",
          name: "table-1",
          multipleActions: [
            {
              id: "a1",
              properties: { tableColumnActionTypes: "", label: "" },
            },
          ],
        },
      },
      component: {
        properties: {
          name: "table-1",
        },
      },
    };
    render(<ActionPanel {...props} />);
    const addButton = screen.getByTestId("add-expandable-column");
    fireEvent.click(addButton);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MultipleActions,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            label: "",
            tableColumnActionTypes: "",
          }),
        }),
      ]),
    );
  });

  test("returns null for unknown property key", () => {
    const props = {
      ...defaultProps,
      propertyKeys: ["unknownPropertyKey" as any],
    };
    render(<ActionPanel {...props} />);
    expect(screen.getByTestId("toggleButton")).toBeInTheDocument();
  });

  test("hides ShowConfirmation for table-column without api-action", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.ShowConfirmation],
      propertyComponent: {
        id: "tc1",
        type: "table-column",
        category: "component",
        properties: {
          columnInputType: "text",
        },
      },
    };
    render(<ActionPanel {...props} />);
    expect(screen.queryByTestId("showConfirmation")).not.toBeInTheDocument();
  });

  test("renders LinkToComponent when enableComponentLinking is true without linkedForm", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.LinkToComponent],
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          enableComponentLinking: true,
          actionType: "submit",
        },
      },
    };
    render(<ActionPanel {...props} />);
    const input = screen.getByTestId("linkToComponent");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "defaultField1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.LinkToComponent,
      "defaultField1",
    );
  });

  test("renders LinkToComponent with linkedForm options", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.LinkToComponent],
      propertyComponent: {
        id: "b1",
        type: "button-v2",
        category: "component",
        properties: {
          enableComponentLinking: true,
          actionType: "submit",
          linkedForm: "form1",
        },
      },
    };
    render(<ActionPanel {...props} />);
    const input = screen.getByTestId("linkToComponent");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "field1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.LinkToComponent,
      "field1",
    );
  });

  describe("ComponentProperty.Actions for multi-action-cta", () => {
    const multiActionProps = {
      propertyKeys: [ComponentProperty.Actions],
      setProperty: mockSetProperty,
      component: { properties: { name: "comp" } },
      propertyComponent: {
        id: "mac-1",
        type: "multi-action-cta",
        category: "component",
        properties: {
          actions: [
            { id: "a1", actionType: "submit" },
            { id: "a2", actionType: "routing" },
          ],
        },
      },
    };

    test("renders ExpandableColumn rows for each action", () => {
      render(<ActionPanel {...multiActionProps} />);
      expect(screen.getByTestId("expandable-column-0")).toBeInTheDocument();
      expect(screen.getByTestId("expandable-column-1")).toBeInTheDocument();
    });

    test("renders MultiActionTypePanel for each action", () => {
      render(<ActionPanel {...multiActionProps} />);
      expect(
        screen.getByTestId("multi-action-type-panel-0"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("multi-action-type-panel-1"),
      ).toBeInTheDocument();
    });

    test("renders AddExpandableColumn button for adding actions", () => {
      render(<ActionPanel {...multiActionProps} />);
      expect(screen.getByTestId("add-expandable-column")).toBeInTheDocument();
    });

    test("handleAddAction appends a new action via AddExpandableColumn", () => {
      render(<ActionPanel {...multiActionProps} />);
      fireEvent.click(screen.getByTestId("add-expandable-column"));
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Actions,
        expect.arrayContaining([
          expect.objectContaining({ actionType: "submit" }),
          expect.objectContaining({ actionType: "routing" }),
          expect.objectContaining({ id: expect.any(String) }),
        ]),
      );
    });

    test("returns null for Actions when component type is not multi-action-cta", () => {
      const props = {
        ...multiActionProps,
        propertyComponent: {
          ...multiActionProps.propertyComponent,
          type: "button-v2",
        },
      };
      render(<ActionPanel {...props} />);
      expect(
        screen.queryByTestId("multi-action-type-panel-0"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("add-expandable-column"),
      ).not.toBeInTheDocument();
    });

    test("initializes actions via useEffect when actions array is empty", () => {
      const props = {
        ...multiActionProps,
        propertyComponent: {
          ...multiActionProps.propertyComponent,
          properties: { actions: [] },
        },
      };
      render(<ActionPanel {...props} />);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Actions,
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(String) }),
        ]),
      );
    });

    test("initializes actions via useEffect when actions is undefined", () => {
      const props = {
        ...multiActionProps,
        propertyComponent: {
          ...multiActionProps.propertyComponent,
          properties: {},
        },
      };
      render(<ActionPanel {...props} />);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Actions,
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(String) }),
        ]),
      );
    });

    test("does not reinitialize actions when actions already exist", () => {
      render(<ActionPanel {...multiActionProps} />);
      const actionsInitCallCount = (
        mockSetProperty as jest.Mock
      ).mock.calls.filter(
        (call) => call[0] === ComponentProperty.Actions,
      ).length;
      expect(actionsInitCallCount).toBe(0);
    });

    test("sub-panel setProperty updates the correct action", () => {
      render(<ActionPanel {...multiActionProps} />);
      const select = screen.getByTestId("multi-action-select-0");
      fireEvent.change(select, { target: { value: "routing" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        "actions",
        expect.arrayContaining([
          expect.objectContaining({ id: "a1", actionType: "routing" }),
        ]),
      );
    });
  });
});
