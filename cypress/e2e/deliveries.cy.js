describe('Deliveries', () => {
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

    cy.intercept('GET', '/api/deliveries*', {
      statusCode: 200,
      body: [
        { id: 1, customer_id: 1, customer_name: 'Rajesh Kumar', date: '2026-07-13', quantity: 5, amount: 250, delivered: true, shift: 'morning' },
        { id: 2, customer_id: 2, customer_name: 'Priya Sharma', date: '2026-07-13', quantity: 3, amount: 150, delivered: false, shift: 'evening' },
        { id: 3, customer_id: 3, customer_name: 'Amit Singh', date: '2026-07-13', quantity: 7, amount: 385, delivered: false, shift: 'morning' },
      ],
    }).as('getDeliveries');

    cy.intercept('GET', '/api/customers', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Rajesh Kumar', phone: '9876543210', status: 'active', shift: 'morning', daily_milk_quantity: 5, milk_rate_per_liter: 50 },
        { id: 2, name: 'Priya Sharma', phone: '9876543211', status: 'active', shift: 'evening', daily_milk_quantity: 3, milk_rate_per_liter: 50 },
        { id: 3, name: 'Amit Singh', phone: '9876543212', status: 'active', shift: 'morning', daily_milk_quantity: 7, milk_rate_per_liter: 55 },
      ],
    }).as('getCustomers');

    cy.intercept('POST', '/api/deliveries/batch', {
      statusCode: 200,
      body: { success: true, updated: 2 },
    }).as('batchDeliveries');

    cy.loginAsAdmin();
  });

  it('navigates to deliveries page', () => {
    cy.contains('Deliveries').should('be.visible').click();
    cy.contains('Deliveries').should('be.visible');
  });

  it('shows delivery list with customer names', () => {
    cy.contains('Deliveries').should('be.visible').click();
    cy.contains('Rajesh Kumar').should('be.visible');
    cy.contains('Priya Sharma').should('be.visible');
  });

  it('shows delivery quantities and amounts', () => {
    cy.contains('Deliveries').should('be.visible').click();
    cy.contains('5').should('be.visible');
    cy.contains('3').should('be.visible');
  });

  it('shows delivery status indicators', () => {
    cy.contains('Deliveries').should('be.visible').click();
    cy.contains('Rajesh Kumar').should('be.visible');
  });

  it('shows delivery shift information', () => {
    cy.contains('Deliveries').should('be.visible').click();
    cy.contains('morning').should('exist');
    cy.contains('evening').should('exist');
  });
});
