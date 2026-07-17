describe('Dashboard', () => {
  describe('Admin Dashboard', () => {
    beforeEach(() => {
      cy.intercept({ method: 'GET', url: '/api/**' }, []).as('otherApiCalls');

      cy.intercept('POST', '/api/users/login', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'admin',
          full_name: 'System Administrator',
          role: 'admin',
          token: 'fake-jwt-token',
        },
      }).as('adminLogin');

      cy.intercept('GET', '/api/analytics/dashboard', {
        statusCode: 200,
        body: {
          totalCustomers: 12,
          totalDeliveriesToday: 48,
          totalRevenue: 12500,
          pendingBills: 3200,
          activeDeliveries: 18,
        },
      }).as('getDashboard');

      cy.intercept('GET', '/api/customers*', {
        statusCode: 200,
        body: [
          { id: 1, name: 'Rajesh Kumar', phone: '9876543210', status: 'active', shift: 'morning', daily_milk_quantity: 5 },
          { id: 2, name: 'Priya Sharma', phone: '9876543211', status: 'active', shift: 'evening', daily_milk_quantity: 3 },
        ],
      }).as('getCustomers');

      cy.intercept('GET', '/api/deliveries*', {
        statusCode: 200,
        body: [],
      }).as('getDeliveries');

      cy.intercept('GET', '/api/bills*', {
        statusCode: 200,
        body: [],
      }).as('getBills');

      cy.intercept('GET', '/api/users*', {
        statusCode: 200,
        body: [
          { id: 1, username: 'admin', role: 'admin', full_name: 'System Administrator', is_active: true },
        ],
      }).as('getUsers');

      cy.intercept('GET', '/api/expenses*', { statusCode: 200, body: [] }).as('getExpenses');
      cy.intercept('GET', '/api/analytics/earnings*', { statusCode: 200, body: { totalRevenue: 12500, monthly: [] } }).as('getEarnings');

      cy.loginAsAdmin();
    });

    it('renders dashboard metrics', () => {
      cy.contains('Dashboard').should('be.visible');
    });

    it('has working sidebar navigation with all menu items', () => {
      cy.contains('Customers').should('be.visible');
      cy.contains('Deliveries').should('be.visible');
      cy.contains('Billing').should('be.visible');
      cy.contains('Reports').should('be.visible');
    });

    it('navigates to Customers page', () => {
      cy.contains('Customers').should('be.visible').click();
      cy.contains('Customers').should('be.visible');
    });

    it('navigates to Deliveries page', () => {
      cy.contains('Deliveries').should('be.visible').click();
      cy.contains('Deliveries').should('be.visible');
    });
  });

  describe('Customer Portal Dashboard', () => {
    beforeEach(() => {
      cy.intercept({ method: 'GET', url: '/api/**' }, []).as('otherApiCalls');

      cy.intercept('POST', '/api/customers/login', {
        statusCode: 200,
        body: {
          id: 5,
          name: 'Rajesh Kumar',
          phone: '9876543210',
          role: 'customer',
          status: 'active',
          token: 'fake-customer-token',
        },
      }).as('customerLogin');

      cy.intercept('GET', '/api/portal/dashboard*', {
        statusCode: 200,
        body: {
          customer: { id: 5, name: 'Rajesh Kumar', daily_milk_quantity: 5, credit_balance: 0 },
          totalDue: 2500,
          pendingDeliveries: 2,
          lastDelivery: { date: '2026-07-12', quantity: 5, amount: 250 },
        },
      }).as('portalDashboard');

      cy.intercept('GET', '/api/portal/deliveries*', {
        statusCode: 200,
        body: [
          { id: 1, date: '2026-07-12', quantity: 5, amount: 250, delivered: true },
          { id: 2, date: '2026-07-13', quantity: 5, amount: 250, delivered: false },
        ],
      }).as('portalDeliveries');

      cy.loginAsCustomer();
    });

    it('shows customer portal dashboard', () => {
      cy.contains('Rajesh Kumar').should('be.visible');
    });

    it('shows customer portal navigation', () => {
      cy.contains('Deliveries').should('be.visible');
      cy.contains('Bills').should('be.visible');
      cy.contains('Support').should('be.visible');
    });

    it('navigates to portal deliveries', () => {
      cy.contains('Deliveries').should('be.visible').click();
      cy.contains('Deliveries').should('be.visible');
    });

    it('navigates to portal bills', () => {
      cy.contains('Bills').should('be.visible').click();
      cy.contains('Bills').should('be.visible');
    });
  });
});
