import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SuggestionPills } from "../SuggestionPills";

const items = [
  { id: "a", label: "Alpha", value: "do alpha" },
  { id: "b", label: "Beta", value: "do beta" },
];

describe("SuggestionPills", () => {
  it("renders nothing for an empty list", () => {
    const { container } = render(<SuggestionPills items={[]} onPick={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("sends the pill value (not its label) when clicked", () => {
    const onPick = jest.fn();
    render(<SuggestionPills items={items} onPick={onPick} label="Next" />);
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(onPick).toHaveBeenCalledWith("do beta");
    expect(screen.getByRole("group", { name: "Next" })).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
  });

  it("uses a default group label and disables pills when disabled", () => {
    render(<SuggestionPills items={items} onPick={jest.fn()} disabled />);
    expect(screen.getByRole("group", { name: "Suggestions" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Alpha" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
