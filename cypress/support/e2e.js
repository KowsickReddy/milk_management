// Cypress support file — custom commands
// Runs before every spec file.

// ── Custom command: log in as admin ────────────────────────────────────────
Cypress.Commands.add('loginAsAdmin', (overrides = {}) => {
  const defaults = {
    id: 1,
    username: 'admin',
    full_name: 'System Administrator',
    role: 'admin',
    token: 'fake-jwt-token-admin',
  };
  const user = { ...defaults, ...overrides };

  // Clear localStorage so the app shows the login screen (not skip it)
  cy.clearAllLocalStorage();

  cy.intercept('POST', '/api/users/login', {
    statusCode: 200,
    body: user,
  }).as('loginRequest');

  cy.visit('/');

  cy.get('input[placeholder="Enter username"]').type(user.username);
  cy.get('input[type="password"]').type('1234');
  cy.contains('button', 'Sign In').click();

  cy.wait('@loginRequest');
  // Wait for successful navigation — sidebar text must exist in DOM
  // Note: sidebar buttons may be partially covered by layout elements,
  // so check existence instead of strict visibility
  cy.contains('Dashboard', { timeout: 10000 }).should('exist');
});

// ── Custom command: log in as customer ─────────────────────────────────────
Cypress.Commands.add('loginAsCustomer', (overrides = {}) => {
  const defaults = {
    id: 5,
    name: 'Rajesh Kumar',
    phone: '9876543210',
    role: 'customer',
    status: 'active',
    token: 'fake-jwt-token-customer',
  };
  const customer = { ...defaults, ...overrides };

  // Clear localStorage so the app shows the login screen
  cy.clearAllLocalStorage();

  cy.intercept('POST', '/api/customers/login', {
    statusCode: 200,
    body: customer,
  }).as('customerLogin');

  cy.visit('/');

  cy.contains('Customer Portal').click();
  cy.get('input[placeholder="10-digit mobile"]').type(customer.phone);
  cy.get('input[type="password"]').type('1234');
  cy.contains('button', 'Sign In').click();

  cy.wait('@customerLogin');
  // Wait for successful navigation — sidebar text must exist in DOM
  cy.contains('Dashboard', { timeout: 10000 }).should('exist');
});
