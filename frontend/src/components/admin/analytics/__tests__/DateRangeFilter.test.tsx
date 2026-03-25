import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '../DateRangeFilter';

describe('DateRangeFilter', () => {
  const mockOnDateRangeChange = jest.fn();

  beforeEach(() => {
    mockOnDateRangeChange.mockClear();
  });

  it('renders with preset options', () => {
    render(<DateRangeFilter onDateRangeChange={mockOnDateRangeChange} />);
    
    expect(screen.getByText('Date Range:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last 30 Days')).toBeInTheDocument();
  });

  it('calls onDateRangeChange when preset is changed', async () => {
    render(<DateRangeFilter onDateRangeChange={mockOnDateRangeChange} />);
    
    const select = screen.getByDisplayValue('Last 30 Days');
    await userEvent.selectOptions(select, 'Last 7 Days');
    
    expect(mockOnDateRangeChange).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });

  it('shows custom date inputs when custom preset is selected', async () => {
    render(<DateRangeFilter onDateRangeChange={mockOnDateRangeChange} />);
    
    const select = screen.getByDisplayValue('Last 30 Days');
    await userEvent.selectOptions(select, 'Custom Range');
    
    expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('End date')).toBeInTheDocument();
  });

  it('calls onDateRangeChange when custom dates are selected', async () => {
    render(<DateRangeFilter onDateRangeChange={mockOnDateRangeChange} />);
    
    const select = screen.getByDisplayValue('Last 30 Days');
    await userEvent.selectOptions(select, 'Custom Range');
    
    const startDateInput = screen.getByPlaceholderText('Start date');
    const endDateInput = screen.getByPlaceholderText('End date');
    
    await userEvent.type(startDateInput, '2024-01-01');
    await userEvent.type(endDateInput, '2024-01-31');
    
    expect(mockOnDateRangeChange).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
  });
});
