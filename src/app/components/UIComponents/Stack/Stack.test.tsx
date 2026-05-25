import { render, screen } from "@testing-library/react";
import Stack from "./Stack";
import { StackComponent } from "@/app/types/types";
import { useStack } from "@/app/hooks/useStack";

jest.mock("@/app/hooks/useStack");
jest.mock("../../ComponentRenderer/ComponentRenderer", () => ({
  __esModule: true,
  default: ({ component }: any) => (
    <div data-testid={`component-${component.id}`}>
      ComponentRenderer: {component.id}
    </div>
  ),
}));

jest.mock("../../FormElementDropZone/FormElementDropZone", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="form-dropzone" {...props}>
      Form Dropzone
    </div>
  ),
}));

jest.mock("../../ComponentDropZone/ComponentDropZone", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="component-dropzone" {...props}>
      Component Dropzone
    </div>
  ),
}));

const mockedUseStack = useStack as jest.Mock;

describe("Stack - Happy Path", () => {
  beforeEach(() => {
    mockedUseStack.mockReturnValue({
      columnGap: 16,
      gridTemplateColumns: "1fr 1fr",
      components: [
        { id: "child-1", type: "text", category: "basic", children: [] },
        { id: "child-2", type: "input", category: "form", children: [] },
      ],
      shouldRenderDropZone: true,
      getDropZoneProps: () => ({ "data-testid": "mock-dropzone" }),
    });
  });

  it("should render child components and FormElementDropZone", () => {
    const mockComponent: StackComponent = {
      id: "stack-1",
      category: "form",
      type: "stack",
      properties: {
        padding: 10,
      },
    };

    render(<Stack component={mockComponent} />);

    const container = screen.getByTestId("stack-1");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      display: "flex",
    });

    expect(screen.getByTestId("component-child-1")).toBeInTheDocument();
    expect(screen.getByTestId("component-child-2")).toBeInTheDocument();

    expect(screen.getByTestId("mock-dropzone")).toBeInTheDocument();
  });

  it("renders ComponentDropZone for non-form category", () => {
    const component: StackComponent = {
      id: "stack-1",
      type: "stack",
      category: "layout",
      properties: {},
      components: [],
    };

    mockedUseStack.mockReturnValue({
      columnGap: 12,
      gridTemplateColumns: "1fr",
      components: [],
      shouldRenderDropZone: true,
      getDropZoneProps: () => ({}),
    });

    render(<Stack component={component} />);
    expect(screen.getByTestId("component-dropzone")).toBeInTheDocument();
  });

  it("should apply grid styles when hasFixedColumns is true", () => {
    const mockComponent: StackComponent = {
      id: "stack-grid",
      category: "layout",
      type: "stack",
      properties: {
        hasFixedColumns: true,
        padding: 10,
      },
    };

    mockedUseStack.mockReturnValue({
      columnGap: 16,
      gridTemplateColumns: "1fr 1fr 1fr",
      components: [],
      shouldRenderDropZone: true,
      getDropZoneProps: () => ({ "data-testid": "mock-dropzone" }),
    });

    render(<Stack component={mockComponent} />);

    const container = screen.getByTestId("stack-grid");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
    });
  });

  it("should apply independent padding when independentPadding is true", () => {
    const mockComponent: StackComponent = {
      id: "stack-padding",
      category: "layout",
      type: "stack",
      properties: {
        independentPadding: true,
        paddingTop: 5,
        paddingRight: 10,
        paddingBottom: 15,
        paddingLeft: 20,
      },
    };

    mockedUseStack.mockReturnValue({
      columnGap: 16,
      gridTemplateColumns: "1fr",
      components: [],
      shouldRenderDropZone: true,
      getDropZoneProps: () => ({ "data-testid": "mock-dropzone" }),
    });

    render(<Stack component={mockComponent} />);

    const container = screen.getByTestId("stack-padding");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      padding: "5px 10px 15px 20px",
    });
  });
});
