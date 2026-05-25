import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from './ToggleSwitch';
import '@testing-library/jest-dom';

describe('ToggleSwitch Component', () => {
  test('renders with default props', () => {
    render(<ToggleSwitch />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
    expect(toggle).not.toBeDisabled();
    expect(toggle).toHaveAttribute('aria-label', 'toggle switch');
  });

  test('renders with custom id', () => {
    render(<ToggleSwitch id="custom-toggle" />);
    const toggle = screen.getByTestId('custom-toggle');
    expect(toggle).toBeInTheDocument();
  });

  test('renders with small size', () => {
    const { container } = render(<ToggleSwitch size="small" />);
    expect(container.querySelector('.switchSmall')).toBeInTheDocument();
  });

  test('renders with medium size', () => {
    const { container } = render(<ToggleSwitch size="medium" />);
    expect(container.querySelector('.switchMedium')).toBeInTheDocument();
  });

  test('renders with large size', () => {
    const { container } = render(<ToggleSwitch size="large" />);
    expect(container.querySelector('.switch')).toBeInTheDocument();
  });

  test('displays label when provided', () => {
    render(<ToggleSwitch label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('does not display label when not provided', () => {
    const { container } = render(<ToggleSwitch />);
    expect(container.querySelector('.label')).not.toBeInTheDocument();
  });

  test('renders checked when isToggled is true', () => {
    render(<ToggleSwitch isToggled={true} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  test('renders unchecked when isToggled is false', () => {
    render(<ToggleSwitch isToggled={false} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  test('renders disabled when disabled prop is true', () => {
    render(<ToggleSwitch disabled={true} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  test('renders enabled when disabled prop is false', () => {
    render(<ToggleSwitch disabled={false} />);
    expect(screen.getByRole('switch')).not.toBeDisabled();
  });

  test('calls onToggle when clicked', () => {
    const mockOnToggle = jest.fn();
    render(<ToggleSwitch onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  test('uses id from component props when no direct id provided', () => {
    const component = {
      properties: {
        id: 'component-id'
      }
    };
    render(<ToggleSwitch component={component} />);
    expect(screen.getByTestId('component-id')).toBeInTheDocument();
  });

  test('uses direct id over component id when both provided', () => {
    const component = {
      properties: {
        id: 'component-id'
      }
    };
    render(<ToggleSwitch id="direct-id" component={component} />);
    expect(screen.getByTestId('direct-id')).toBeInTheDocument();
  });

  test('uses isToggled from component props when no direct isToggled provided', () => {
    const component = {
      properties: {
        isToggled: true
      }
    };
    render(<ToggleSwitch component={component} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  test('uses direct isToggled over component isToggled when both provided', () => {
    const component = {
      properties: {
        isToggled: true
      }
    };
    render(<ToggleSwitch isToggled={false} component={component} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  test('uses disabled from component props when no direct disabled provided', () => {
    const component = {
      properties: {
        disabled: true
      }
    };
    render(<ToggleSwitch component={component} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  test('uses direct disabled over component disabled when both provided', () => {
    const component = {
      properties: {
        disabled: true
      }
    };
    render(<ToggleSwitch disabled={false} component={component} />);
    expect(screen.getByRole('switch')).not.toBeDisabled();
  });

  test('displays component label when showLabel is true and no direct label provided', () => {
    const component = {
      properties: {
        label: 'Component Label',
        showLabel: true
      }
    };
    render(<ToggleSwitch component={component} />);
    expect(screen.getByText('Component Label')).toBeInTheDocument();
  });

  test('does not display component label when showLabel is false', () => {
    const component = {
      properties: {
        label: 'Component Label',
        showLabel: false
      }
    };
    render(<ToggleSwitch component={component} />);
    expect(screen.queryByText('Component Label')).not.toBeInTheDocument();
  });

  test('uses direct label over component label when both provided', () => {
    const component = {
      properties: {
        label: 'Component Label',
        showLabel: true
      }
    };
    render(<ToggleSwitch label="Direct Label" component={component} />);
    expect(screen.getByText('Direct Label')).toBeInTheDocument();
    expect(screen.queryByText('Component Label')).not.toBeInTheDocument();
  });

  test('sets correct aria-label when no label is displayed', () => {
    render(<ToggleSwitch />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'toggle switch');
  });
});