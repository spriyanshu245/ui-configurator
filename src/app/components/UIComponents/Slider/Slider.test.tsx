import { render, screen, fireEvent } from "@testing-library/react";
import Slider from "./Slider";

describe("Slider Component", () => {
  it("calls onChange when range input value changes", () => {
    const handleChange = jest.fn();
    render(<Slider id="test-slider" value={50} onChange={handleChange} />);

    const rangeInput = screen.getByTestId("test-slider");
    fireEvent.change(rangeInput, { target: { value: "60" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(60);
  });

  it("calls onChange when number input value changes", () => {
    const handleChange = jest.fn();
    render(<Slider id="test-slider" value={50} onChange={handleChange} />);

    const numberInput = screen.getByRole("spinbutton");
    fireEvent.change(numberInput, { target: { value: "70" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(70);
  });

  it("does not call onChange when number input exceeds max value", () => {
    const handleChange = jest.fn();
    render(
      <Slider id="test-slider" value={50} max={100} onChange={handleChange} />
    );

    const numberInput = screen.getByRole("spinbutton");
    fireEvent.change(numberInput, { target: { value: "150" } });

    expect(handleChange).not.toHaveBeenCalled();
  });
});
