import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { SkillDebugPanel } from "../SkillDebugPanel";

const mockFetchJson = (payload: unknown) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(payload) }),
  ) as unknown as typeof fetch;
};

describe("SkillDebugPanel", () => {
  it("shows a loading state before the knowledge base resolves", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<SkillDebugPanel />);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("renders compiled content and a plural entry count", async () => {
    mockFetchJson({ content: "# Skills", entries: [{ id: "a" }, { id: "b" }] });
    render(<SkillDebugPanel />);
    expect(await screen.findByText("2 skill entries compiled")).toBeTruthy();
    expect(screen.getByText("# Skills")).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith("/api/skill");
  });

  it("uses the singular form for exactly one entry", async () => {
    mockFetchJson({ content: "x", entries: [{ id: "a" }] });
    render(<SkillDebugPanel />);
    expect(await screen.findByText("1 skill entry compiled")).toBeTruthy();
  });

  it("falls back to zero entries and empty content when fields are missing", async () => {
    mockFetchJson({});
    render(<SkillDebugPanel />);
    expect(await screen.findByText("0 skill entries compiled")).toBeTruthy();
  });

  it("surfaces an API-reported error", async () => {
    mockFetchJson({ error: "kb offline" });
    render(<SkillDebugPanel />);
    expect(await screen.findByText(/Failed to load knowledge base: kb offline/)).toBeTruthy();
  });

  it("surfaces a network failure", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("boom"))) as unknown as typeof fetch;
    render(<SkillDebugPanel />);
    expect(await screen.findByText(/Failed to load knowledge base: boom/)).toBeTruthy();
  });

  it("ignores responses (success or failure) that arrive after unmount", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let resolve!: (v: unknown) => void;
    global.fetch = jest.fn(
      () => new Promise((r) => (resolve = r)),
    ) as unknown as typeof fetch;
    const { unmount } = render(<SkillDebugPanel />);
    unmount();
    resolve({ json: () => Promise.resolve({ error: "late" }) });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await Promise.resolve();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();

    global.fetch = jest.fn(() => Promise.reject(new Error("late"))) as unknown as typeof fetch;
    render(<SkillDebugPanel />).unmount();
    await Promise.resolve();
  });
});
