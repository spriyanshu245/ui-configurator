import { render, screen } from "@testing-library/react";
import TimeInput from "./TimeInput";

describe("TimeInput", () => {
  const baseComponent = {
    id: "time-input-1",
    type: "time-input",
    category: "component",
    properties: {
      label: "Appointment Time",
      showLabel: true,
    },
  };

  test("renders the time input structure with label when enabled", () => {
    render(<TimeInput component={baseComponent as any} />);

    expect(screen.getByText("Appointment Time")).toBeInTheDocument();
    expect(screen.getByLabelText("Hours")).toBeInTheDocument();
    expect(screen.getByLabelText("Minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("AM/PM")).toHaveTextContent("PM");
  });

  test("does not render the label when showLabel is false", () => {
    render(
      <TimeInput
        component={
          {
            ...baseComponent,
            properties: {
              ...baseComponent.properties,
              showLabel: false,
            },
          } as any
        }
      />,
    );

    expect(screen.queryByText("Appointment Time")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Hours")).toBeInTheDocument();
  });

  test("does not render the label when the label text is empty", () => {
    render(
      <TimeInput
        component={
          {
            ...baseComponent,
            properties: {
              ...baseComponent.properties,
              label: "",
              showLabel: true,
            },
          } as any
        }
      />,
    );

    expect(screen.queryByText("Appointment Time")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Minutes")).toBeInTheDocument();
  });
});
