import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsPage from '../../app/admin/analytics/page';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the auth context
const mockUser = {
  id: '1',
  email: 'admin@test.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_active: true
};

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider value={{ user: mockUser, login: jest.fn(), logout: jest.fn(), register: jest.fn(), refreshUser: jest.fn() }}>
    {children}
  </AuthProvider>
);

describe('Analytics Integration Tests', () => {
  it('renders analytics page for admin users', () => {
    render(
      <MockAuthProvider>
        <AnalyticsPage />
      </MockAuthProvider>
    );

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <MockAuthProvider>
        <AnalyticsPage />
      </MockAuthProvider>
    );

    const revenueTab = screen.getByText('Revenue');
    await userEvent.click(revenueTab);

    await waitFor(() => {
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    });
  });

  it('displays date range filter', () => {
    render(
      <MockAuthProvider>
        <AnalyticsPage />
      </MockAuthProvider>
    );

    expect(screen.getByText('Date Range:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last 30 Days')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <MockAuthProvider>
        <AnalyticsPage />
      </MockAuthProvider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
