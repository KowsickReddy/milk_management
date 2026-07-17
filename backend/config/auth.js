// ── Authentication & Security Configuration ──────────────────────────────

require('dotenv').config();

// Validate required environment variables at startup
if (!process.env.JWT_SECRET) {
  const msg = 'FATAL: JWT_SECRET environment variable is required.';
  console.error(msg);
  // Don't exit in test mode — the test file sets JWT_SECRET before importing
  if (process.env.NODE_ENV !== 'test') process.exit(1);
}

module.exports = {
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '24h',
  jwtRefreshExpiresIn: '7d',
  jwtCookieName: 'token',

  // WebAuthn
  webauthn: {
    rpName: 'Dairy Management System',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
    timeout: 60000,
  },

  // Rate Limiting
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 10,
    },
  },

  // CORS
  allowedOrigins: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],

  // Cookie settings
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  },
};
