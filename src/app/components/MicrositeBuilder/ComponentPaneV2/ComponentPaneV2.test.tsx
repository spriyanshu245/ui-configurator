import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));
jest.mock("@/app/hooks/useFindForm", () => ({
  useFindForm: jest.fn(),
}));
jest.mock("@/app/context/ConfiguratorModeContext", () => ({
  useConfiguratorMode: jest.fn(),
}));
jest.mock("@/app/context/DragContext", () => ({
  useDragContext: () => ({
    isDragging: false,
    setIsDragging: jest.fn(),
    setIsDraggingComponent: jest.fn(),
    setIsDraggingFormElement: jest.fn(),
    setIsFormRowValidation: jest.fn(),
  }),
}));
jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: () => ({
    isEditing: true,
  }),
}));
jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: () => ({
    userTask: {
      properties: {
        showAsPopup: true,
      },
    },
  }),
}));
jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));
jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));
jest.mock("@/app/components/PropertiesPaneV2/PropertiesPaneV2", () => () => (
  <div data-testid="properties-pane">PropertiesPaneV2</div>
));

import { useConfiguratorMode } from "@/app/context/ConfiguratorModeContext";
import { useFindForm } from "@/app/hooks/useFindForm";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ComponentPaneV2 from "./ComponentPaneV2";

describe("ComponentPaneV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      isPropertyPaneVisible: false,
      propertyComponentId: null,
      propertyPageCode: null,
    });
    (useFindForm as jest.Mock).mockReturnValue({
      isFormFound: false,
    });
    (useConfiguratorMode as jest.Mock).mockReturnValue({
      mode: "microsite",
    });
  });

  const expectCategoryCount = (label: string, count: number) => {
    const categoryButton = screen.getByRole("button", {
      name: new RegExp(label, "i"),
    });

    expect(categoryButton).toHaveTextContent(`${label} (${count})`);
  };

  it("renders the V2 pane in list view by default", () => {
    render(<ComponentPaneV2 />);

    expect(screen.getByLabelText("Search components here")).toBeInTheDocument();
    expectCategoryCount("Containers", 7);
    expect(
      screen.getByTestId("component-pane-v2-item-sub-section"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A styled container for grouping related components under an optional label.",
      ),
    ).toBeInTheDocument();
  });

  it("switches to grid view and hides descriptions", () => {
    render(<ComponentPaneV2 />);

    fireEvent.click(screen.getByLabelText("Switch to grid view"));

    expect(
      screen.queryByText(
        "A styled container for grouping related components under an optional label.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("component-pane-v2-item-sub-section"),
    ).toBeInTheDocument();
  });

  it("supports keyword search and keeps matching categories open", () => {
    render(<ComponentPaneV2 />);

    fireEvent.click(screen.getByRole("button", { name: /choices/i }));
    expect(
      screen.queryByTestId("component-pane-v2-item-radio-group"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search components here"), {
      target: { value: "radio-group" },
    });

    expect(
      screen.queryByRole("button", { name: /containers/i }),
    ).not.toBeInTheDocument();
    expectCategoryCount("Choices", 1);
    expect(
      screen.getByTestId("component-pane-v2-item-radio-group"),
    ).toBeInTheDocument();
    expect(screen.getByText("Radio Buttons")).toBeInTheDocument();
  });

  it("collapses and expands all categories", () => {
    render(<ComponentPaneV2 />);

    expect(
      screen.queryByLabelText("Expand all categories"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Collapse all categories"));
    expect(
      screen.queryByTestId("component-pane-v2-item-sub-section"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Expand all categories")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Collapse all categories"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Expand all categories"));
    expect(
      screen.getByTestId("component-pane-v2-item-sub-section"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collapse all categories"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Expand all categories"),
    ).not.toBeInTheDocument();
  });

  it("hides tabs when configurator mode is page", () => {
    (useConfiguratorMode as jest.Mock).mockReturnValue({
      mode: "page",
    });

    render(<ComponentPaneV2 />);

    expect(
      screen.queryByTestId("component-pane-v2-item-tabs"),
    ).not.toBeInTheDocument();
  });

  it("renders the properties pane when the property panel is visible", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      isPropertyPaneVisible: true,
      propertyComponentId: "component-1",
      propertyPageCode: null,
    });

    render(<ComponentPaneV2 />);

    expect(screen.getByTestId("properties-pane")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Search components here"),
    ).not.toBeInTheDocument();
  });

  it("keeps the component pane visible when the flag is true without an active target", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      isPropertyPaneVisible: true,
      propertyComponentId: null,
      propertyPageCode: null,
    });

    render(<ComponentPaneV2 />);

    expect(screen.queryByTestId("properties-pane")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search components here")).toBeInTheDocument();
  });

  it("focuses search input via requestAnimationFrame after properties pane closes with active search", () => {
    jest.useFakeTimers();

    const { rerender } = render(<ComponentPaneV2 />);

    fireEvent.change(screen.getByLabelText("Search components here"), {
      target: { value: "button" },
    });

    act(() => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        isPropertyPaneVisible: true,
        propertyComponentId: "component-1",
        propertyPageCode: null,
      });
    });
    rerender(<ComponentPaneV2 />);

    act(() => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        isPropertyPaneVisible: false,
        propertyComponentId: null,
        propertyPageCode: null,
      });
    });
    rerender(<ComponentPaneV2 />);

    act(() => {
      jest.runAllTimers();
    });

    jest.useRealTimers();

    expect(screen.getByLabelText("Search components here")).toBeInTheDocument();
  });
});
