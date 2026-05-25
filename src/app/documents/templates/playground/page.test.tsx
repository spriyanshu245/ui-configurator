import { render, screen } from "@testing-library/react";
import PlaygroundPage from "./page";

jest.mock("./components/PlaygroundTemplateDesigner", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="playground-designer">PlaygroundTemplateDesigner</div>
  ),
}));

describe("PlaygroundPage", () => {
  it("should render PlaygroundTemplateDesigner", () => {
    render(<PlaygroundPage />);
    expect(screen.getByTestId("playground-designer")).toBeInTheDocument();
  });
});
