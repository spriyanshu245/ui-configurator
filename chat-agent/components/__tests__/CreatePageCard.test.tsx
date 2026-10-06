import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CreatePageCard } from "../CreatePageCard";

const setup = (overrides: Partial<React.ComponentProps<typeof CreatePageCard>> = {}) => {
  const onCreate = jest.fn().mockResolvedValue(undefined);
  const onCancel = jest.fn();
  const utils = render(
    <CreatePageCard
      micrositeId="ms1"
      suggestedName="Customer Banks"
      purpose="List banks"
      toolCallId="tc1"
      onCreate={onCreate}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onCreate, onCancel, ...utils };
};

describe("CreatePageCard", () => {
  it("pre-fills the suggested name and shows the purpose", () => {
    setup();
    expect((screen.getByLabelText("Page name") as HTMLInputElement).value).toBe("Customer Banks");
    expect(screen.getByText("List banks")).toBeTruthy();
  });

  it("creates with the trimmed name, popup flag and tool call id, then dismisses", async () => {
    const { onCreate, container } = setup();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "  Banks  " } });
    fireEvent.click(screen.getByLabelText(/open as popup/i));
    expect(screen.getByText(/right-aligned/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Create page" }));

    await waitFor(() => expect(container.firstChild).toBeNull());
    expect(onCreate).toHaveBeenCalledWith("ms1", "Banks", true, "tc1");
  });

  it("submits on Enter but ignores other keys", async () => {
    const { onCreate } = setup();
    const input = screen.getByLabelText("Page name");
    fireEvent.keyDown(input, { key: "a" });
    expect(onCreate).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
  });

  it("disables Create for a blank name and never calls onCreate", () => {
    const { onCreate } = setup({ suggestedName: "" });
    const create = screen.getByRole("button", { name: "Create page" }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.keyDown(screen.getByLabelText("Page name"), { key: "Enter" });
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("shows a busy state and locks Cancel while creating", async () => {
    let finish!: () => void;
    const onCreate = jest.fn(() => new Promise<void>((r) => (finish = r)));
    render(
      <CreatePageCard micrositeId="m" suggestedName="X" onCreate={onCreate} onCancel={jest.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));
    expect(await screen.findByRole("button", { name: "Creating…" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      finish();
    });
  });

  it("calls onCancel and dismisses on Cancel", () => {
    const { onCancel, container } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });
});
