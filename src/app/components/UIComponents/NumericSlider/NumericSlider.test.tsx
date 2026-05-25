import { render, screen } from "@testing-library/react";
import NumericSlider from "./NumericSlider";
import { FormInputComponent } from "@/app/types/types";
import "@testing-library/jest-dom";

describe("NumericSlider Component", () => {
  const baseComponent: FormInputComponent = {
    id: "slider-1",
    name: "testSlider",
    type: "numeric-slider",
    category: "form",
    properties: {
      label: "Amount",
      showLabel: true,
      sliderMin: "10",
      sliderMax: "200",
      sliderPrefixText: "$",
      sliderSuffixText: "USD",
      sliderValuePosition: "top",
      sliderValueAlignment: "center",
      sliderValueFontSize: 32,
      sliderValueFontWeight: "700",
      sliderValueGap: 12,
      defaultValue: "50",
    },
  };

  it("renders with correct id", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    expect(container.querySelector("#slider-1")).toBeInTheDocument();
  });

  it("renders label when showLabel is true", () => {
    render(<NumericSlider component={baseComponent} />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("does not render label when showLabel is false", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: { ...baseComponent.properties, showLabel: false },
    };
    render(<NumericSlider component={comp} />);
    expect(screen.queryByText("Amount")).not.toBeInTheDocument();
  });

  it("does not render label when label is empty", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: { ...baseComponent.properties, label: "" },
    };
    render(<NumericSlider component={comp} />);
    expect(screen.queryByLabelText("Amount")).not.toBeInTheDocument();
  });

  it("displays prefix and suffix with default value", () => {
    render(<NumericSlider component={baseComponent} />);
    expect(screen.getByText("$ 50 USD")).toBeInTheDocument();
  });

  it("displays value on top when sliderValuePosition is top", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    const selectedValue = container.querySelector("[class*='selectedValue']");
    expect(selectedValue).toBeInTheDocument();
    const trackContainer = container.querySelector("[class*='trackContainer']");
    expect(selectedValue!.compareDocumentPosition(trackContainer!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("displays value on bottom when sliderValuePosition is bottom", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        sliderValuePosition: "bottom",
      },
    };
    const { container } = render(<NumericSlider component={comp} />);
    const selectedValue = container.querySelector("[class*='selectedValue']");
    const trackContainer = container.querySelector("[class*='trackContainer']");
    expect(selectedValue!.compareDocumentPosition(trackContainer!)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it("renders range labels with prefix and suffix", () => {
    render(<NumericSlider component={baseComponent} />);
    expect(screen.getByText("$ 10")).toBeInTheDocument();
    expect(screen.getByText("200 USD")).toBeInTheDocument();
  });

  it("renders range input element", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    const rangeInput = container.querySelector("input[type='range']");
    expect(rangeInput).toBeInTheDocument();
    expect(rangeInput).toBeDisabled();
  });

  it("uses default values when properties are not provided", () => {
    const comp: FormInputComponent = {
      id: "slider-2",
      name: "minimalSlider",
      type: "numeric-slider",
      category: "form",
      properties: {
        label: "Basic",
        showLabel: true,
      },
    };
    render(<NumericSlider component={comp} />);
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
    const hundreds = screen.getAllByText("100");
    expect(hundreds.length).toBeGreaterThanOrEqual(1);
  });

  it("renders without prefix and suffix", () => {
    const comp: FormInputComponent = {
      id: "slider-3",
      name: "noPrefixSuffix",
      type: "numeric-slider",
      category: "form",
      properties: {
        label: "No Prefix",
        showLabel: true,
        sliderMin: "5",
        sliderMax: "50",
        defaultValue: "25",
      },
    };
    render(<NumericSlider component={comp} />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("applies left alignment style", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: { ...baseComponent.properties, sliderValueAlignment: "left" },
    };
    const { container } = render(<NumericSlider component={comp} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.justifyContent).toBe("flex-start");
  });

  it("applies right alignment style", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        sliderValueAlignment: "right",
      },
    };
    const { container } = render(<NumericSlider component={comp} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.justifyContent).toBe("flex-end");
  });

  it("applies center alignment style", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.justifyContent).toBe("center");
  });

  it("applies font size and weight from properties", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.fontSize).toBe("32px");
    expect(selectedValue.style.fontWeight).toBe("700");
  });

  it("applies marginBottom gap when position is top", () => {
    const { container } = render(<NumericSlider component={baseComponent} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.marginBottom).toBe("12px");
  });

  it("applies marginTop gap when position is bottom", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        sliderValuePosition: "bottom",
      },
    };
    const { container } = render(<NumericSlider component={comp} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.marginTop).toBe("12px");
  });

  it("falls back to center for unknown alignment", () => {
    const comp: FormInputComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        sliderValueAlignment: "unknown",
      },
    };
    const { container } = render(<NumericSlider component={comp} />);
    const selectedValue = container.querySelector(
      "[class*='selectedValue']",
    ) as HTMLElement;
    expect(selectedValue.style.justifyContent).toBe("center");
  });

  it("uses min as defaultValue when defaultValue is not provided", () => {
    const comp: FormInputComponent = {
      id: "slider-4",
      name: "noDefaultSlider",
      type: "numeric-slider",
      category: "form",
      properties: {
        sliderMin: "20",
        sliderMax: "80",
      },
    };
    render(<NumericSlider component={comp} />);
    const twenties = screen.getAllByText("20");
    expect(twenties.length).toBeGreaterThanOrEqual(1);
  });

  it("renders with only prefix text", () => {
    const comp: FormInputComponent = {
      id: "slider-5",
      name: "prefixOnly",
      type: "numeric-slider",
      category: "form",
      properties: {
        sliderMin: "0",
        sliderMax: "100",
        sliderPrefixText: "$",
        defaultValue: "30",
      },
    };
    render(<NumericSlider component={comp} />);
    expect(screen.getByText("$ 30")).toBeInTheDocument();
    expect(screen.getByText("$ 0")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders with only suffix text", () => {
    const comp: FormInputComponent = {
      id: "slider-6",
      name: "suffixOnly",
      type: "numeric-slider",
      category: "form",
      properties: {
        sliderMin: "0",
        sliderMax: "100",
        sliderSuffixText: "%",
        defaultValue: "60",
      },
    };
    render(<NumericSlider component={comp} />);
    expect(screen.getByText("60 %")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100 %")).toBeInTheDocument();
  });
});
