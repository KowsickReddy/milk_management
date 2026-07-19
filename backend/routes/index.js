// ── Route Aggregator ─────────────────────────────────────────────────────
// Mounts all route modules to the Express app

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const customerRoutes = require('./customerRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const leaveRoutes = require('./leaveRoutes');
const billRoutes = require('./billRoutes');
const paymentRoutes = require('./paymentRoutes');
const creditRoutes = require('./creditRoutes');
const expenseRoutes = require('./expenseRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reportRoutes = require('./reportRoutes');
const portalRoutes = require('./portalRoutes');
const adminRoutes = require('./adminRoutes');
const cattleRoutes = require('./cattleRoutes');
const feedRoutes = require('./feedRoutes');
const webauthnRoutes = require('./webauthnRoutes');
const notesRoutes = require('./notesRoutes');
const portalCalendarRoutes = require('./portalCalendarRoutes');

function registerRoutes(app) {
  // Health (no auth)
  app.use('/', healthRoutes);

  // Auth (no auth for login, rate limited)
  app.use('/api', authRoutes);

  // WebAuthn (partially public, partially authenticated)
  app.use('/api/auth/webauthn', webauthnRoutes);

  // Authenticated API routes
  app.use('/api/users', userRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/bills', billRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/credits', creditRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/portal', portalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/cattle', cattleRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/notes', notesRoutes);

  // Portal calendar (separate route for cleaner resolution)
  app.use('/api/portal/calendar', portalCalendarRoutes);

  // Legacy stats endpoint

  const analyticsController = require('../controllers/analyticsController');
  const authenticate = require('../middleware/authenticate');
  const { requireRole } = require('../middleware/authorize');
  app.get('/api/stats', authenticate, requireRole('admin', 'worker'), analyticsController.getStats);
}

module.exports = { registerRoutes };
