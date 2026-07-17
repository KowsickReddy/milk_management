import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Textarea, Select, SearchInput } from './Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<Input label="Full Name" />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies error styles to input', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-rose-500');
  });

  it('spreads additional props', () => {
    render(<Input data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox').className).toContain('custom-class');
  });

  it('renders icon when provided', () => {
    const TestIcon = (props) => <svg data-testid="input-icon" {...props} />;
    render(<Input icon={TestIcon} />);
    expect(screen.getByTestId('input-icon')).toBeInTheDocument();
  });
});

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Write here" />);
    expect(screen.getByPlaceholderText('Write here')).toBeInTheDocument();
  });

  it('displays label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('displays error', () => {
    render(<Textarea error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('displays label', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it('shows placeholder when provided', () => {
    render(<Select placeholder="Select..." options={options} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Select onChange={handleChange} options={options} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error', () => {
    render(<Select error="Choose one" options={options} />);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<Select ref={ref} options={options} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});

describe('SearchInput', () => {
  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('passes through props', () => {
    render(<SearchInput value="test" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });
});
