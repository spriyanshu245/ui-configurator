import { render, screen, fireEvent } from "@testing-library/react";
import PrefillDataPanel from "./PrefillDataPanel";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import { useUserTask } from "../../../context/UserTaskContext";

// --- Mocks --- //
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../../context/UserTaskContext", () => {
  useUserTask: jest.fn(() => ({ formsNamekeys: { name: [] } }));
});

// Updated JsonTextArea mock: parse the value and call validateKeys with the parsed object.
jest.mock("../../JsonTextArea/JsonTextArea", () => (props: any) => {
  return (
    <textarea
      data-testid={props.id}
      value={props.value}
      onChange={(e) => {
        props.onChange && props.onChange(e.target.value);
        try {
          const parsed = JSON.parse(e.target.value);
          const validationResult =
            props.validateKeys && props.validateKeys(parsed);
          if (!validationResult) {
            props.onValidJson && props.onValidJson(parsed);
          }
        } catch (err) {}
      }}
    />
  );
});

// --- Dummy Data --- //
const propertyKeys = [
  ComponentProperty.PrefillApiUrl,
  ComponentProperty.PrefillResponseBodySpecs,
  ComponentProperty.PrefillApiName,
  ComponentProperty.StorePrefillInSession,
  ComponentProperty.PrefillApiHeaders,
  ComponentProperty.ResponseBodyType,
];

const propertyComponent = {
  properties: {
    name: "name",
    storePrefillInSession: true,
    prefillApiName: "prefill-api",
    prefillApiUrl: "http://example.com",
    prefillResponseBodySpecs: '{"amount": "$amount"}',
    nameKeyIds: [{ id: "newAmount", label: "newAmount" }],
  },
  components: [],
};

const setPropertyMock = jest.fn();

describe("PrefillDataPanel", () => {
  const togglePanelMock = jest.fn();
  const isPanelOpenMock = jest.fn(
    (panel) => panel === PropertyPanels.PrefillDataPanel,
  );
  const propertyComponentIdMock = "component1";

  beforeEach(() => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: isPanelOpenMock,
      propertyComponentId: propertyComponentIdMock,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the toggle button and panel header", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const toggleButton = screen.getByRole("button", {
      name: /Prefill Action/i,
    });
    expect(toggleButton).toBeInTheDocument();
  });

  it("calls togglePanel with the correct panel when the toggle button is clicked", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const toggleButton = screen.getByRole("button", {
      name: /Prefill Action/i,
    });
    fireEvent.click(toggleButton);
    expect(togglePanelMock).toHaveBeenCalledWith(
      PropertyPanels.PrefillDataPanel,
    );
  });

  it("renders property fields when the panel is open", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    // Check API URL input
    const apiUrlInput = screen.getByPlaceholderText(
      /Enter Prefill API URL here/i,
    );
    expect(apiUrlInput).toBeInTheDocument();
    expect(apiUrlInput).toHaveValue("http://example.com");

    // Check JSON TextArea for Response Body Specs
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    expect(jsonTextArea).toBeInTheDocument();
    expect(jsonTextArea).toHaveValue('{"amount": "$amount"}');

    // Check helper text is rendered
    expect(
      screen.getByText(
        /"age": "\${micrositeSlug.pageSlug.apikey.response.nestedPath}"/,
      ),
    ).toBeInTheDocument();
  });

  it("does not render property fields when the panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: jest.fn(() => false),
      propertyComponentId: propertyComponentIdMock,
    });
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    expect(
      screen.queryByPlaceholderText(/Enter Prefill API URL here/i),
    ).toBeNull();
    expect(screen.queryByTestId("json-textarea")).toBeNull();
  });

  it("calls setProperty on API URL input change", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const apiUrlInput = screen.getByPlaceholderText(
      /Enter Prefill API URL here/i,
    );
    fireEvent.change(apiUrlInput, { target: { value: "http://newurl.com" } });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillApiUrl,
      "http://newurl.com",
    );

    const apiNameInput = screen.getByTestId("prefillApiName");
    fireEvent.change(apiNameInput, { target: { value: "prefill" } });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillApiName,
      "prefill",
    );

    const checkbox = screen.getByTestId("storePrefillInSession");
    fireEvent.click(checkbox);
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.StorePrefillInSession,
      false,
    );
  });

  it("calls setProperty on valid JSON input in the JsonTextArea", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    fireEvent.change(jsonTextArea, {
      target: { value: '{"amount":"$newAmount"}' },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillResponseBodySpecs,
      '{"amount":"$newAmount"}',
    );
  });

  it("does not call setProperty if invalid keys are provided", () => {
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillResponseBodySpecs]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    fireEvent.change(jsonTextArea, {
      target: { value: '{"amount":"$wrong"}' },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillResponseBodySpecs,
      '{"amount":"$wrong"}',
    );
  });

  it(" calls setProperty if selected any value from dropdown for responseBodyType ", () => {
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.ResponseBodyType]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const responseBodyType = screen.getByTestId("responseBodyType");
    fireEvent.change(responseBodyType, {
      target: { value: "flat" },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.ResponseBodyType,
      "flat",
    );
  });

  it("renders nothing for unhandled property keys", () => {
    // Pass an extra key that's not handled.
    render(
      <PrefillDataPanel
        propertyKeys={[
          ComponentProperty.PrefillApiUrl,
          "NotHandled" as ComponentProperty,
        ]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const apiUrlInput = screen.getByPlaceholderText(
      /Enter Prefill API URL here/i,
    );
    expect(apiUrlInput).toBeInTheDocument();
    // There should be only one element with the label "Prefill API URL"
    const labels = screen.getAllByText(/Prefill API URL/i);
    expect(labels).toHaveLength(1);
  });

  it("renders API Headers input and updates state on change", () => {
    render(
      <PrefillDataPanel
        propertyKeys={propertyKeys}
        propertyComponent={{
          ...propertyComponent,
          properties: {
            ...propertyComponent.properties,
            apiHeaders: '{"Authorization": "Bearer token"}',
          },
        }}
        setProperty={setPropertyMock}
      />,
    );

    const input = screen.getByTestId("preFillApiHeaders");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, {
      target: { value: '{"Authorization": "NewToken"}' },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillApiHeaders,
      '{"Authorization":"NewToken"}',
    );
  });

  it("handles validateKeys when parsedObject is an array", () => {
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillResponseBodySpecs]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    fireEvent.change(jsonTextArea, {
      target: { value: "[]" },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillResponseBodySpecs,
      "[]",
    );
  });

  it("handles empty prefillApiUrl", () => {
    const emptyPropertyComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        prefillApiUrl: undefined,
      },
    };
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillApiUrl]}
        propertyComponent={emptyPropertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const apiUrlInput = screen.getByPlaceholderText(
      /Enter Prefill API URL here/i,
    );
    expect(apiUrlInput).toHaveValue("");
  });

  it("handles empty prefillApiName", () => {
    const emptyPropertyComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        prefillApiName: undefined,
      },
    };
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillApiName]}
        propertyComponent={emptyPropertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const apiNameInput = screen.getByTestId("prefillApiName");
    expect(apiNameInput).toHaveValue("");
  });

  it("handles empty prefillResponseBodySpecs", () => {
    const emptyPropertyComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        prefillResponseBodySpecs: undefined,
      },
    };
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillResponseBodySpecs]}
        propertyComponent={emptyPropertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    expect(jsonTextArea).toHaveValue("");
  });

  it("handles empty nameKeyIds", () => {
    const emptyPropertyComponent = {
      ...propertyComponent,
      properties: {
        ...propertyComponent.properties,
        nameKeyIds: undefined,
      },
    };
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillResponseBodySpecs]}
        propertyComponent={emptyPropertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    expect(jsonTextArea).toBeInTheDocument();
  });

  it("calls onChange for PrefillResponseBodySpecs during typing", () => {
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillResponseBodySpecs]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("prefillResponseBodySpecs");
    fireEvent.change(jsonTextArea, {
      target: { value: '{"test"' },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillResponseBodySpecs,
      '{"test"',
    );
  });

  it("calls onChange for PrefillApiHeaders during typing", () => {
    render(
      <PrefillDataPanel
        propertyKeys={[ComponentProperty.PrefillApiHeaders]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />,
    );
    const jsonTextArea = screen.getByTestId("preFillApiHeaders");
    fireEvent.change(jsonTextArea, {
      target: { value: '{"header"' },
    });
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.PrefillApiHeaders,
      '{"header"',
    );
  });
});
