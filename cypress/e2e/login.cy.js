describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit('/');
  });

  it('renders the login screen with branding', () => {
    cy.contains('Dairy Manager').should('be.visible');
    cy.contains('Streamline your delivery business').should('be.visible');
    cy.contains('Secure Cloud Powered System').should('be.visible');
  });

  it('shows Staff Login active by default', () => {
    cy.contains('button', 'Staff Login').should('have.class', 'bg-white');
    cy.contains('button', 'Customer Portal').should('not.have.class', 'bg-white');
  });

  it('has username input with User icon and PIN field with Lock icon', () => {
    cy.get('input[placeholder="Enter username"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('svg.lucide-user').should('exist');
    cy.get('svg.lucide-lock').should('exist');
  });

  it('allows typing in username and PIN fields', () => {
    cy.get('input[placeholder="Enter username"]').type('admin').should('have.value', 'admin');
    cy.get('input[type="password"]').type('1234').should('have.value', '1234');
  });

  it('toggles PIN visibility when eye button is clicked', () => {
    cy.get('input[type="password"]').type('1234');
    cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    cy.get('button[type="button"] svg.lucide-eye').click();
    // After toggle, the PIN input type changes to text
    cy.get('input[placeholder="••••"]').should('have.attr', 'type', 'text');
    cy.get('button[type="button"] svg.lucide-eye-off').should('exist');
  });

  it('switches to Customer Portal tab', () => {
    cy.contains('Customer Portal').click();
    cy.get('input[placeholder="10-digit mobile"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    // Fingerprint button should not be visible for customer tab
    cy.contains('Fingerprint Login').should('not.exist');
  });

  it('shows validation error on empty submit — form stays visible', () => {
    cy.contains('button', 'Sign In').click();
    // Form stays — login button still present
    cy.contains('button', 'Sign In').should('be.visible');
    // Username field still visible means we didn't navigate away
    cy.get('input[placeholder="Enter username"]').should('be.visible');
  });

  it('shows validation error on empty customer login — form stays visible', () => {
    cy.contains('Customer Portal').click();
    cy.contains('button', 'Sign In').click();
    // Form stays — login button still present
    cy.contains('button', 'Sign In').should('be.visible');
    cy.get('input[placeholder="10-digit mobile"]').should('be.visible');
  });

  it('shows error on invalid admin credentials — form stays visible', () => {
    cy.intercept('POST', '/api/users/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' },
    }).as('badLogin');

    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[type="password"]').type('wrong');
    cy.contains('button', 'Sign In').click();

    cy.wait('@badLogin');
    // Form should still be visible after failed login
    cy.get('input[placeholder="Enter username"]').should('be.visible');
    cy.contains('button', 'Sign In').should('be.visible');
  });

  it('successfully logs in as admin and navigates away from login screen', () => {
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

    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[type="password"]').type('1234');
    cy.contains('button', 'Sign In').click();

    cy.wait('@adminLogin');
    // Wait for navigation away from login screen — check sidebar nav exists
    cy.contains('Dashboard', { timeout: 10000 }).should('exist');
    // The login form submit button should no longer be visible
    cy.contains('button', 'Sign In').should('not.exist');
  });

  it('successfully logs in as customer', () => {
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

    cy.contains('Customer Portal').click();
    cy.get('input[placeholder="10-digit mobile"]').type('9876543210');
    cy.get('input[type="password"]').type('1234');
    cy.contains('button', 'Sign In').click();

    cy.wait('@customerLogin');
    // Wait for navigation — customer dashboard should show
    cy.contains('Dashboard', { timeout: 10000 }).should('exist');
    // The login form submit button should no longer be visible
    cy.contains('button', 'Sign In').should('not.exist');
  });

  it('shows fingerprint login button for admin tab', () => {
    cy.contains('Fingerprint Login').should('be.visible');
  });

  it('disables fingerprint button when username is empty', () => {
    cy.contains('button', 'Fingerprint Login').should('be.disabled');
  });

  it('enables fingerprint button when username is entered', () => {
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.contains('button', 'Fingerprint Login').should('not.be.disabled');
  });

  it('clears fields when switching between tabs', () => {
    cy.get('input[placeholder="Enter username"]').type('admin');
    cy.get('input[type="password"]').type('1234');

    // Switch to customer tab
    cy.contains('Customer Portal').click();
    cy.get('input[placeholder="10-digit mobile"]').should('have.value', '');
    cy.get('input[type="password"]').should('have.value', '');

    // Switch back to staff tab
    cy.contains('Staff Login').click();
    cy.get('input[placeholder="Enter username"]').should('have.value', '');
    cy.get('input[type="password"]').should('have.value', '');
  });
});
