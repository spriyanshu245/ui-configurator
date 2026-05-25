import {render, screen, fireEvent} from "@testing-library/react";
import Card from "./Card";

jest.mock("../SVGIcons/ArrowFancyRight", () => 
  jest.fn(() => <svg data-testid="arrow-fancy-right-icon" />)
);
jest.mock("../SVGIcons/Microsite", () => 
  jest.fn(() => <svg data-testid="microsite-icon" />)
);
jest.mock("../SVGIcons/Rules", () => 
  jest.fn(() => <svg data-testid="rules-icon" />)
);
jest.mock("../SVGIcons/Workflow", () => 
  jest.fn(() => <svg data-testid="workflow-icon" />)
);

describe("Card Component", () => {
  const defaultProps = {
    title: "Test Card",
    description: "This is a test description"
  };

  it("renders card with title and description", () => {
    render(<Card {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it("renders arrow icon when not in coming soon state", () => {
    render(<Card {...defaultProps} />);

    expect(screen.getByTestId("arrow-fancy-right-icon")).toBeInTheDocument();
  });

  it.each([
    ['microsite', 'microsite-icon'],
    ['workflow', 'workflow-icon'],
    ['rules', 'rules-icon']
  ])('renders correct icon when icon prop is %s', (iconName, testId) => {
    render(<Card {...defaultProps} icon={iconName} />);
    
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('does not render any icon when icon prop is not provided', () => {
    render(<Card {...defaultProps} />);
    
    expect(screen.queryByTestId('microsite-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('workflow-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rules-icon')).not.toBeInTheDocument();
  });

  it('renders coming soon label when comingSoon prop is true', () => {
    render(<Card {...defaultProps} comingSoon={true} />);
    
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByTestId('arrow-fancy-right-icon')).not.toBeInTheDocument();
  });

  it('applies disabled class when comingSoon prop is true', () => {
    const { container } = render(<Card {...defaultProps} comingSoon={true} />);
    
    expect(container.firstChild).toHaveClass('disabled');
    expect(container.firstChild).not.toHaveClass('clickable');
  });

  it('applies clickable class when comingSoon prop is false', () => {
    const { container } = render(<Card {...defaultProps} comingSoon={false} />);
    
    expect(container.firstChild).toHaveClass('clickable');
    expect(container.firstChild).not.toHaveClass('disabled');
  });
  
  it('calls onClick handler when card is clicked and not in coming soon state', () => {
    const onClickMock = jest.fn();
    render(<Card {...defaultProps} onClickHandler={onClickMock} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick handler when comingSoon is true', () => {
    const onClickMock = jest.fn();
    render(<Card {...defaultProps} onClickHandler={onClickMock} comingSoon={true} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).not.toHaveBeenCalled();
  });

  it('card works without onClickHandler prop', () => {
    render(<Card {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button'));
  });

  it('card has correct accessibility attributes', () => {
    render(<Card {...defaultProps} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

})