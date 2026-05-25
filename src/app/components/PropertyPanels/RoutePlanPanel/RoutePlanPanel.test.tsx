import { render, screen, fireEvent } from "@testing-library/react";
import RoutePlanPanel from "./RoutePlanPanel";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

// Mock PropertyInput
jest.mock("../../PropertyInputs/PropertyInput", () => (props: any) => (
  <input
    data-testid={props.id}
    placeholder={props.placeholder}
    type={props.type || "text"}
    checked={props.type === "checkbox" ? props.value : undefined}
    value={props.value || ""}
    onChange={(e) => props.handleChange(e)}
  />
));

const setPropertyMock = jest.fn();

const propertyComponent = {
  id: "component1",
  properties: {
    namePathKey: "name.key",
    addressPathKey: "address.key",
    latitudePathKey: "lat.key",
    longitudePathKey: "lng.key",
    pathToArray: "data.items",
    updateRouteOnLoad: false,
  },
};

describe("RoutePlanPanel", () => {
  const togglePanelMock = jest.fn();
  const isPanelOpenMock = jest.fn(
    (panel) => panel === PropertyPanels.RoutePlanPanel
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
      <RoutePlanPanel
        propertyKeys={[]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(
      screen.getByRole("button", { name: /Route Plan/i })
    ).toBeInTheDocument();
  });

  it("calls togglePanel when toggle button is clicked", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(togglePanelMock).toHaveBeenCalledWith(PropertyPanels.RoutePlanPanel);
  });

  it("renders properties when panel is open", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[
          ComponentProperty.NamePathKey,
          ComponentProperty.AddressPathKey,
        ]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByTestId("namePathKey")).toHaveValue("name.key");
    expect(screen.getByTestId("addressPathKey")).toHaveValue("address.key");
  });

  it("does not render properties when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.NamePathKey]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByTestId("namePathKey")).toBeNull();
  });

  it("calls setProperty when NamePathKey changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.NamePathKey]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.change(screen.getByTestId("namePathKey"), {
      target: { value: "new.name.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.NamePathKey,
      "new.name.key"
    );
  });

  it("calls setProperty when LatitudePathKey changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.LatitudePathKey]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.change(screen.getByTestId("latitudePathKey"), {
      target: { value: "new.lat.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.LatitudePathKey,
      "new.lat.key"
    );
  });

  it("handles undefined property values gracefully", () => {
    const emptyComponent = {
      ...propertyComponent,
      properties: {},
    };

    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.LongitudePathKey]}
        propertyComponent={emptyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByTestId("longitudePathKey")).toHaveValue("");
  });

  it("renders nothing for unhandled property keys", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[
          ComponentProperty.NamePathKey,
          "UnknownKey" as ComponentProperty,
        ]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    // Only one valid input should exist
    expect(screen.getAllByTestId("namePathKey")).toHaveLength(1);
  });
  it("calls setProperty when AddressPathKey changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.AddressPathKey]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.change(screen.getByTestId("addressPathKey"), {
      target: { value: "new.address.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.AddressPathKey,
      "new.address.key"
    );
  });
  it("calls setProperty when LongitudePathKey changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.LongitudePathKey]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.change(screen.getByTestId("longitudePathKey"), {
      target: { value: "new.longitude.key" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.LongitudePathKey,
      "new.longitude.key"
    );
  });
  it("calls setProperty when PathToArray changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.PathToArray]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    fireEvent.change(screen.getByTestId("pathToArray"), {
      target: { value: "new.array.path" },
    });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PathToArray,
      "new.array.path"
    );
  });

  it("renders UpdateRouteOnLoad checkbox when property key is present", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.UpdateRouteOnLoad]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByTestId("updateRouteOnLoad")).toBeInTheDocument();
  });

  it("calls setProperty when UpdateRouteOnLoad checkbox changes", () => {
    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.UpdateRouteOnLoad]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    const checkbox = screen.getByTestId("updateRouteOnLoad");
    fireEvent.click(checkbox);

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.UpdateRouteOnLoad,
      true
    );
  });

  it("renders UpdateRouteOnLoad as unchecked when value is false", () => {
    const falseComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        updateRouteOnLoad: false,
      },
    };

    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.UpdateRouteOnLoad]}
        propertyComponent={falseComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByTestId("updateRouteOnLoad")).not.toBeChecked();
  });

  it("renders UpdateRouteOnLoad as checked when value is true", () => {
    const trueComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        updateRouteOnLoad: true,
      },
    };

    render(
      <RoutePlanPanel
        propertyKeys={[ComponentProperty.UpdateRouteOnLoad]}
        propertyComponent={trueComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByTestId("updateRouteOnLoad")).toBeChecked();
  });
});
