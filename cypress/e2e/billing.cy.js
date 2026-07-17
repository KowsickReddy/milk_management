describe('Billing', () => {
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

    cy.intercept('GET', '/api/bills*', {
      statusCode: 200,
      body: [
        { id: 1, customer_id: 1, customer_name: 'Rajesh Kumar', bill_month: '2026-07', total_amount: 3750, paid_amount: 3750, status: 'paid' },
        { id: 2, customer_id: 2, customer_name: 'Priya Sharma', bill_month: '2026-07', total_amount: 2250, paid_amount: 1000, status: 'partial' },
        { id: 3, customer_id: 3, customer_name: 'Amit Singh', bill_month: '2026-07', total_amount: 5775, paid_amount: 0, status: 'unpaid' },
      ],
    }).as('getBills');

    cy.intercept('GET', '/api/customers*', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Rajesh Kumar', phone: '9876543210', status: 'active', shift: 'morning', daily_milk_quantity: 5 },
        { id: 2, name: 'Priya Sharma', phone: '9876543211', status: 'active', shift: 'evening', daily_milk_quantity: 3 },
        { id: 3, name: 'Amit Singh', phone: '9876543212', status: 'active', shift: 'morning', daily_milk_quantity: 7 },
      ],
    }).as('getCustomers');

    cy.intercept('GET', '/api/analytics/dashboard', {
      statusCode: 200,
      body: { totalCustomers: 12, totalDeliveriesToday: 48, totalRevenue: 12500, pendingBills: 3200, activeDeliveries: 18 },
    }).as('getDashboard');

    cy.loginAsAdmin();
  });

  it('navigates to billing page', () => {
    cy.contains('Billing').should('be.visible').click();
    cy.contains('Billing').should('be.visible');
  });

  it('displays customer bills with amounts', () => {
    cy.contains('Billing').should('be.visible').click();
    cy.contains('Rajesh Kumar').should('be.visible');
    cy.contains('Priya Sharma').should('be.visible');
    cy.contains('Amit Singh').should('be.visible');
  });

  it('shows bill status indicators', () => {
    cy.contains('Billing').should('be.visible').click();
    cy.contains('paid').should('exist');
    cy.contains('partial').should('exist');
    cy.contains('unpaid').should('exist');
  });

  it('displays bill amounts', () => {
    cy.contains('Billing').should('be.visible').click();
    cy.contains('3,750').should('be.visible');
    cy.contains('2,250').should('be.visible');
    cy.contains('5,775').should('be.visible');
  });

  it('shows bill month information', () => {
    cy.contains('Billing').should('be.visible').click();
    cy.contains('July').should('exist');
    cy.contains('2026').should('exist');
  });
});
