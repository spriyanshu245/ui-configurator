import { render, screen, fireEvent } from "@testing-library/react";
import MapsPanel from "./MapsPanel";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

// Mock PropertyInput
jest.mock("../../PropertyInputs/PropertyInput", () => (props: any) => {
  if (props.type === "checkbox") {
    return (
      <input
        type="checkbox"
        data-testid={props.id}
        checked={props.value}
        onChange={(e) => props.handleChange(e)}
      />
    );
  }

  return (
    <input
      type="text"
      data-testid={props.id}
      value={props.value || ""}
      onChange={(e) => props.handleChange(e)}
    />
  );
});

const setPropertyMock = jest.fn();

const baseComponent = {
  id: "component1",
  properties: {
    encodedPolylinePathKey: "poly.key",
    locationsPathKey: "loc.key",
    showOrder: true,
    showRoute: true,
  },
};

describe("MapsPanel", () => {
  const togglePanelMock = jest.fn();
  const isPanelOpenMock = jest.fn(
    (panel) => panel === PropertyPanels.MapsPanel,
  );

  beforeEach(() => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: isPanelOpenMock,
    });
    jest.clearAllMocks();
  });

  it("renders toggle button with heading", () => {
    render(
      <MapsPanel
        propertyKeys={[]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByRole("button", { name: /Maps/i })).toBeInTheDocument();
  });

  it("calls togglePanel when button clicked", () => {
    render(
      <MapsPanel
        propertyKeys={[]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(togglePanelMock).toHaveBeenCalledWith(PropertyPanels.MapsPanel);
  });

  it("renders properties when panel is open", () => {
    render(
      <MapsPanel
        propertyKeys={[
          ComponentProperty.LocationsPathKey,
          ComponentProperty.ShowOrder,
        ]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByTestId("locationsPathKey")).toHaveValue("loc.key");
    expect(screen.getByTestId("showOrder")).toBeChecked();
  });

  it("does not render properties when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.LocationsPathKey]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.queryByTestId("locationsPathKey")).toBeNull();
  });

  it("renders EncodedPolylinePathKey only if showRoute is true", () => {
    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.EncodedPolylinePathKey]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByTestId("encodedPolylinePathKey")).toBeInTheDocument();
  });

  it("does not render EncodedPolylinePathKey if showRoute is false", () => {
    const component = {
      ...baseComponent,
      properties: { ...baseComponent.properties, showRoute: false },
    };

    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.EncodedPolylinePathKey]}
        propertyComponent={component}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.queryByTestId("encodedPolylinePathKey")).toBeNull();
  });

  it("calls setProperty when LocationsPathKey changes", () => {
    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.LocationsPathKey]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.change(screen.getByTestId("locationsPathKey"), {
      target: { value: "new.loc.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.LocationsPathKey,
      "new.loc.key",
    );
  });

  it("calls setProperty when ShowOrder checkbox toggled", () => {
    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.ShowOrder]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.click(screen.getByTestId("showOrder"));

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.ShowOrder,
      false,
    );
  });

  it("calls setProperty when ShowRoute checkbox toggled", () => {
    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.ShowRoute]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.click(screen.getByTestId("showRoute"));

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.ShowRoute,
      false,
    );
  });

  it("handles undefined values gracefully", () => {
    const component = {
      ...baseComponent,
      properties: {},
    };

    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.LocationsPathKey]}
        propertyComponent={component}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByTestId("locationsPathKey")).toHaveValue("");
  });

  it("renders nothing for unhandled property key", () => {
    render(
      <MapsPanel
        propertyKeys={[
          ComponentProperty.LocationsPathKey,
          "UnknownKey" as ComponentProperty,
        ]}
        propertyComponent={baseComponent}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getAllByTestId("locationsPathKey")).toHaveLength(1);
  });

  it("calls setProperty when EncodedPolylinePathKey changes", () => {
    const componentWithRoute = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showRoute: true, // required for rendering
        encodedPolylinePathKey: "poly.key",
      },
    };

    render(
      <MapsPanel
        propertyKeys={[ComponentProperty.EncodedPolylinePathKey]}
        propertyComponent={componentWithRoute}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.change(screen.getByTestId("encodedPolylinePathKey"), {
      target: { value: "new.poly.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.EncodedPolylinePathKey,
      "new.poly.key",
    );
  });
});
