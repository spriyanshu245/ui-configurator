import React, { act } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import InterceptorForm from "./InterceptorForm";
import { ComponentProperty } from "../../../data/componentProperties";
import { Interceptor, UIComponent } from "../../../types/types";
import {
  InterceptorTypes,
  EventTypes,
  MessageTypes,
  ComponentTypes,
} from "../../../utils/enums";
import { useUserTask } from "../../../context/UserTaskContext";

jest.mock("../../../context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/Delete", () => () => (
  <span data-testid="delete-icon" aria-label="delete icon">
    DeleteIcon
  </span>
));

jest.mock("@/app/utils/formsUtils", () => ({
  getAllFormsElements: jest.fn(() => [
    { id: "formElement1", label: "formElement1" },
    { id: "formElement2", label: "formElement2" },
  ]),
}));

jest.mock(
  "./InterceptorPanel.module.scss",
  () => new Proxy({}, { get: (target, prop) => String(prop) }),
);
jest.mock(
  "@/app/styles/shared.module.scss",
  () => new Proxy({}, { get: (target, prop) => String(prop) }),
);
jest.mock(
  "@/app/styles/properties-pane.module.scss",
  () => new Proxy({}, { get: (target, prop) => String(prop) }),
);

jest.mock("../../MultiSelect/MultiSelect", () => ({
  __esModule: true,
  default: ({ onChange, value, options, dataTestId }: any) => (
    <div data-testid={dataTestId}>
      {options.map((opt: any) => (
        <div
          key={opt.id}
          role="option"
          onClick={() => onChange([...(value || []), opt.id])}
        >
          {opt.label}
        </div>
      ))}
    </div>
  ),
}));

const dummyInterceptor: Interceptor = {
  id: "int1",
  label: "Initial Label",
  interceptorType: InterceptorTypes.VALIDATION,
  jsObject: "function() {}",
  eventType: EventTypes.ON_CHANGE,
  eventObject: ["object1"],
  messageObject: ["object1"],
  message: "Initial Message",
  messageType: MessageTypes.INFO,
  messageTimeout: 3000,
  componentType: ComponentTypes.FORM,
};

const dummyPropertyComponent = {
  id: "comp1",
  type: "input",
  category: "component",
  properties: {
    interceptors: [dummyInterceptor],
    name: "propertyName",
  },
} as UIComponent;

describe("InterceptorForm", () => {
  let setPropertyMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setPropertyMock = jest.fn();
    (useUserTask as jest.Mock).mockReturnValue({
      formsNamekeys: {},
      tablesNameKeys: {},
    });
  });

  const renderComponent = (
    interceptor = dummyInterceptor,
    component = dummyPropertyComponent,
  ) =>
    render(
      <InterceptorForm
        interceptor={interceptor}
        propertyComponent={component}
        setProperty={setPropertyMock}
      />,
    );

  test("renders top content with label and delete icon", () => {
    renderComponent();
    expect(screen.getByText("Initial Label")).toBeInTheDocument();
    expect(screen.getByTestId("delete-icon")).toBeInTheDocument();
  });

  test("toggles open and close on top content click", () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    expect(
      screen.queryByPlaceholderText("Interceptor name"),
    ).not.toBeInTheDocument();
    fireEvent.click(topContent);
    expect(screen.getByPlaceholderText("Interceptor name")).toBeInTheDocument();
    fireEvent.click(topContent);
    expect(
      screen.queryByPlaceholderText("Interceptor name"),
    ).not.toBeInTheDocument();
  });

  test("updates label in formData and calls setProperty", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);
    const labelInput = screen.getByPlaceholderText("Interceptor name");
    fireEvent.change(labelInput, { target: { value: "Updated Label" } });
    await waitFor(() => {
      expect(setPropertyMock).toHaveBeenCalled();
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.label).toBe("Updated Label");
    });
  });

  test("updates interceptor type when changed and defaults event type to ON_CHANGE", async () => {
    const originalValues = Object.values.bind(Object);
    const spy = jest.spyOn(Object, "values").mockImplementation((obj) => {
      if (obj === InterceptorTypes) {
        return ["validation", "custom"];
      }
      return originalValues(obj);
    });

    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);
    const typeLabel = screen.getByText("Interceptor Type");
    const interceptorTypeSelect =
      typeLabel.nextElementSibling as HTMLSelectElement;

    expect(interceptorTypeSelect).toBeInTheDocument();
    fireEvent.change(interceptorTypeSelect, { target: { value: "custom" } });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.interceptorType).toBe("custom");
      expect(updated.eventType).toBe(EventTypes.ON_CHANGE);
    });
    spy.mockRestore();
  });

  test("updates jsObject when textarea changes", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);
    const jsObjectTextarea = screen.getByPlaceholderText(
      "Interceptor JS function",
    );
    fireEvent.change(jsObjectTextarea, {
      target: { value: "function updated() {}" },
    });
    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.jsObject).toBe("function updated() {}");
    });
  });

  test("deletes interceptor when delete icon is clicked", async () => {
    renderComponent();
    const deleteButton = screen.getByTestId("delete-icon");
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(setPropertyMock).toHaveBeenCalledWith(
        ComponentProperty.Interceptors,
        expect.not.arrayContaining([expect.objectContaining({ id: "int1" })]),
      );
    });
  });

  test("updates event type when changed", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventTypeLabel = screen.getByText("Event Type");
    const eventTypeSelect =
      eventTypeLabel.nextElementSibling as HTMLSelectElement;

    fireEvent.change(eventTypeSelect, {
      target: { value: EventTypes.ON_SUBMIT },
    });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.eventType).toBe(EventTypes.ON_SUBMIT);
    });
  });

  test("updates event object when changed via MultiSelect", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventObjectContainer = screen.getByTestId("eventObject");
    const option = within(eventObjectContainer).getByText("formElement1");

    fireEvent.click(option);

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === dummyInterceptor.id,
      );
      expect(updated.eventObject).toContain("formElement1");
    });
  });

  test("updates message when changed", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const messageLabel = screen.getByText("Message");
    const messageInput = messageLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(messageInput, {
      target: { value: "Updated Message Text" },
    });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.message).toBe("Updated Message Text");
    });
  });

  test("updates message type when changed", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const messageTypeLabel = screen.getByText("Message Type");
    const messageTypeSelect =
      messageTypeLabel.nextElementSibling as HTMLSelectElement;

    fireEvent.change(messageTypeSelect, {
      target: { value: MessageTypes.ERROR },
    });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.messageType).toBe(MessageTypes.ERROR);
    });
  });

  test("updates message timeout when changed", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const timeoutLabel = screen.getByText("Message Timeout");
    const timeoutInput = timeoutLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(timeoutInput, { target: { value: "5000" } });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int1",
      );
      expect(updated.messageTimeout).toBe(5000);
    });
  });

  test("updates message object when changed", async () => {
    renderComponent();
    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const msgContainer = screen.getByTestId("msgObject");
    const option = within(msgContainer).getByText("formElement1");

    fireEvent.click(option);

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updated = updatedInterceptors.find(
        (i: Interceptor) => i.id === dummyInterceptor.id,
      );
      expect(updated.messageObject).toContain("formElement1");
    });
  });

  test("handles undefined interceptors by defaulting to an empty array in updates", async () => {
    const propertyComponentWithoutInterceptors = {
      id: "comp-no-interceptors",
      type: "input",
      category: "component",
      properties: {
        name: "propertyName",
      },
    } as UIComponent;

    render(
      <InterceptorForm
        interceptor={dummyInterceptor}
        propertyComponent={propertyComponentWithoutInterceptors}
        setProperty={setPropertyMock}
      />,
    );

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const labelInput = screen.getByPlaceholderText("Interceptor name");
    fireEvent.change(labelInput, { target: { value: "New Label" } });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      expect(lastCall[1]).toEqual([]);
    });
  });

  test("objectOptions uses table keys when component type is Input Table", async () => {
    (useUserTask as jest.Mock).mockReturnValue({
      formsNamekeys: {},
      tablesNameKeys: {
        tableName: [{ label: "Col 1", id: "col1" }],
      },
    });

    const inputTableComponent = {
      ...dummyPropertyComponent,
      type: ComponentTypes.INPUT_TABLE,
      properties: {
        ...dummyPropertyComponent.properties,
        name: "tableName",
        nameKeyIds: [{ label: "Col 1", id: "col1" }],
      },
    };

    render(
      <InterceptorForm
        interceptor={dummyInterceptor}
        propertyComponent={inputTableComponent}
        setProperty={setPropertyMock}
      />,
    );

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventObjectContainer = screen.getByTestId("eventObject");
    const msgObjectContainer = screen.getByTestId("msgObject");

    expect(within(eventObjectContainer).getByText("Col 1")).toBeInTheDocument();
    expect(within(msgObjectContainer).getByText("Col 1")).toBeInTheDocument();
  });

  test("input table objectOptions default to an empty array when nameKeyIds are missing", () => {
    const inputTableComponent = {
      ...dummyPropertyComponent,
      type: ComponentTypes.INPUT_TABLE,
      properties: {
        ...dummyPropertyComponent.properties,
        name: "tableName",
        nameKeyIds: undefined,
      },
    };

    render(
      <InterceptorForm
        interceptor={dummyInterceptor}
        propertyComponent={inputTableComponent}
        setProperty={setPropertyMock}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Initial Label/i }));

    expect(screen.getByTestId("eventObject").children.length).toBe(0);
    expect(screen.getByTestId("msgObject").children.length).toBe(0);
  });

  test("objectOptions defaults to empty array when getAllFormsElements returns falsy", async () => {
    const formElementsModule = require("@/app/utils/formsUtils");
    jest
      .spyOn(formElementsModule, "getAllFormsElements")
      .mockReturnValue(undefined);

    renderComponent();

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const multiSelect = screen.getByTestId("msgObject");
    expect(multiSelect).toBeInTheDocument();
    expect(multiSelect.children.length).toBe(0);

    (formElementsModule.getAllFormsElements as jest.Mock).mockRestore();
  });

  test("updateInterceptors replaces the matching interceptor and preserves others", async () => {
    const anotherInterceptor: Interceptor = {
      id: "int2",
      label: "Another Label",
      interceptorType: InterceptorTypes.VALIDATION,
      jsObject: "function() {}",
      eventType: EventTypes.ON_CHANGE,
      eventObject: ["objectX"],
      messageObject: ["objectX"],
      message: "Another Message",
      messageType: MessageTypes.INFO,
      messageTimeout: 2000,
      componentType: ComponentTypes.FORM,
    };

    const propertyComponentMultiple = {
      ...dummyPropertyComponent,
      properties: {
        ...dummyPropertyComponent.properties,
        interceptors: [dummyInterceptor, anotherInterceptor],
      },
    } as UIComponent;

    render(
      <InterceptorForm
        interceptor={dummyInterceptor}
        propertyComponent={propertyComponentMultiple}
        setProperty={setPropertyMock}
      />,
    );

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const labelInput = screen.getByPlaceholderText("Interceptor name");
    fireEvent.change(labelInput, { target: { value: "Updated Label" } });

    await waitFor(() => {
      const lastCall =
        setPropertyMock.mock.calls[setPropertyMock.mock.calls.length - 1];
      const updatedInterceptors = lastCall[1];
      const updatedDummy = updatedInterceptors.find(
        (i: Interceptor) => i.id === dummyInterceptor.id,
      );
      expect(updatedDummy.label).toBe("Updated Label");
      const unchanged = updatedInterceptors.find(
        (i: Interceptor) => i.id === "int2",
      );
      expect(unchanged.label).toBe("Another Label");
    });
  });

  test("Filters events correctly for CALCULATION interceptor type", () => {
    const calculationInterceptor = {
      ...dummyInterceptor,
      interceptorType: InterceptorTypes.CALCULATION,
    };
    renderComponent(calculationInterceptor);

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventTypeLabel = screen.getByText("Event Type");
    const eventTypeSelect =
      eventTypeLabel.nextElementSibling as HTMLSelectElement;

    const options = Array.from(eventTypeSelect.options).map((o) => o.value);
    expect(options).toContain(EventTypes.ON_CHANGE);
    expect(options).toContain(EventTypes.ON_LOAD);
    expect(options).toContain(EventTypes.ON_KEY_DOWN);
    expect(options).not.toContain(EventTypes.ON_SUBMIT);
  });

  test("Filters events correctly for VALIDATION interceptor type", () => {
    const validationInterceptor = {
      ...dummyInterceptor,
      interceptorType: InterceptorTypes.VALIDATION,
    };
    renderComponent(validationInterceptor);

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventTypeLabel = screen.getByText("Event Type");
    const eventTypeSelect =
      eventTypeLabel.nextElementSibling as HTMLSelectElement;

    const options = Array.from(eventTypeSelect.options).map((o) => o.value);
    expect(options).toContain(EventTypes.ON_SUBMIT);
    expect(options).toContain(EventTypes.ON_CHANGE);
    expect(options).toContain(EventTypes.ON_KEY_DOWN);
    expect(options).not.toContain(EventTypes.ON_LOAD);
  });

  test("Shows all events for other interceptor types", () => {
    const customInterceptor = {
      ...dummyInterceptor,
      interceptorType: "other" as any,
    };
    renderComponent(customInterceptor);

    const topContent = screen.getByRole("button", { name: /Initial Label/i });
    fireEvent.click(topContent);

    const eventTypeLabel = screen.getByText("Event Type");
    const eventTypeSelect =
      eventTypeLabel.nextElementSibling as HTMLSelectElement;

    const options = Array.from(eventTypeSelect.options).map((o) => o.value);

    expect(options.length).toBeGreaterThan(3);
    expect(options).toContain(EventTypes.ON_SUBMIT);
    expect(options).toContain(EventTypes.ON_LOAD);
  });
});
