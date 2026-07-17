// ── WebAuthn Routes ──────────────────────────────────────────────────────

const { Router } = require('express');
const webauthnController = require('../controllers/webauthnController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Login begin is rate-limited (public endpoint)
router.post('/login/begin',    rateLimiter(), webauthnController.loginBegin);
router.post('/login/complete', webauthnController.loginComplete);

// Registration requires authentication (admin only)
router.use(authenticate);

router.post('/register/begin',    requireRole('admin'), webauthnController.registerBegin);
router.post('/register/complete', requireRole('admin'), webauthnController.registerComplete);
router.get('/credentials/:userId',   webauthnController.getCredentials);
router.delete('/credentials/:id',    webauthnController.deleteCredential);

module.exports = router;
