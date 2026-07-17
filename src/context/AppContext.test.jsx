import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

// ── Mock api module ────────────────────────────────────────────────────────
jest.mock('../services/api', () => ({
  customersAPI: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
    delete: jest.fn().mockResolvedValue({}),
  },
  deliveriesAPI: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  billsAPI: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  paymentsAPI: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  creditsAPI: {
    apply: jest.fn().mockResolvedValue({ message: 'Credit applied' }),
  },
}));

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Helper component to access context values
function ContextConsumer({ children }) {
  const context = useApp();
  return children(context);
}

// ── AppProvider renders children ────────────────────────────────────────────
describe('AppProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <AppProvider>
        <div>App content</div>
      </AppProvider>
    );
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('provides initial state', () => {
    let capturedContext;
    render(
      <AppProvider>
        <ContextConsumer>
          {(ctx) => { capturedContext = ctx; return null; }}
        </ContextConsumer>
      </AppProvider>
    );
    // The context starts with loading states
    expect(capturedContext).toBeDefined();
    expect(Array.isArray(capturedContext.customers)).toBe(true);
    expect(Array.isArray(capturedContext.deliveries)).toBe(true);
    expect(Array.isArray(capturedContext.bills)).toBe(true);
    expect(Array.isArray(capturedContext.payments)).toBe(true);
    expect(Array.isArray(capturedContext.credits)).toBe(true);
  });

  it('provides action functions', () => {
    let capturedContext;
    render(
      <AppProvider>
        <ContextConsumer>
          {(ctx) => { capturedContext = ctx; return null; }}
        </ContextConsumer>
      </AppProvider>
    );
    expect(typeof capturedContext.addCustomer).toBe('function');
    expect(typeof capturedContext.updateCustomer).toBe('function');
    expect(typeof capturedContext.deleteCustomer).toBe('function');
    expect(typeof capturedContext.addDelivery).toBe('function');
    expect(typeof capturedContext.updateDelivery).toBe('function');
    expect(typeof capturedContext.markDelivered).toBe('function');
    expect(typeof capturedContext.markLeave).toBe('function');
    expect(typeof capturedContext.generateBill).toBe('function');
    expect(typeof capturedContext.recordPayment).toBe('function');
    expect(typeof capturedContext.applyCredit).toBe('function');
    expect(typeof capturedContext.loadData).toBe('function');
    expect(typeof capturedContext.loadFromAPI).toBe('function');
  });

  it('provides computed helper functions', () => {
    let capturedContext;
    render(
      <AppProvider>
        <ContextConsumer>
          {(ctx) => { capturedContext = ctx; return null; }}
        </ContextConsumer>
      </AppProvider>
    );
    expect(typeof capturedContext.getTodayDeliveries).toBe('function');
    expect(typeof capturedContext.getCustomerDeliveries).toBe('function');
    expect(typeof capturedContext.getCustomerBills).toBe('function');
    expect(typeof capturedContext.getUnpaidBills).toBe('function');
    expect(typeof capturedContext.getMonthlyRevenue).toBe('function');
    expect(typeof capturedContext.getActiveCustomers).toBe('function');
  });
});

// ── useApp default values ──────────────────────────────────────────────────
describe('useApp', () => {
  it('returns default values when used outside provider', () => {
    let captured;
    function Test() {
      captured = useApp();
      return null;
    }
    render(<Test />);
    expect(captured.loading).toBe(true);
    expect(captured.customers).toEqual([]);
    expect(captured.deliveries).toEqual([]);
    expect(captured.bills).toEqual([]);
    expect(captured.payments).toEqual([]);
    expect(captured.credits).toEqual([]);
    expect(captured.apiAvailable).toBe(false);
    expect(captured.getTodayDeliveries()).toEqual([]);
    expect(captured.getCustomerDeliveries()).toBeNull();
    expect(captured.getCustomerBills()).toEqual([]);
    expect(captured.getUnpaidBills()).toEqual([]);
    expect(captured.getMonthlyRevenue()).toBe(0);
    expect(captured.getActiveCustomers()).toEqual([]);
  });

  it('computed functions return empty arrays when no data', () => {
    let captured;
    render(
      <AppProvider>
        <ContextConsumer>
          {(ctx) => { captured = ctx; return null; }}
        </ContextConsumer>
      </AppProvider>
    );

    // Wait for initial load effects... the computed functions should still work
    // even with empty state
    expect(captured.getTodayDeliveries('2024-01-01')).toEqual([]);
    expect(captured.getCustomerDeliveries(1, '2024-01-01')).toBeUndefined();
    expect(captured.getCustomerBills(1)).toEqual([]);
    expect(captured.getUnpaidBills()).toEqual([]);
    expect(captured.getMonthlyRevenue(1, 2024)).toBe(0);
    expect(captured.getActiveCustomers()).toEqual([]);
  });
});
