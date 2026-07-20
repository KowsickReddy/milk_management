// ── Application Configuration ─────────────────────────────────────────────

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // API settings
  apiVersion: 'v1',
  bodyLimit: '2mb',

  // CORS
  cors: {
    credentials: true,
    // Entries can be string origins or RegExp patterns
    // RegExp entries are matched against the origin with .test()
    origin: (process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'https://dairyware.netlify.app',
        ]
    ).map(e => {
      // Convert wildcard-like strings or known patterns to RegExp automatically
      if (typeof e === 'string' && e.includes('*')) {
        return new RegExp('^' + e.replace(/\./g, '\.').replace(/\*/g, '.*') + '$');
      }
      return e;
    }),
  },

  // Logging
  morganFormat: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
