import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, IconButton } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('uses primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-brand');
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger').className).toContain('bg-rose-600');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline').className).toContain('border-slate-200');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small').className).toContain('text-xs');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large').className).toContain('text-base');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    // Children not rendered when loading; spinner shown instead
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const btn = container.querySelector('button');
    expect(btn).toBeDisabled();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByText('Full').className).toContain('w-full');
  });

  it('renders icon when provided', () => {
    const TestIcon = (props) => <svg data-testid="icon" {...props} />;
    render(<Button icon={TestIcon}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('sets correct type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit');
  });

  it('uses button type by default', () => {
    render(<Button>Default</Button>);
    expect(screen.getByText('Default')).toHaveAttribute('type', 'button');
  });

  it('spreads additional props', () => {
    render(<Button aria-label="test button">Label</Button>);
    expect(screen.getByText('Label')).toHaveAttribute('aria-label', 'test button');
  });
});

describe('IconButton', () => {
  it('renders children', () => {
    render(<IconButton><span data-testid="icon">🔔</span></IconButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('passes click handler', () => {
    const handleClick = jest.fn();
    render(<IconButton onClick={handleClick}>X</IconButton>);
    fireEvent.click(screen.getByText('X'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
