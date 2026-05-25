import { render, screen } from "@testing-library/react";
import OperationProgressModal from "./OperationProgressModal";
import { OperationProgress } from "@/app/utils/micrositeOrchestration";

jest.mock("@/app/components/OperationProgress/OperationProgress", () => ({
  __esModule: true,
  default: ({ progress }: { progress: OperationProgress }) => (
    <div data-testid="operation-progress">
      <span data-testid="progress-label">{progress.label}</span>
      <span data-testid="progress-current">{progress.current}</span>
      <span data-testid="progress-total">{progress.total}</span>
    </div>
  ),
}));

const mockProgress: OperationProgress = {
  phase: "creating-pages",
  label: "Creating pages...",
  current: 2,
  total: 5,
  detail: "page-1",
};

describe("OperationProgressModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <OperationProgressModal
        isOpen={false}
        title="Operation in Progress"
        progress={mockProgress}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when progress is null", () => {
    const { container } = render(
      <OperationProgressModal
        isOpen={true}
        title="Operation in Progress"
        progress={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when both isOpen is false and progress is null", () => {
    const { container } = render(
      <OperationProgressModal
        isOpen={false}
        title="Operation in Progress"
        progress={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the modal when isOpen is true and progress is provided", () => {
    render(
      <OperationProgressModal
        isOpen={true}
        title="Operation in Progress"
        progress={mockProgress}
      />,
    );
    expect(screen.getByTestId("operation-progress-modal")).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(
      <OperationProgressModal
        isOpen={true}
        title="Duplicating Microsite"
        progress={mockProgress}
      />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Duplicating Microsite",
    );
  });

  it("displays description when provided", () => {
    render(
      <OperationProgressModal
        isOpen={true}
        title="Operation in Progress"
        description="Please wait while the operation completes."
        progress={mockProgress}
      />,
    );
    expect(
      screen.getByText("Please wait while the operation completes."),
    ).toBeInTheDocument();
  });

  it("does not render description element when description is not provided", () => {
    render(
      <OperationProgressModal
        isOpen={true}
        title="Operation in Progress"
        progress={mockProgress}
      />,
    );
    expect(screen.queryByText(/please wait/i)).not.toBeInTheDocument();
  });

  it("renders the OperationProgress child component", () => {
    render(
      <OperationProgressModal
        isOpen={true}
        title="Operation in Progress"
        progress={mockProgress}
      />,
    );
    expect(screen.getByTestId("operation-progress")).toBeInTheDocument();
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Creating pages...",
    );
    expect(screen.getByTestId("progress-current")).toHaveTextContent("2");
    expect(screen.getByTestId("progress-total")).toHaveTextContent("5");
  });
});
