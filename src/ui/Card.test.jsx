import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter, StatCard, EmptyState } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class"><span /></Card>);
    expect(container.firstChild.className).toContain('custom-class');
  });

  it('applies hover class when hover prop is true', () => {
    const { container } = render(<Card hover><span /></Card>);
    expect(container.firstChild.className).toContain('card-hover');
  });

  it('does not apply hover class when hover is false', () => {
    const { container } = render(<Card><span /></Card>);
    expect(container.firstChild.className).not.toContain('card-hover');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader><h2>Header</h2></CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent><p>Body</p></CardContent>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter><button>OK</button></CardFooter>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Revenue" value="₹10,000" animate={false} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('₹10,000')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard title="Users" value="42" subtitle="Active this month" />);
    expect(screen.getByText('Active this month')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = (props) => <svg data-testid="stat-icon" {...props} />;
    render(<StatCard title="Test" value="100" icon={TestIcon} />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('renders trend indicator', () => {
    const { container } = render(<StatCard title="Growth" value="12%" trend={10} trendValue={10} animate={false} />);
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
    // Trend is rendered as an SVG arrow (not a text glyph)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders negative trend indicator', () => {
    const { container } = render(<StatCard title="Loss" value="-5%" trend={-8} trendValue={8} animate={false} />);
    expect(screen.getByText(/8%/)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with color variant', () => {
    const TestIcon = (props) => <svg data-testid="icon-color" {...props} />;
    const { container } = render(
      <StatCard title="Alerts" value="3" icon={TestIcon} color="red" />
    );
    const iconWrapper = container.querySelector('.text-red-600');
    expect(iconWrapper).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="Empty" description="Add your first item" />);
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = (props) => <svg data-testid="empty-icon" {...props} />;
    render(<EmptyState title="Empty" icon={TestIcon} />);
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });
});
