describe('Customer Management', () => {
  beforeEach(() => {
    // Catch-all for any API calls not explicitly stubbed
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

    cy.intercept('GET', '/api/customers', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Rajesh Kumar', phone: '9876543210', status: 'active', shift: 'morning', daily_milk_quantity: 5, milk_rate_per_liter: 50, route_area: 'Zone A', customer_type: 'regular', credit_balance: 0 },
        { id: 2, name: 'Priya Sharma', phone: '9876543211', status: 'active', shift: 'evening', daily_milk_quantity: 3, milk_rate_per_liter: 50, route_area: 'Zone B', customer_type: 'regular', credit_balance: 100 },
        { id: 3, name: 'Amit Singh', phone: '9876543212', status: 'inactive', shift: 'morning', daily_milk_quantity: 7, milk_rate_per_liter: 55, route_area: 'Zone A', customer_type: 'wholesale', credit_balance: 500 },
      ],
    }).as('getCustomers');

    cy.loginAsAdmin();
  });

  it('navigates to customers page', () => {
    cy.contains('Customers').should('be.visible').click();
    cy.contains('Customers').should('be.visible');
  });

  it('displays customer list with names', () => {
    cy.contains('Customers').should('be.visible').click();
    cy.contains('Rajesh Kumar').should('be.visible');
    cy.contains('Priya Sharma').should('be.visible');
    cy.contains('Amit Singh').should('be.visible');
  });

  it('shows customer phone numbers', () => {
    cy.contains('Customers').should('be.visible').click();
    cy.contains('9876543210').should('be.visible');
    cy.contains('9876543211').should('be.visible');
  });

  it('shows status badges for each customer', () => {
    cy.contains('Customers').should('be.visible').click();
    cy.contains('active').should('exist');
    cy.contains('inactive').should('exist');
  });

  it('shows customer shift information', () => {
    cy.contains('Customers').should('be.visible').click();
    cy.contains('morning').should('exist');
    cy.contains('evening').should('exist');
  });
});
