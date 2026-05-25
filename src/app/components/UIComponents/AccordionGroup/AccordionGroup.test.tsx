import { render, screen } from "@testing-library/react";
import AccordionGroup from "./AccordionGroup";
import { AccordionGroupComponent } from "@/app/types/types";

describe("AccordionGroup", () => {
  const mockItems = [
    {
      id: "1",
      title: "First Item",
      description: "First description",
    },
    {
      id: "2",
      title: "Second Item",
      description: "Second description",
    },
    {
      id: "3",
      title: "Third Item",
      description: "Third description",
    },
  ];

  const createMockComponent = (
    overrides?: Partial<AccordionGroupComponent["properties"]>,
  ): AccordionGroupComponent => ({
    id: "test-accordion",
    type: "accordionGroup",
    category: "ui",
    displayName: "Accordion Group",
    properties: {
      items: mockItems,
      showNumbering: false,
      autoOpenFirst: false,
      ...overrides,
    },
  });

  test("renders accordion group with items", () => {
    const component = createMockComponent();
    render(<AccordionGroup component={component} />);

    expect(screen.getByText("First Item")).toBeInTheDocument();
    expect(screen.getByText("Second Item")).toBeInTheDocument();
    expect(screen.getByText("Third Item")).toBeInTheDocument();
  });

  test("displays numbering when showNumbering is true", () => {
    const component = createMockComponent({ showNumbering: true });
    render(<AccordionGroup component={component} />);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("3.")).toBeInTheDocument();
  });

  test("does not display numbering when showNumbering is false", () => {
    const component = createMockComponent({ showNumbering: false });
    render(<AccordionGroup component={component} />);

    expect(screen.queryByText("1.")).not.toBeInTheDocument();
    expect(screen.queryByText("2.")).not.toBeInTheDocument();
    expect(screen.queryByText("3.")).not.toBeInTheDocument();
  });

  test("auto opens first item when autoOpenFirst is true", () => {
    const component = createMockComponent({ autoOpenFirst: true });
    render(<AccordionGroup component={component} />);

    expect(screen.getByText("First description")).toBeInTheDocument();
  });

  test("does not auto open first item when autoOpenFirst is false", () => {
    const component = createMockComponent({ autoOpenFirst: false });
    render(<AccordionGroup component={component} />);

    expect(screen.queryByText("First description")).not.toBeInTheDocument();
  });

  test("renders all chevron icons for each item", () => {
    const component = createMockComponent();
    const { container } = render(<AccordionGroup component={component} />);

    const chevrons = container.querySelectorAll("svg");
    expect(chevrons).toHaveLength(3);
  });

  test("applies open class to first item when autoOpenFirst is true", () => {
    const component = createMockComponent({ autoOpenFirst: true });
    const { container } = render(<AccordionGroup component={component} />);

    const firstItem = container.querySelector(".item");
    expect(firstItem).toHaveClass("itemOpen");
  });

  test("does not apply open class to items when autoOpenFirst is false", () => {
    const component = createMockComponent({ autoOpenFirst: false });
    const { container } = render(<AccordionGroup component={component} />);

    const items = container.querySelectorAll(".itemOpen");
    expect(items).toHaveLength(0);
  });

  test("renders correctly with empty items array", () => {
    const component = createMockComponent({ items: [] });
    const { container } = render(<AccordionGroup component={component} />);

    expect(container.querySelector(".list")).toBeInTheDocument();
    expect(container.querySelectorAll(".item")).toHaveLength(0);
  });

  test("renders correctly with undefined items", () => {
    const component = createMockComponent({ items: undefined });
    const { container } = render(<AccordionGroup component={component} />);

    expect(container.querySelector(".list")).toBeInTheDocument();
  });

  test("renders item without description", () => {
    const itemsWithoutDesc = [
      {
        id: "1",
        title: "Item without description",
        description: "",
      },
    ];
    const component = createMockComponent({
      items: itemsWithoutDesc,
      autoOpenFirst: true,
    });
    const { container } = render(<AccordionGroup component={component} />);

    expect(screen.getByText("Item without description")).toBeInTheDocument();
    expect(container.querySelector(".itemDescription")).not.toBeInTheDocument();
  });

  test("renders chevron with open class when item is open", () => {
    const component = createMockComponent({ autoOpenFirst: true });
    const { container } = render(<AccordionGroup component={component} />);

    const chevron = container.querySelector(".chevron");
    expect(chevron).toHaveClass("chevronOpen");
  });

  test("renders chevron without open class when item is closed", () => {
    const component = createMockComponent({ autoOpenFirst: false });
    const { container } = render(<AccordionGroup component={component} />);

    const firstChevron = container.querySelector(".chevron");
    expect(firstChevron).not.toHaveClass("chevronOpen");
  });

  test("renders all item parts correctly", () => {
    const component = createMockComponent({ showNumbering: true });
    const { container } = render(<AccordionGroup component={component} />);

    const itemHeaders = container.querySelectorAll(".itemHeader");
    const itemNumbers = container.querySelectorAll(".itemNumber");
    const itemTitles = container.querySelectorAll(".itemTitle");

    expect(itemHeaders).toHaveLength(3);
    expect(itemNumbers).toHaveLength(3);
    expect(itemTitles).toHaveLength(3);
  });

  test("shows description only for first item when autoOpenFirst is true", () => {
    const component = createMockComponent({ autoOpenFirst: true });
    render(<AccordionGroup component={component} />);

    expect(screen.getByText("First description")).toBeInTheDocument();
    expect(screen.queryByText("Second description")).not.toBeInTheDocument();
    expect(screen.queryByText("Third description")).not.toBeInTheDocument();
  });

  test("renders with both showNumbering and autoOpenFirst enabled", () => {
    const component = createMockComponent({
      showNumbering: true,
      autoOpenFirst: true,
    });
    render(<AccordionGroup component={component} />);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("First Item")).toBeInTheDocument();
    expect(screen.getByText("First description")).toBeInTheDocument();
  });
});
