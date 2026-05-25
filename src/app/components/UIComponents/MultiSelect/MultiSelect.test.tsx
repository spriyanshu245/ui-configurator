import { render, screen } from "@testing-library/react";
import MultiSelect from "./MultiSelect";
import { MultiSelectComponent } from "../../../types/types";

const baseComponent: MultiSelectComponent = {
  id: "multi-select1",
  type: "multi-select",
  category: "form",
  properties: {
    label: "Select Option",
    showLabel: true,
    placeholder: "Choose...",
  },
};

jest.mock("../../SVGIcons/ChevronDown", () =>
  jest.fn(() => <svg data-testid="chevron-down-icon" />),
);

describe("MultiSelect component", () => {
  it("renders a div with correct id", () => {
    render(<MultiSelect component={baseComponent} />);

    const wrapper = screen.getByTestId("multi-select1").parentElement;
    expect(wrapper).toHaveAttribute("id", "multi-select1");
  });

  it("renders label when showLabel is true", () => {
    render(<MultiSelect component={baseComponent} />);
    expect(screen.getByText("Select Option")).toBeInTheDocument();
  });

  it("does not render label when showLabel is false", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };
    render(<MultiSelect component={component} />);
    expect(screen.queryByText("Select Option")).not.toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    render(<MultiSelect component={baseComponent} />);
    expect(screen.getByText("Choose...")).toBeInTheDocument();
  });

  it("renders ChevronDownIcon", () => {
    render(<MultiSelect component={baseComponent} />);
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("applies aria attributes correctly", () => {
    render(<MultiSelect component={baseComponent} />);
    const wrapper = screen.getByTestId("multi-select1").parentElement;

    expect(wrapper).toHaveAttribute("aria-haspopup", "listbox");
    expect(wrapper).toHaveAttribute("aria-owns", "multi-select1-listbox");
  });

  it("uses empty string as placeholder when none is provided", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        placeholder: undefined,
      },
    };

    render(<MultiSelect component={component} />);

    const trigger = screen.getByTestId("multi-select1");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("");
  });
});
