/**
 * @jest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MarkdownLite } from "../MarkdownLite";

describe("MarkdownLite", () => {
  it("renders a GFM table with headers and rows", () => {
    const md = [
      "| LAN | Tenure |",
      "| --- | --- |",
      "| L001 | 12 |",
      "| L002 | 24 |",
    ].join("\n");
    render(<MarkdownLite text={md} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "LAN" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tenure" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "L001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "24" })).toBeInTheDocument();
  });

  it("renders a fenced code block preserving content", () => {
    const md = ["```json", '{ "a": 1 }', "```"].join("\n");
    const { container } = render(<MarkdownLite text={md} />);
    const code = container.querySelector("pre code");
    expect(code).toBeTruthy();
    expect(code?.textContent).toBe('{ "a": 1 }');
    expect(code?.getAttribute("data-lang")).toBe("json");
  });

  it("renders inline bold, italic and inline code", () => {
    render(<MarkdownLite text={"This is **bold**, *italic* and `code` here."} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("renders a safe link with target/rel and drops unsafe schemes", () => {
    render(
      <MarkdownLite
        text={"See [docs](https://example.com) and [bad](javascript:alert(1))."}
      />,
    );
    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // Unsafe link becomes plain text — no anchor rendered for it.
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
    expect(screen.getByText(/bad/)).toBeInTheDocument();
  });

  it("renders unordered and ordered lists", () => {
    const md = ["- one", "- two", "", "1. first", "2. second"].join("\n");
    const { container } = render(<MarkdownLite text={md} />);
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("renders a heading", () => {
    render(<MarkdownLite text={"# Title here"} />);
    expect(screen.getByText("Title here").tagName).toMatch(/^H[1-6]$/);
  });
});
