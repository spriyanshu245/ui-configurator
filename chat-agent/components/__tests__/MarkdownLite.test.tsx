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

  it.each([
    ["# One", "H3"],
    ["## Two", "H4"],
    ["###### Six", "H6"],
  ])("maps %j to a %s (offset so chat headings stay small)", (md, tag) => {
    render(<MarkdownLite text={md} />);
    expect(screen.getByRole("heading").tagName).toBe(tag);
  });

  it("renders nothing for empty text", () => {
    const { container } = render(<MarkdownLite text="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders blockquotes (grouping consecutive lines) and horizontal rules", () => {
    const md = ["> first", "> second", "", "---", "after"].join("\n");
    const { container } = render(<MarkdownLite text={md} />);
    expect(container.querySelector("blockquote")?.textContent).toBe("first\nsecond");
    expect(container.querySelectorAll("hr")).toHaveLength(1);
    expect(screen.getByText("after")).toBeTruthy();
  });

  it("keeps ordered and unordered lists apart and strips markers", () => {
    const md = ["1) one", "2) two", "- bullet", "+ plus"].join("\n");
    const { container } = render(<MarkdownLite text={md} />);
    expect([...container.querySelectorAll("ol li")].map((li) => li.textContent)).toEqual(["one", "two"]);
    expect([...container.querySelectorAll("ul li")].map((li) => li.textContent)).toEqual(["bullet", "plus"]);
  });

  it("joins consecutive lines into one paragraph and splits on blank lines (CRLF tolerated)", () => {
    const { container } = render(<MarkdownLite text={"line one\r\nline two\r\n\r\nnext"} />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe("line one\nline two");
  });

  it("ends a paragraph when a block starts and tolerates an unterminated code fence", () => {
    const { container } = render(<MarkdownLite text={["intro", "```", "never closed"].join("\n")} />);
    expect(container.querySelector("p")?.textContent).toBe("intro");
    expect(container.querySelector("pre code")?.textContent).toBe("never closed");
    expect(container.querySelector("pre code")?.getAttribute("data-lang")).toBeNull();
  });

  it("fills missing table cells and supports alignment separators and inline markup in cells", () => {
    const md = ["| A | B |", "|:--|--:|", "| **x** |", "| y | `z` |"].join("\n");
    render(<MarkdownLite text={md} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("x").tagName).toBe("STRONG");
    expect(screen.getByText("z").tagName).toBe("CODE");
    expect(screen.getAllByRole("cell")).toHaveLength(4);
  });

  it("supports alternate emphasis markers and does not parse markup inside inline code", () => {
    render(<MarkdownLite text={"__bold__ and _it_ and `**not bold**`"} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("it").tagName).toBe("EM");
    expect(screen.getByText("**not bold**").tagName).toBe("CODE");
  });
});
