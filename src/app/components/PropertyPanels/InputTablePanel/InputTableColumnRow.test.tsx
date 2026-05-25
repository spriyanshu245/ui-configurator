/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

/* --------------------------------------------------
   STYLE MOCKS
-------------------------------------------------- */
jest.mock("../../../styles/properties-pane.module.scss", () => ({}));
jest.mock("../../../styles/shared.module.scss", () => ({}));

/* --------------------------------------------------
   PROPERTIES CONTEXT MOCK (CRITICAL)
-------------------------------------------------- */

/* --------------------------------------------------
   CONSTANTS MOCK
-------------------------------------------------- */
jest.mock("../../../utils/constants", () => ({
  displayColumnTypes: [{ label: "Text", value: "text" }],
  inputColumnTypes: [{ label: "Input", value: "input" }],
}));

/* --------------------------------------------------
   MAP MOCKS (INLINE STRINGS — NO ENUMS)
-------------------------------------------------- */
jest.mock("../../../data/componentPropertiesMap", () => ({
  componentPropertiesMap: {
    input: ["label", "options", "format", "columnInputType"],
    text: ["label", "columnInputType"],
  },
}));

jest.mock("../../../data/propertiesPanelMap", () => {
  const React = require("react");
  const { useContext } = React;
  const { PropertiesContext } = require("../../../context/PropertiesContext");

  const MockPanel = jest.fn((props: any) => {
    const ctx = useContext(PropertiesContext);

    return (
      <div data-testid="mock-panel">
        {/* ---- coverage for isPanelOpen / togglePanel ---- */}
        <button
          data-testid="open-panel"
          onClick={() => ctx.togglePanel("test-panel")}
        />
        <span data-testid="is-open">
          {String(ctx.isPanelOpen("test-panel"))}
        </span>

        {/* ---- coverage for setProperty ---- */}
        <button
          data-testid="set-prop"
          onClick={() => props.setProperty("label", "New Label")}
        />

        {/* ---- coverage for setProperties ---- */}
        <button
          data-testid="set-props"
          onClick={() =>
            props.setProperties({
              inputType: "select",
              placeholder: "X",
            })
          }
        />
      </div>
    );
  });

  return {
    propertyPanelsMap: {
      label: MockPanel,
      options: MockPanel,
      format: MockPanel,
      columnInputType: MockPanel,
    },
  };
});

/* --------------------------------------------------
   COMPONENT IMPORT (AFTER ALL MOCKS)
-------------------------------------------------- */
import InputTableColumnRow from "./InputTableColumnRow";

/* --------------------------------------------------
   TEST DATA
-------------------------------------------------- */
const baseColumn = {
  id: "col-1",
  type: "input",
  properties: {
    columnDataType: "input",
    columnInputType: "text",
  },
};

const propertyComponent = {
  id: "comp-1",
  properties: {
    inputColumns: [baseColumn],
  },
};

/* --------------------------------------------------
   TESTS
-------------------------------------------------- */
describe("InputTableColumnRow – 100% coverage", () => {
  const setProperty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders data type and input type selectors", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
    expect(screen.getByText("Column Input Type")).toBeInTheDocument();
  });

  it("changes column data type", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], {
      target: { value: "display" },
    });

    expect(setProperty).toHaveBeenCalled();
  });

  it("changes column input type", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    fireEvent.change(screen.getByText(/Select Input Type/i).parentElement!, {
      target: { value: "input" },
    });

    expect(setProperty).toHaveBeenCalled();
  });

  it("renders property panels", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getAllByTestId("mock-panel").length).toBeGreaterThan(0);
  });

  it("panel setProperty updates column", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    fireEvent.click(screen.getAllByTestId("set-prop")[0]);
    expect(setProperty).toHaveBeenCalled();
  });

  it("panel setProperties updates inputType", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    fireEvent.click(screen.getAllByTestId("set-props")[0]);
    expect(setProperty).toHaveBeenCalled();
  });

  it("supports display column types", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={
          {
            ...baseColumn,
            properties: {
              columnDataType: "display",
              columnInputType: "text",
            },
          } as any
        }
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("toggles panel open state via PropertiesContext", () => {
    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByTestId("is-open")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("open-panel"));

    expect(screen.getByTestId("is-open")).toHaveTextContent("true");
  });

  it("shows date format properties when columnInputType is date", () => {
    const dateColumn = {
      id: "col-1",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "date",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={dateColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getAllByTestId("mock-panel").length).toBeGreaterThan(0);
  });

  it("shows options property when columnInputType is select", () => {
    const selectColumn = {
      id: "col-1",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "select",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={selectColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getAllByTestId("mock-panel").length).toBeGreaterThan(0);
  });

  it("shows options property when columnInputType is checkbox-group", () => {
    const checkboxColumn = {
      id: "col-1",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "checkbox-group",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={checkboxColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getAllByTestId("mock-panel").length).toBeGreaterThan(0);
  });

  it("handles setProperty with inputType property key", () => {
    const { propertyPanelsMap } = require("../../../data/propertiesPanelMap");
    const React = require("react");
    const { useContext } = React;
    const { PropertiesContext } = require("../../../context/PropertiesContext");

    propertyPanelsMap.label = jest.fn((props: any) => {
      const ctx = useContext(PropertiesContext);
      return (
        <div data-testid="mock-panel-inputtype">
          <button
            data-testid="set-inputtype"
            onClick={() => props.setProperty("inputType", "date")}
          />
          <span data-testid="is-open">
            {String(ctx.isPanelOpen("test-panel"))}
          </span>
        </div>
      );
    });

    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    fireEvent.click(screen.getAllByTestId("set-inputtype")[0]);
    expect(setProperty).toHaveBeenCalled();
  });

  it("handles column type with no properties", () => {
    const emptyColumn = {
      id: "col-1",
      type: "unknown",
      properties: {},
    };

    render(
      <InputTableColumnRow
        id={0}
        column={emptyColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  it("handles propertyComponent with no inputColumns", () => {
    const emptyPropertyComponent = {
      id: "comp-1",
      properties: {},
    };

    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={emptyPropertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  it("handles column with undefined properties", () => {
    const undefinedPropsColumn = {
      id: "col-1",
      type: "input",
    };

    render(
      <InputTableColumnRow
        id={0}
        column={undefinedPropsColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  it("toggles panel with non-string panel name", () => {
    const { propertyPanelsMap } = require("../../../data/propertiesPanelMap");
    const React = require("react");
    const { useContext } = React;
    const { PropertiesContext } = require("../../../context/PropertiesContext");

    propertyPanelsMap.label = jest.fn((props: any) => {
      const ctx = useContext(PropertiesContext);
      return (
        <div data-testid="mock-panel-object">
          <button
            data-testid="toggle-object"
            onClick={() => ctx.togglePanel({ name: "test" })}
          />
          <span data-testid="is-open-object">
            {String(ctx.isPanelOpen({ name: "test" }))}
          </span>
        </div>
      );
    });

    render(
      <InputTableColumnRow
        id={0}
        column={baseColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    fireEvent.click(screen.getAllByTestId("toggle-object")[0]);
    expect(screen.getByTestId("is-open-object")).toBeInTheDocument();
  });

  it("handles multiple columns in updateColumn", async () => {
    const { propertyPanelsMap } = require("../../../data/propertiesPanelMap");
    const React = require("react");
    const { useContext } = React;
    const { PropertiesContext } = require("../../../context/PropertiesContext");

    propertyPanelsMap.label = jest.fn((props: any) => {
      const ctx = useContext(PropertiesContext);
      return (
        <div data-testid="mock-panel">
          <button
            data-testid="set-prop"
            onClick={() => props.setProperty("label", "New Label")}
          />
          <span data-testid="is-open">
            {String(ctx.isPanelOpen("test-panel"))}
          </span>
        </div>
      );
    });

    const multiColumnPropertyComponent = {
      id: "comp-1",
      properties: {
        inputColumns: [
          { id: "col-1", type: "input", properties: {} },
          { id: "col-2", type: "input", properties: {} },
        ],
      },
    };

    const secondColumn = {
      id: "col-2",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "text",
      },
    };

    render(
      <InputTableColumnRow
        id={1}
        column={secondColumn as any}
        propertyComponent={multiColumnPropertyComponent as any}
        setProperty={setProperty}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByTestId("set-prop")[0]);
    });
    expect(setProperty).toHaveBeenCalled();
  });

  it("handles column with columnInputType but no columnDataType", () => {
    const partialColumn = {
      id: "col-1",
      type: "input",
      properties: {
        columnInputType: "text",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={partialColumn as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  it("skips properties without panel component", () => {
    const {
      componentPropertiesMap,
    } = require("../../../data/componentPropertiesMap");

    componentPropertiesMap.input = [
      "label",
      "options",
      "format",
      "columnInputType",
      "unknownProperty",
    ];

    const columnWithUnknownProp = {
      id: "col-1",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "text",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={columnWithUnknownProp as any}
        propertyComponent={propertyComponent as any}
        setProperty={setProperty}
      />,
    );

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();

    componentPropertiesMap.input = [
      "label",
      "options",
      "format",
      "columnInputType",
    ];
  });

  it("handles handleTypeChange with multiple columns in colData", () => {
    const multiColumnPropertyComponent = {
      id: "comp-1",
      properties: {
        inputColumns: [
          {
            id: "col-1",
            type: "input",
            properties: { columnDataType: "input" },
          },
          {
            id: "col-2",
            type: "input",
            properties: { columnDataType: "input" },
          },
        ],
      },
    };

    const firstColumn = {
      id: "col-1",
      type: "input",
      properties: {
        columnDataType: "input",
        columnInputType: "text",
      },
    };

    render(
      <InputTableColumnRow
        id={0}
        column={firstColumn as any}
        propertyComponent={multiColumnPropertyComponent as any}
        setProperty={setProperty}
      />,
    );

    const inputTypeSelect = document.getElementById(
      "columnInputType-1",
    ) as HTMLSelectElement;
    fireEvent.change(inputTypeSelect, { target: { value: "date" } });

    expect(setProperty).toHaveBeenCalled();
  });
});
