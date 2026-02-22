import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICards';

describe('KPICard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '1000',
    icon: <div data-testid="test-icon" />,
    trend: null,
    isLoading: false,
  };

  it('renders KPI card with title and value', () => {
    render(<KPICard {...defaultProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    render(<KPICard {...defaultProps} isLoading={true} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows positive trend correctly', () => {
    render(<KPICard {...defaultProps} trend={{ value: 10, isPositive: true }} />);
    
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByTestId('trend-up')).toBeInTheDocument();
  });

  it('shows negative trend correctly', () => {
    render(<KPICard {...defaultProps} trend={{ value: 5, isPositive: false }} />);
    
    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByTestId('trend-down')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    render(<KPICard {...defaultProps} color="green" />);
    
    const card = screen.getByTestId('kpi-card');
    expect(card).toHaveClass('text-green-600');
  });
});
