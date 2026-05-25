import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import Typograph from "./Typograph";

describe("Typograph Component", () => {
  const defaultComponent = {
    id: "test-id",
    type: "typograph",
    properties: {},
  };

  test("renders with default properties", () => {
    render(<Typograph component={defaultComponent} />);
    const element = screen.getByText("Typograph");
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({
      textAlign: "left",
      color: "#000000",
      width: "100%",
      fontSize: "12px",
    });
  });

  test("renders with custom text", () => {
    const component = {
      ...defaultComponent,
      properties: { text: "Custom Text" },
    };
    render(<Typograph component={component} />);
    expect(screen.getByText("Custom Text")).toBeInTheDocument();
  });

  test("applies custom text alignment", () => {
    const component = {
      ...defaultComponent,
      properties: { textAlign: "center" },
    };
    render(<Typograph component={component} />);
    expect(screen.getByText("Typograph")).toHaveStyle({ textAlign: "center" });
  });

  test("applies custom text color", () => {
    const component = {
      ...defaultComponent,
      properties: { textColor: "#FF0000" },
    };
    render(<Typograph component={component} />);
    expect(screen.getByText("Typograph")).toHaveStyle({ color: "#FF0000" });
  });

  test("applies custom width", () => {
    const component = {
      ...defaultComponent,
      properties: { width: 50 },
    };
    render(<Typograph component={component} />);
    expect(screen.getByText("Typograph")).toHaveStyle({ width: "50%" });
  });

  test("applies custom text size", () => {
    const component = {
      ...defaultComponent,
      properties: { textSize: "16px" },
    };
    render(<Typograph component={component} />);
    expect(screen.getByText("Typograph")).toHaveStyle({ fontSize: "16px" });
  });

  test("applies multiple custom properties", () => {
    const component = {
      ...defaultComponent,
      properties: {
        text: "Custom Text",
        textAlign: "right",
        textColor: "#0000FF",
        width: 75,
        textSize: "20px",
      },
    };
    render(<Typograph component={component} />);
    const element = screen.getByText("Custom Text");
    expect(element).toHaveStyle({
      textAlign: "right",
      color: "#0000FF",
      width: "75%",
      fontSize: "20px",
    });
  });

  // Rich Text Editor Tests
  test("renders as div when isRichTextEditor is true", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor: "<p>Rich text content</p>",
      },
    };
    const { container } = render(<Typograph component={component} />);
    const divElement = container.querySelector("div#test-id");
    expect(divElement).toBeInTheDocument();
    expect(divElement?.tagName).toBe("DIV");
  });

  test("renders HTML content with dangerouslySetInnerHTML", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor: "<p>Hello <strong>World</strong></p>",
      },
    };
    const { container } = render(<Typograph component={component} />);
    expect(screen.getByText("Hello", { exact: false })).toBeInTheDocument();
    const strongElement = container.querySelector("strong");
    expect(strongElement).toHaveTextContent("World");
  });

  test("renders rich text with links", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor: '<p><a href="test.com">Click here</a></p>',
      },
    };
    const { container } = render(<Typograph component={component} />);
    const linkElement = container.querySelector("a");
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "test.com");
    expect(linkElement).toHaveTextContent("Click here");
  });

  test("renders rich text with multiple headings and links", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor:
          '<p><a href="test.com">Start typing here...</a>Some text</p><h1>Heading 1</h1><p><a href="http://test.com">Link 2</a></p><h2><a href="test.com">Heading 2 Link</a></h2>',
      },
    };
    const { container } = render(<Typograph component={component} />);

    // Check for headings
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Heading 1"
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Heading 2 Link"
    );

    // Check for links
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "test.com");
    expect(links[1]).toHaveAttribute("href", "http://test.com");
  });

  test("applies common styles to rich text editor content", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor: "<p>Styled rich text</p>",
        textAlign: "center",
        textColor: "#FF0000",
        width: 80,
        textSize: "18px",
      },
    };
    const { container } = render(<Typograph component={component} />);
    const divElement = container.querySelector("div#test-id");
    expect(divElement).toHaveStyle({
      textAlign: "center",
      color: "#FF0000",
      width: "80%",
      fontSize: "18px",
    });
  });

  test("renders paragraph when isRichTextEditor is false", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: false,
        richTextEditor: "<p>This should not render</p>",
        text: "Plain text",
      },
    };
    const { container } = render(<Typograph component={component} />);
    const paragraphElement = container.querySelector("p#test-id");
    expect(paragraphElement).toBeInTheDocument();
    expect(paragraphElement).toHaveTextContent("Plain text");
    expect(
      screen.queryByText("This should not render")
    ).not.toBeInTheDocument();
  });

  test("renders empty rich text editor content", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor: "",
      },
    };
    const { container } = render(<Typograph component={component} />);
    const divElement = container.querySelector("div#test-id");
    expect(divElement).toBeInTheDocument();
    expect(divElement).toBeEmptyDOMElement();
  });

  test("renders complex HTML structure with nested elements", () => {
    const component = {
      ...defaultComponent,
      properties: {
        isRichTextEditor: true,
        richTextEditor:
          "<div><p>Paragraph 1</p><ul><li>Item 1</li><li>Item 2</li></ul></div>",
      },
    };
    const { container } = render(<Typograph component={component} />);
    expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(2);
  });
});
