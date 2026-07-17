import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { customersAPI, deliveriesAPI, billsAPI, paymentsAPI, creditsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  customers: [],
  deliveries: [],
  bills: [],
  payments: [],
  credits: [],
  loading: false,
  error: null,
  lastSync: null,
  apiAvailable: false,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  SET_DELIVERIES: 'SET_DELIVERIES',
  ADD_DELIVERY: 'ADD_DELIVERY',
  UPDATE_DELIVERY: 'UPDATE_DELIVERY',
  SET_BILLS: 'SET_BILLS',
  ADD_BILL: 'ADD_BILL',
  UPDATE_BILL: 'UPDATE_BILL',
  SET_PAYMENTS: 'SET_PAYMENTS',
  ADD_PAYMENT: 'ADD_PAYMENT',
  SET_CREDITS: 'SET_CREDITS',
  ADD_CREDIT: 'ADD_CREDIT',
  UPDATE_CREDIT: 'UPDATE_CREDIT',
  LOAD_DATA: 'LOAD_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_API_AVAILABLE: 'SET_API_AVAILABLE',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_CUSTOMERS:
      return { ...state, customers: action.payload };

    case ACTIONS.ADD_CUSTOMER:
      return { ...state, customers: [...state.customers, action.payload] };

    case ACTIONS.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case ACTIONS.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };

    case ACTIONS.SET_DELIVERIES:
      return { ...state, deliveries: action.payload };

    case ACTIONS.ADD_DELIVERY:
      return { ...state, deliveries: [...state.deliveries, action.payload] };

    case ACTIONS.UPDATE_DELIVERY:
      return {
        ...state,
        deliveries: state.deliveries.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };

    case ACTIONS.SET_BILLS:
      return { ...state, bills: action.payload };

    case ACTIONS.ADD_BILL:
      return { ...state, bills: [...state.bills, action.payload] };

    case ACTIONS.UPDATE_BILL:
      return {
        ...state,
        bills: state.bills.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };

    case ACTIONS.SET_PAYMENTS:
      return { ...state, payments: action.payload };

    case ACTIONS.ADD_PAYMENT:
      return { ...state, payments: [...state.payments, action.payload] };

    case ACTIONS.SET_CREDITS:
      return { ...state, credits: action.payload };

    case ACTIONS.ADD_CREDIT:
      return { ...state, credits: [...state.credits, action.payload] };

    case ACTIONS.UPDATE_CREDIT:
      return {
        ...state,
        credits: state.credits.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case ACTIONS.LOAD_DATA:
      return {
        ...state,
        ...action.payload,
        loading: false,
        lastSync: new Date().toISOString(),
      };

    case ACTIONS.SET_API_AVAILABLE:
      return { ...state, apiAvailable: action.payload };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

// Debounce helper
function useDebounceSave(state) {
  const timeoutRef = useRef(null);
  const prevRef = useRef(state);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const prev = prevRef.current;
        const slices = [
          ['milk_customers',  state.customers,  prev.customers],
          ['milk_deliveries', state.deliveries, prev.deliveries],
          ['milk_bills',      state.bills,      prev.bills],
          ['milk_payments',   state.payments,   prev.payments],
          ['milk_credits',    state.credits,    prev.credits],
        ];
        slices.forEach(([key, cur, prevVal]) => {
          if (cur !== prevVal) localStorage.setItem(key, JSON.stringify(cur));
        });
        prevRef.current = state;
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state]);
}

// Sanitize string input to prevent XSS
function sanitizeString(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Use debounced save to localStorage
  useDebounceSave(state);

  // Load data from API
  const loadFromAPI = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const [customers, deliveries, bills, payments] = await Promise.all([
        customersAPI.getAll(),
        deliveriesAPI.getAll(),
        billsAPI.getAll(),
        paymentsAPI.getAll(),
      ]);

      dispatch({
        type: ACTIONS.LOAD_DATA,
        payload: { customers, deliveries, bills, payments, credits: [] },
      });
    } catch (error) {
      console.error('Failed to load from API:', error);
      dispatch({ type: ACTIONS.SET_API_AVAILABLE, payload: false });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Load data from localStorage
  const loadData = useCallback(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const customers = JSON.parse(localStorage.getItem('milk_customers') || '[]');
      const deliveries = JSON.parse(localStorage.getItem('milk_deliveries') || '[]');
      const bills = JSON.parse(localStorage.getItem('milk_bills') || '[]');
      const payments = JSON.parse(localStorage.getItem('milk_payments') || '[]');
      const credits = JSON.parse(localStorage.getItem('milk_credits') || '[]');

      dispatch({
        type: ACTIONS.LOAD_DATA,
        payload: { customers, deliveries, bills, payments, credits },
      });
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load data' });
    }
  }, []);

  // Check if backend API is available
  const checkAPIAvailability = useCallback(async () => {
    try {
      const { healthCheck } = await import('../services/api');
      const available = await healthCheck();
      dispatch({ type: ACTIONS.SET_API_AVAILABLE, payload: available });
      if (available) {
        // Load from API instead of localStorage
        await loadFromAPI();
      }
    } catch (err) {
      console.error('API check failed:', err);
      dispatch({ type: ACTIONS.SET_API_AVAILABLE, payload: false });
    }
  }, [loadFromAPI]);

  // Load data from localStorage on mount
  useEffect(() => {
    loadData();
    checkAPIAvailability();
  }, [loadData, checkAPIAvailability]);

  // Customer actions
  const addCustomer = useCallback(async (customer) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      // Sanitize inputs
      const sanitizedCustomer = {
        ...customer,
        name: sanitizeString(customer.name),
        phone: sanitizeString(customer.phone),
        address: sanitizeString(customer.address),
      };

      let newCustomer;
      if (state.apiAvailable) {
        // Save to API
        newCustomer = await customersAPI.create(sanitizedCustomer);
        toast.success('Customer added successfully');
      } else {
        // Fallback to localStorage
        newCustomer = {
          ...sanitizedCustomer,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      
      dispatch({ type: ACTIONS.ADD_CUSTOMER, payload: newCustomer });
      return newCustomer;
    } catch (error) {
      toast.error('Failed to add customer: ' + error.message);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.apiAvailable]);

  const updateCustomer = useCallback(async (customer) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const sanitizedCustomer = {
        ...customer,
        name: sanitizeString(customer.name),
        phone: sanitizeString(customer.phone),
        address: sanitizeString(customer.address),
      };

      let updated;
      if (state.apiAvailable) {
        updated = await customersAPI.update(customer.id, sanitizedCustomer);
        toast.success('Customer updated successfully');
      } else {
        updated = { ...sanitizedCustomer, updated_at: new Date().toISOString() };
      }
      
      dispatch({ type: ACTIONS.UPDATE_CUSTOMER, payload: updated });
      return updated;
    } catch (error) {
      toast.error('Failed to update customer: ' + error.message);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.apiAvailable]);

  const deleteCustomer = useCallback(async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      if (state.apiAvailable) {
        await customersAPI.delete(id);
        toast.success('Customer deleted successfully');
      }
      // Only delete from local state after API succeeds
      dispatch({ type: ACTIONS.DELETE_CUSTOMER, payload: id });
    } catch (error) {
      toast.error('Failed to delete customer: ' + error.message);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      // Don't delete from local state if API fails
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.apiAvailable]);

  // Delivery actions
  const addDelivery = useCallback(async (delivery) => {
    try {
      const sanitizedDelivery = {
        ...delivery,
        customer_name: sanitizeString(delivery.customer_name),
      };
      let newDelivery;
      if (state.apiAvailable) {
        newDelivery = await deliveriesAPI.create(sanitizedDelivery);
      } else {
        newDelivery = {
          ...sanitizedDelivery,
          id: Date.now(),
          created_at: new Date().toISOString(),
        };
      }
      
      dispatch({ type: ACTIONS.ADD_DELIVERY, payload: newDelivery });
      return newDelivery;
    } catch (error) {
      toast.error('Failed to add delivery: ' + error.message);
      return null;
    }
  }, [state.apiAvailable]);

  const updateDelivery = useCallback((delivery) => {
    dispatch({ type: ACTIONS.UPDATE_DELIVERY, payload: delivery });
  }, []);

  const markDelivered = useCallback(async (customerId, date, quantity) => {
    const existing = state.deliveries.find(
      d => d.customer_id === customerId && d.date === date
    );

    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const deliveryData = {
      customer_id: customerId,
      customer_name: sanitizeString(customer.name),
      date,
      session: customer.shift || 'morning',
      scheduled_quantity: customer.default_milk_quantity || customer.daily_milk_quantity,
      delivered_quantity: quantity,
      status: 'delivered',
      delivered: true,
      leave: false,
      delivery_shift: customer.shift || 'morning',
      extra_milk: 0,
    };

    if (existing) {
      const updated = {
        ...existing,
        ...deliveryData,
        updated_at: new Date().toISOString(),
      };
      dispatch({ type: ACTIONS.UPDATE_DELIVERY, payload: updated });
      
      if (state.apiAvailable) {
        try {
          await deliveriesAPI.create(deliveryData);
        } catch (error) {
          console.error('Failed to sync delivery:', error);
          toast.error('Delivery saved locally, sync failed');
        }
      }
    } else {
      await addDelivery(deliveryData);
    }
  }, [state.deliveries, state.customers, state.apiAvailable, addDelivery]);

  const markLeave = useCallback(async (customerId, date) => {
    const existing = state.deliveries.find(
      d => d.customer_id === customerId && d.date === date
    );

    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const deliveryData = {
      customer_id: customerId,
      customer_name: sanitizeString(customer.name),
      date,
      session: customer.shift || 'morning',
      scheduled_quantity: customer.default_milk_quantity || customer.daily_milk_quantity,
      delivered_quantity: 0,
      status: 'leave',
      delivered: false,
      leave: true,
      delivery_shift: customer.shift || 'morning',
      extra_milk: 0,
    };

    if (existing) {
      const updated = {
        ...existing,
        ...deliveryData,
        updated_at: new Date().toISOString(),
      };
      dispatch({ type: ACTIONS.UPDATE_DELIVERY, payload: updated });
      
      if (state.apiAvailable) {
        try {
          await deliveriesAPI.create(deliveryData);
        } catch (error) {
          console.error('Failed to sync delivery:', error);
          toast.error('Leave saved locally, sync failed');
        }
      }
    } else {
      await addDelivery(deliveryData);
    }
  }, [state.deliveries, state.customers, state.apiAvailable, addDelivery]);

  // Bill actions - Fixed to use actual deliveries
  const generateBill = useCallback(async (customer, startDate, endDate) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      // Use actual date range if provided, otherwise default to current month
      const today = new Date();
      const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1);
      const end = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Calculate from actual deliveries
      const customerDeliveries = state.deliveries.filter(d => {
        const deliveryDate = new Date(d.date);
        return d.customer_id === customer.id && 
               deliveryDate >= start && 
               deliveryDate <= end &&
               (d.status ? d.status !== 'leave' : d.delivered && !d.leave) &&
               !d.is_deleted;
      });

      const totalQuantity = customerDeliveries.reduce((sum, d) => 
        sum + (parseFloat(d.delivered_quantity) || 0) + (parseFloat(d.extra_milk) || 0), 0
      );
      
      const totalAmount = totalQuantity * customer.milk_rate_per_liter;

      const newBill = {
        id: state.apiAvailable ? undefined : Date.now(),
        customer_id: customer.id,
        customer_name: sanitizeString(customer.name),
        bill_month: start.getMonth() + 1,
        bill_year: start.getFullYear(),
        bill_start_date: start.toISOString().split('T')[0],
        bill_end_date: end.toISOString().split('T')[0],
        total_quantity: totalQuantity,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        paid: false,
        amount_paid: 0,
        balance: parseFloat(totalAmount.toFixed(2)),
        outstanding_balance: 0,
        bill_generated_at: today.toISOString(),
      };

      let createdBill;
      if (state.apiAvailable) {
        createdBill = await billsAPI.create(newBill);
        toast.success('Bill generated successfully');
      } else {
        createdBill = { ...newBill, id: Date.now() };
      }

      dispatch({ type: ACTIONS.ADD_BILL, payload: createdBill });
      return createdBill;
    } catch (error) {
      toast.error('Failed to generate bill: ' + error.message);
      return null;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.deliveries, state.apiAvailable]);

  const recordPayment = useCallback(async (billId, amountPaid) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const bill = state.bills.find(b => b.id === billId);
      if (!bill) {
        toast.error('Bill not found');
        return null;
      }

      const paymentAmount = parseFloat(amountPaid);
      const currentBalance = parseFloat(bill.balance || 0);
      const changeAmount = paymentAmount - currentBalance;

      const paymentData = {
        bill_id: billId,
        customer_id: bill.customer_id,
        amount_paid: paymentAmount,
        change_given: changeAmount > 0 ? changeAmount : 0,
        payment_method: 'cash',
        is_partial: paymentAmount < currentBalance,
        is_full_with_change: changeAmount > 0,
        change_amount: changeAmount > 0 ? changeAmount : 0,
      };

      let result;
      if (state.apiAvailable) {
        result = await paymentsAPI.create(paymentData);
        // If API is available, we should probably re-load bills to get the updated state from server
        const updatedBills = await billsAPI.getAll();
        dispatch({ type: ACTIONS.SET_BILLS, payload: updatedBills });
        
        // Also update the local customer if credit was added
        if (changeAmount > 0) {
           const updatedCustomers = await customersAPI.getAll();
           dispatch({ type: ACTIONS.SET_CUSTOMERS, payload: updatedCustomers });
        }
      } else {
        // Fallback local logic
        result = {
          id: Date.now(),
          ...paymentData,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        
        let newBill;
        if (paymentAmount >= currentBalance) {
          newBill = {
            ...bill,
            paid: true,
            amount_paid: (parseFloat(bill.amount_paid) || 0) + currentBalance,
            balance: 0,
            payment_date: new Date().toISOString(),
          };
          
          if (changeAmount > 0) {
            const customer = state.customers.find(c => c.id === bill.customer_id);
            if (customer) {
              dispatch({
                type: ACTIONS.UPDATE_CUSTOMER,
                payload: { ...customer, credit_balance: (parseFloat(customer.credit_balance) || 0) + changeAmount }
              });
            }
          }
        } else {
          newBill = {
            ...bill,
            amount_paid: (parseFloat(bill.amount_paid) || 0) + paymentAmount,
            balance: parseFloat((currentBalance - paymentAmount).toFixed(2)),
          };
        }
        dispatch({ type: ACTIONS.UPDATE_BILL, payload: newBill });
      }

      dispatch({ type: ACTIONS.ADD_PAYMENT, payload: result });
      toast.success('Payment recorded successfully!');
      return { change: changeAmount > 0 ? changeAmount : 0 };
    } catch (error) {
      toast.error('Failed to record payment: ' + error.message);
      return null;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.bills, state.customers, state.apiAvailable]);

  // Credit actions
  const applyCredit = useCallback(async (customerId, billId, amount) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      if (state.apiAvailable) {
        const result = await creditsAPI.apply({ customer_id: customerId, bill_id: billId, amount });
        toast.success(result.message);
        
        // Reload bills to reflect changes
        const updatedBills = await billsAPI.getAll();
        dispatch({ type: ACTIONS.SET_BILLS, payload: updatedBills });
        
        return result;
      } else {
        toast('Credit system requires backend API', { icon: 'ℹ️' });
        return null;
      }
    } catch (error) {
      toast.error('Failed to apply credit: ' + error.message);
      return null;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.apiAvailable]);

  // Computed values
  const getTodayDeliveries = useCallback((date = new Date().toISOString().split('T')[0]) => {
    return state.deliveries.filter(d => d.date === date);
  }, [state.deliveries]);

  const getCustomerDeliveries = useCallback((customerId, date) => {
    return state.deliveries.find(
      d => d.customer_id === customerId && d.date === date
    );
  }, [state.deliveries]);

  const getCustomerBills = useCallback((customerId) => {
    return state.bills.filter(b => b.customer_id === customerId);
  }, [state.bills]);

  const getUnpaidBills = useCallback(() => {
    return state.bills.filter(b => !b.paid);
  }, [state.bills]);

  const getMonthlyRevenue = useCallback((month, year) => {
    return state.payments
      .filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() + 1 === month &&
               paymentDate.getFullYear() === year;
      })
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  }, [state.payments]);

  const getActiveCustomers = useCallback(() => {
    return state.customers.filter(c => c.status === 'active');
  }, [state.customers]);

  const value = {
    // State
    ...state,

    // Actions
    loadData,
    loadFromAPI,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addDelivery,
    updateDelivery,
    markDelivered,
    markLeave,
    generateBill,
    recordPayment,
    applyCredit,

    // Computed
    getTodayDeliveries,
    getCustomerDeliveries,
    getCustomerBills,
    getUnpaidBills,
    getMonthlyRevenue,
    getActiveCustomers,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use context
export function useApp() {
  const context = useContext(AppContext);
  // Return default values if context is not yet available
  if (!context) {
    return {
      customers: [],
      deliveries: [],
      bills: [],
      payments: [],
      credits: [],
      loading: true,
      error: null,
      lastSync: null,
      apiAvailable: false,
      loadData: () => {},
      loadFromAPI: () => {},
      addCustomer: () => {},
      updateCustomer: () => {},
      deleteCustomer: () => {},
      addDelivery: () => {},
      updateDelivery: () => {},
      markDelivered: () => {},
      markLeave: () => {},
      generateBill: () => {},
      recordPayment: () => {},
      applyCredit: () => {},
      getTodayDeliveries: () => [],
      getCustomerDeliveries: () => null,
      getCustomerBills: () => [],
      getUnpaidBills: () => [],
      getMonthlyRevenue: () => 0,
      getActiveCustomers: () => [],
    };
  }
  return context;
}

export default AppContext;
