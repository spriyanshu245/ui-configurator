import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RollbackPanel } from "../RollbackPanel";

const history = [
  { id: "h1", description: "First change", createdAt: "2024-01-01T00:00:00Z" },
  { id: "h2", description: "Second change", createdAt: "2024-01-02T00:00:00Z" },
];

const setup = (onRollback = jest.fn().mockResolvedValue(undefined)) => {
  const utils = render(
    <RollbackPanel history={history} micrositeId="ms" pagePath="home" onRollback={onRollback} />,
  );
  return { onRollback, ...utils };
};

describe("RollbackPanel", () => {
  it("shows an empty message when there is no history", () => {
    render(<RollbackPanel history={[]} micrositeId="ms" pagePath="home" onRollback={jest.fn()} />);
    expect(screen.getByText("No history available.")).toBeTruthy();
  });

  it("exposes the microsite and page as data attributes", () => {
    const { container } = setup();
    const root = container.firstChild as HTMLElement;
    expect(root.dataset.micrositeId).toBe("ms");
    expect(root.dataset.pagePath).toBe("home");
  });

  it("asks for confirmation, then reverts the chosen entry", async () => {
    let finish!: () => void;
    const onRollback = jest.fn(() => new Promise<void>((r) => (finish = r)));
    setup(onRollback);
    fireEvent.click(screen.getAllByText("Rollback to here")[1]);
    expect(screen.getByText("Confirm revert?")).toBeTruthy();
    expect(onRollback).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Yes, revert"));
    expect(await screen.findByText("Reverting...")).toBeTruthy();
    // Other rows are locked while a revert is in flight.
    expect((screen.getAllByText("Rollback to here")[0] as HTMLButtonElement).disabled).toBe(true);

    finish();
    await waitFor(() => expect(screen.queryByText("Confirm revert?")).toBeNull());
    expect(onRollback).toHaveBeenCalledWith("h2");
  });

  it("returns to the idle state when the confirmation is cancelled", () => {
    const { onRollback } = setup();
    fireEvent.click(screen.getAllByText("Rollback to here")[0]);
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm revert?")).toBeNull();
    expect(onRollback).not.toHaveBeenCalled();
  });
});
