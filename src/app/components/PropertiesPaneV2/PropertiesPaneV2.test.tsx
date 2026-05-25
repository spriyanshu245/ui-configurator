import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import PropertiesPaneV2 from "./PropertiesPaneV2";
import {
  MicrositeProvider,
  useMicrosite,
} from "../../context/MicrositeContext";
import { replaceIdsInJson } from "../../utils/utils";
import { useComponentProperties } from "../../hooks/useComponentProperties";
import { useMicrositePageProperties } from "../../hooks/useMicrositePageProperties";
import { useUserTask } from "../../context/UserTaskContext";
import { usePropertyPane } from "../../context/PropertiesContext";
import { HeaderProviderV2 } from "../../context/HeaderContextV2";
import { BaseComponent } from "../../types/types";

jest.mock("../InternalComponents/Modal/Modal", () => ({
  __esModule: true,
  default: ({ isOpen, onSubmit, submitText }: any) =>
    isOpen ? (
      <div data-testid="mock-modal">
        <button onClick={onSubmit}>{submitText}</button>
      </div>
    ) : null,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useParams: () => ({ workspaceCode: "test-workspace" }),
}));

jest.mock("../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
  PropertyPaneProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("../../hooks/useComponentProperties", () => ({
  useComponentProperties: jest.fn(),
}));

jest.mock("../../hooks/useMicrositePageProperties", () => ({
  useMicrositePageProperties: jest.fn(),
}));

jest.mock("../../context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("../../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
  MicrositeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("../../utils/utils", () => ({
  convertHyphenSeparatedToPascalCase: (str: string) => str.toUpperCase(),
  deepClone: (obj: any) => JSON.parse(JSON.stringify(obj)),
  replaceIdsInJson: jest.fn(),
  generateRandomId: jest.fn(),
}));

jest.mock("../../data/componentPropertiesMap", () => ({
  componentPropertiesMap: {
    input: ["prop1", "prop2"],
    "microsite-page": ["pageProp"],
  },
}));

const mockSetUserNotification = jest.fn();

jest.mock("../../context/HeaderContextV2", () => ({
  HeaderProviderV2: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

jest.mock("../../data/propertiesPanelMap", () => ({
  propertyPanelsMap: {
    prop1: (props: any) => <div data-testid="panel-prop1">Panel 1</div>,
    prop2: (props: any) => <div data-testid="panel-prop2">Panel 2</div>,
    pageProp: (props: any) => <div data-testid="panel-page">Page Panel</div>,
  },
}));

const dummyPropertyPaneContext = {
  isPropertyPaneVisible: true,
  propertyComponentId: "comp1",
  propertyPageCode: null,
  setActiveComponent: jest.fn(),
  resetActiveComponent: jest.fn(),
  setActivePage: jest.fn(),
  resetActivePage: jest.fn(),
  togglePropertyPane: jest.fn(),
  togglePanel: jest.fn(),
  isPanelOpen: jest.fn(),
};

const dummyComponent: BaseComponent = {
  id: "comp1",
  type: "input",
  category: "component",
  properties: {
    label: "input",
    showLabel: true,
    name: "input",
    placeholder: "Enter value",
  },
};

const mockSetComponentProperties = jest.fn();
const dummyUseComponentProperties = {
  component: dummyComponent,
  setProperty: jest.fn(),
  setProperties: mockSetComponentProperties,
};

const mockSetPageProperties = jest.fn();

const dummyPage = {
  id: "page1",
  code: "page1_code",
  name: "Page name",
  type: "microsite-page",
};

const dummyUseMicrositePageProperties = {
  page: dummyPage,
  setProperty: jest.fn(),
  setProperties: mockSetPageProperties,
};
let mockImportComponent = jest.fn();
const dummyUserTask = {
  removeComponent: jest.fn(),
  removePage: jest.fn(),
  importComponent: mockImportComponent,
};

const dummyMicrosite = {
  isEditing: true,
  removePage: jest.fn().mockImplementation((pageId) => Promise.resolve()),
};

(useComponentProperties as jest.Mock).mockReturnValue(
  dummyUseComponentProperties
);
(useMicrositePageProperties as jest.Mock).mockReturnValue(
  dummyUseMicrositePageProperties
);
(useUserTask as jest.Mock).mockReturnValue(dummyUserTask);
(useMicrosite as jest.Mock).mockReturnValue(dummyMicrosite);
(usePropertyPane as jest.Mock).mockReturnValue(dummyPropertyPaneContext);

const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <MicrositeProvider>{children}</MicrositeProvider>;
};

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, { wrapper: ProvidersWrapper });

describe("PropertiesPaneV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue(dummyPropertyPaneContext);

    (useMicrositePageProperties as jest.Mock).mockReturnValue(
      dummyUseMicrositePageProperties
    );
  });
  const createFile = (content: any) => {
    const file = new File([JSON.stringify(content)], "test.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", {
      value: jest.fn().mockResolvedValue(JSON.stringify(content)),
      writable: true,
    });
    return file;
  };

  it("returns null when property pane is not visible", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      isPropertyPaneVisible: false,
      propertyComponentId: null,
      propertyPageCode: null,
      resetActiveComponent: jest.fn(),
      resetActivePage: jest.fn(),
    });
    const { container } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders header with correct label and property details when a propertyComponent is provided", () => {
    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: null,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );

    expect(screen.getAllByText(/input/i)[0]).toBeInTheDocument();
    expect(screen.getByText(dummyComponent.id)).toBeInTheDocument();
  });

  it("calls removeComponent when delete button is clicked for a component", () => {
    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const deleteButton = screen.getByTitle("Delete Component");
    fireEvent.click(deleteButton);
    expect(dummyUserTask.removeComponent).toHaveBeenCalledWith("comp1");
  });

  it("calls closePropertyPane when close button is clicked", async () => {
    const resetActiveComponent = jest.fn();
    const resetActivePage = jest.fn();
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      resetActiveComponent,
      resetActivePage,
    });
    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const closeButton = screen.getByTitle("Close Properties (esc)");
    fireEvent.click(closeButton);
    const container = document.getElementById("propertiesPane");
    expect(container).toBeTruthy();
    fireEvent.transitionEnd(container!);
    expect(resetActiveComponent).toHaveBeenCalled();
    expect(resetActivePage).toHaveBeenCalled();
  });

  it("closes property pane on Escape key press", async () => {
    const resetActiveComponent = jest.fn();
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      resetActiveComponent,
    });
    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    const container = document.getElementById("propertiesPane");
    fireEvent.transitionEnd(container!);
    expect(resetActiveComponent).toHaveBeenCalled();
  });

  it("renders panel elements based on componentPropertiesMap when propertyComponent is provided", () => {
    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-prop1")).toBeInTheDocument();
    expect(screen.getByTestId("panel-prop2")).toBeInTheDocument();
  });

  it("handles component without properties", () => {
    const componentWithoutProperties = {
      ...dummyComponent,
      properties: undefined,
    };

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: componentWithoutProperties,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByText(componentWithoutProperties.id)).toBeInTheDocument();
  });

  it("handles animation state changes", () => {
    const { container } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const propertiesPane = container.firstChild as HTMLElement;
    expect(propertiesPane).toHaveClass("open");

    fireEvent.transitionEnd(propertiesPane);
    expect(propertiesPane).toBeInTheDocument();
  });

  it("handles null property values", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: null,
      propertyPageCode: null,
    });

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: null,
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: null,
    });

    const { container } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles cleanup when component is unmounted", () => {
    const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("handles propertyComponentId with nullish coalescing", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: null,
      isPropertyPaneVisible: false,
    });

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: null,
    });

    const { container } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles propertyComponent with button type and submit action", () => {
    const buttonComponent = {
      ...dummyComponent,
      type: "button",
      properties: {
        ...dummyComponent.properties,
        actionType: "submit",
      },
    };

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: buttonComponent,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const deleteButton = screen.queryByTitle("Delete Component");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("handles propertyComponentId and propertyPageCode with nullish coalescing", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: null,
      propertyPageCode: "page1",
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: { ...dummyPage },
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );

    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("handles form component with form found", () => {
    const formComponent = {
      ...dummyComponent,
      type: "form",
    };

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: formComponent,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const typeElement = screen.getByText("FORM");
    expect(typeElement).toBeInTheDocument();
  });

  it("handles form-row and field-group types", () => {
    const formRowComponent = {
      ...dummyComponent,
      type: "form-row",
    };

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: formRowComponent,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const typeElement = screen.getByText("FORM-ROW");
    expect(typeElement).toBeInTheDocument();
  });

  it("handles restricted elements in single form row", () => {
    const restrictedComponent = {
      ...dummyComponent,
      type: "input",
    };

    (useComponentProperties as jest.Mock).mockReturnValue({
      ...dummyUseComponentProperties,
      component: restrictedComponent,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const propertiesPane = screen.getByText("INPUT");
    expect(propertiesPane).toBeInTheDocument();
  });

  it("deletes component when delete button is clicked", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: "comp1",
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    const deleteButton = screen.getByTitle("Delete Component");
    fireEvent.click(deleteButton);
    expect(dummyUserTask.removeComponent).toHaveBeenCalledWith("comp1");
  });

  it("deletes page when delete button is clicked and modal is confirmed", async () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyPageCode: "page1",
      propertyComponentId: null,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );

    const deleteBtn = screen.getByTitle("Delete Page");
    fireEvent.click(deleteBtn);

    const modalDeleteBtn = screen.getByText("Delete");
    fireEvent.click(modalDeleteBtn);

    expect(dummyMicrosite.removePage).toHaveBeenCalledWith("page1");

    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Page deleted successfully",
        type: "success",
      })
    );
  });

  it("sets property function for component", () => {
    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: null,
    });

    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: "comp1",
      propertyPageCode: null,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-prop1")).toBeInTheDocument();
  });

  it("sets property function for page", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyPageCode: "page1",
      propertyComponentId: null,
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: dummyPage,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-page")).toBeInTheDocument();
  });

  it("sets property function for page when propertyPageCode is provided", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyPageCode: "page1",
      propertyComponentId: null,
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: dummyPage,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-page")).toBeInTheDocument();
  });

  it("sets heading label based on propertyPageCode", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyPageCode: "page1",
      propertyComponentId: null,
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: { ...dummyPage, code: "Custom Page Code" },
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByText("Custom Page Code")).toBeInTheDocument();
  });

  it("sets heading label to code if page name is not provided", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyPageCode: "page1",
      propertyComponentId: null,
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: { ...dummyPage, name: undefined },
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("sets propertyComponent to propertyComponent or page", () => {
    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: null,
    });
    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: "comp1",
      propertyPageCode: null,
    });

    const { rerender } = renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-prop1")).toBeInTheDocument();

    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: null,
      propertyPageCode: "page1",
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: dummyPage,
    });

    rerender(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("panel-page")).toBeInTheDocument();
  });

  test("Import Page into a page created in microsite through propertypane Import Button", async () => {
    const validFile = createFile({
      dslJson: {
        id: "page1",
        code: "page1",
        name: "Test Page",
        components: [],
      },
    });

    (usePropertyPane as jest.Mock).mockReturnValue({
      ...dummyPropertyPaneContext,
      propertyComponentId: null,
      propertyPageCode: "page1",
    });

    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: dummyPage,
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    (replaceIdsInJson as jest.Mock).mockReturnValue({
      dslJson: {
        id: "page1",
        code: "page1",
        name: "Test Page",
        components: [],
      },
    });
    fireEvent.click(screen.getByTestId("import"));
    await waitFor(async () => {
      const fileInput = screen.getByTestId("file-input");

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: { 0: validFile, length: 1, item: () => validFile },
          writable: false,
        });
        fireEvent.change(fileInput);
      });
    });

    await waitFor(() => {
      expect(mockSetPageProperties).toHaveBeenCalledWith(
        {
          id: "page1",
          code: "page1_code",
          components: [],
          name: "Page name",
          type: "microsite-page",
        },
        false
      );
    });
  });

  test("Import component into a component created in microsite page through propertypane Import Button", async () => {
    (useMicrositePageProperties as jest.Mock).mockReturnValue({
      ...dummyUseMicrositePageProperties,
      page: null,
    });
    (useComponentProperties as jest.Mock).mockReturnValue(
      dummyUseComponentProperties
    );
    const validFile = createFile({
      dslJson: {
        id: "page2",
        type: "input",
        displayName: "Text Input",
        category: "form",
        properties: {
          placeholder: "Enter text",
          label: "Text Input",
          showLabel: true,
          inputType: "text",
          name: "",
          currencyName: "en-IN",
        },
      },
    });

    renderWithProviders(
      <HeaderProviderV2>
        <PropertiesPaneV2 />
      </HeaderProviderV2>
    );
    (replaceIdsInJson as jest.Mock).mockReturnValue({
      dslJson: {
        id: "page2",
        type: "input",
        displayName: "Text Input",
        category: "form",
        properties: {
          placeholder: "Enter text",
          label: "Text Input",
          showLabel: true,
          inputType: "text",
          name: "",
          currencyName: "en-IN",
        },
      },
    });
    fireEvent.click(screen.getByTestId("import"));
    await waitFor(async () => {
      const fileInput = screen.getByTestId("file-input");

      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: { 0: validFile, length: 1, item: () => validFile },
          writable: false,
        });
        fireEvent.change(fileInput);
      });
    });

    await waitFor(() => {
      expect(mockImportComponent).toHaveBeenCalledWith({
        componentId: "comp1",
        importData: {
          category: "form",
          displayName: "Text Input",
          id: "page2",
          properties: {
            currencyName: "en-IN",
            inputType: "text",
            label: "Text Input",
            name: "",
            placeholder: "Enter text",
            showLabel: true,
          },
          type: "input",
        },
      });
    });
  });
});
