import { render, screen } from "@testing-library/react";
import ListPageHeader from "./ListPageHeader";

jest.mock("@/app/components/SVGIcons/All", () => ({
  __esModule: true,
  default: () => <span data-testid="all-icon">AllIcon</span>,
}));

describe("ListPageHeader", () => {
  it("renders the title", () => {
    render(
      <ListPageHeader title="Test Title">
        <button>Action</button>
      </ListPageHeader>,
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders children in page actions area", () => {
    render(
      <ListPageHeader title="Test Title">
        <button data-testid="action-btn">Action</button>
      </ListPageHeader>,
    );
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("renders default AllIcon when no icon prop provided", () => {
    render(
      <ListPageHeader title="Test Title">
        <button>Action</button>
      </ListPageHeader>,
    );
    expect(screen.getByTestId("all-icon")).toBeInTheDocument();
  });

  it("renders custom icon when icon prop provided", () => {
    render(
      <ListPageHeader
        title="Test Title"
        icon={<span data-testid="custom-icon">Custom</span>}
      >
        <button>Action</button>
      </ListPageHeader>,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("all-icon")).not.toBeInTheDocument();
  });

  it("renders the heading as h1", () => {
    render(
      <ListPageHeader title="My Heading">
        <button>Action</button>
      </ListPageHeader>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "My Heading",
    );
  });

  it("renders multiple children", () => {
    render(
      <ListPageHeader title="Test Title">
        <button data-testid="btn-1">One</button>
        <button data-testid="btn-2">Two</button>
      </ListPageHeader>,
    );
    expect(screen.getByTestId("btn-1")).toBeInTheDocument();
    expect(screen.getByTestId("btn-2")).toBeInTheDocument();
  });
});
