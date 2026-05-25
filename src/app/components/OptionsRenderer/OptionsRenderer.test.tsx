import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionsRenderer } from './OptionsRenderer'; // Adjust the import path as needed
import { Options } from "@/app/types/types";
import { toPascalCase } from "@/app/utils/utils";

// Mock the toPascalCase utility function
jest.mock("@/app/utils/utils", () => ({
  toPascalCase: jest.fn((text) => `MOCKED_${text.toUpperCase()}`),
}));

describe('OptionsRenderer', () => {
  // Define common props that will be used across tests
  const mockStyles = {
    componentProperty: 'componentProperty',
    column: 'column',
    propertyLabel: 'propertyLabel',
    listItem: 'listItem',
    textInput: 'textInput',
  };

  const mockSetOptions = jest.fn();

  const defaultProps = {
    setOptions: mockSetOptions,
    property: 'test-property',
    type: 'radio-group',
    options: [
      { label: 'Option 1', value: 'option-1' },
      { label: 'Option 2', value: 'option-2' }
    ],
    styles: mockStyles,
    id: 'test-options-renderer'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders component with options', () => {
    render(<OptionsRenderer {...defaultProps} />);

    // Check if the component rendered correctly
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByTestId('test-options-renderer')).toBeInTheDocument();

    // Check if options are rendered
    expect(screen.getByTestId('test-options-renderer-label-1')).toHaveValue('Option 1');
    expect(screen.getByTestId('test-options-renderer-label-2')).toHaveValue('Option 2');

    // Check if "Add Option" button is rendered
    expect(screen.getByTestId('test-options-renderer-addOption')).toBeInTheDocument();
  });

  it('renders component without options when none are provided', () => {
    render(
      <OptionsRenderer
        {...defaultProps}
        options={undefined as unknown as Options}
      />
    );

    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByTestId('test-options-renderer-addOption')).toBeInTheDocument();

    // No options should be rendered
    expect(screen.queryByTestId('test-options-renderer-label-1')).not.toBeInTheDocument();
  });

  it('renders with empty options array', () => {
    render(
      <OptionsRenderer
        {...defaultProps}
        options={[]}
      />
    );

    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByTestId('test-options-renderer-addOption')).toBeInTheDocument();

    // No options should be rendered
    expect(screen.queryByTestId('test-options-renderer-label-1')).not.toBeInTheDocument();
  });

  it('updates option label when input changes', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const labelInput = screen.getByTestId('test-options-renderer-label-1');
    fireEvent.change(labelInput, { target: { value: 'New Label' } });

    expect(mockSetOptions).toHaveBeenCalledWith(
      [
        { label: 'New Label', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' }
      ],
      'test-property'
    );
  });

  it('updates option value when input changes', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const valueInputs = screen.getAllByPlaceholderText('Value');
    fireEvent.change(valueInputs[0], { target: { value: 'new-value-1' } });

    expect(mockSetOptions).toHaveBeenCalledWith(
      [
        { label: 'Option 1', value: 'new-value-1' },
        { label: 'Option 2', value: 'option-2' }
      ],
      'test-property'
    );
  });

  it('adds new option when "Add Option" button is clicked', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const addButton = screen.getByTestId('test-options-renderer-addOption');
    fireEvent.click(addButton);

    expect(mockSetOptions).toHaveBeenCalledWith(
      [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: '', value: 'option-3' }
      ],
      'test-property'
    );
  });

  it('deletes an option when delete button is clicked', () => {
    const mockProps = {
      ...defaultProps,
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: 'Option 3', value: 'option-3' }
      ],
    }
    render(<OptionsRenderer {...mockProps} />);

    const deleteButtons = screen.getAllByTestId(/^deleteOption-\d+$/);
    fireEvent.click(deleteButtons[0]);

    expect(mockSetOptions).toHaveBeenCalledWith(
      [mockProps.options[1], mockProps.options[2]],
      'test-property'
    );
  });

  it('prevents deletion when only two options remain for radio-group', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId(/deleteOption-\d+/);

    // Check if delete buttons are disabled
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeDisabled();

    // Verify that clicking on a disabled button doesn't call setOptions
    fireEvent.click(deleteButtons[0]);
    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  it('allows deletion when more than two options exist for radio-group', () => {
    const propsWithMoreOptions = {
      ...defaultProps,
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: 'Option 3', value: 'option-3' }
      ]
    };

    render(<OptionsRenderer {...propsWithMoreOptions} />);

    const deleteButtons = screen.getAllByTestId(/deleteOption-\d+/);

    // Check if delete buttons are enabled
    expect(deleteButtons[0]).not.toBeDisabled();

    // Verify that clicking calls setOptions
    fireEvent.click(deleteButtons[0]);
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it('prevents deletion when only one option remains for checkbox-group', () => {
    const checkboxProps = {
      ...defaultProps,
      type: 'checkbox-group',
      options: [{ label: 'Option 1', value: 'option-1' }]
    };

    render(<OptionsRenderer {...checkboxProps} />);

    const deleteButton = screen.getByTestId('deleteOption-1');
    expect(deleteButton).toBeDisabled();

    fireEvent.click(deleteButton);
    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  it('allows deletion for checkbox-group when more than one option exists', () => {
    const checkboxProps = {
      ...defaultProps,
      type: 'checkbox-group',
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' }
      ]
    };

    render(<OptionsRenderer {...checkboxProps} />);

    const deleteButton = screen.getByTestId('deleteOption-1');
    expect(deleteButton).not.toBeDisabled();

    fireEvent.click(deleteButton);
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it('disables Add Option button when radio-group has 7 options', () => {
    const propsWithMaxOptions = {
      ...defaultProps,
      options: Array(7).fill(null).map((_, i) => ({
        label: `Option ${i + 1}`,
        value: `option-${i + 1}`
      }))
    };

    render(<OptionsRenderer {...propsWithMaxOptions} />);

    const addButton = screen.getByTestId('test-options-renderer-addOption');
    expect(addButton).toBeDisabled();

    fireEvent.click(addButton);
    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  it('enables Add Option button when radio-group has less than 7 options', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const addButton = screen.getByTestId('test-options-renderer-addOption');
    expect(addButton).not.toBeDisabled();
  });

  it('enables Add Option button for non-radio-group types regardless of option count', () => {
    const propsWithMaxOptions = {
      ...defaultProps,
      type: 'checkbox-group',
      options: Array(7).fill(null).map((_, i) => ({
        label: `Option ${i + 1}`,
        value: `option-${i + 1}`
      }))
    };

    render(<OptionsRenderer {...propsWithMaxOptions} />);

    const addButton = screen.getByTestId('test-options-renderer-addOption');
    expect(addButton).not.toBeDisabled();
  });

  it('applies toPascalCase when pasting text', () => {
    const toPascalCaseSpy = jest.fn().mockReturnValue('MOCKED_PASTED TEXT');
    (toPascalCase as jest.Mock).mockImplementation(toPascalCaseSpy);

    render(<OptionsRenderer {...defaultProps} />);

    const labelInput = screen.getByTestId('test-options-renderer-label-1');

    fireEvent.change(labelInput, { target: { value: 'Option 1' } });

    mockSetOptions.mockClear();

    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        getData: () => 'pasted text'
      }
    });

    fireEvent(labelInput, pasteEvent);

    expect(toPascalCase).toHaveBeenCalledWith('pasted text');
    expect(mockSetOptions).toHaveBeenCalledWith(
      [
        { label: 'MOCKED_PASTED TEXT', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' }
      ],
      'test-property'
    );
  });

  it('does not apply toPascalCase when pasting with different value', () => {
    render(<OptionsRenderer {...defaultProps} />);

    const labelInput = screen.getByTestId('test-options-renderer-label-1');

    // Set a different value from the option's label
    Object.defineProperty(labelInput, 'value', { value: 'Changed Value' });

    const preventDefaultMock = jest.fn();

    // Simulate paste event
    fireEvent.paste(labelInput, {
      clipboardData: {
        getData: () => 'pasted text'
      },
      currentTarget: {
        value: 'Changed Value'
      },
      preventDefault: preventDefaultMock
    });

    expect(toPascalCase).not.toHaveBeenCalled();
    expect(preventDefaultMock).not.toHaveBeenCalled();
    expect(mockSetOptions).not.toHaveBeenCalled();
  });
});