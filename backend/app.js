// ── Express App Setup ─────────────────────────────────────────────────────
// Middleware stack configuration — exported for testing

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config/app');
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const { registerRoutes } = require('./routes/index');

const app = express();

// ── Global Middleware Stack ───────────────────────────────────────────────

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Request tracing
app.use(requestId);

// CORS
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = config.cors.origin;
    const match = allowed.some(entry => {
      if (typeof entry === 'string') return entry === origin;
      if (entry instanceof RegExp) return entry.test(origin);
      return false;
    });
    if (match) return cb(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: config.cors.credentials,
}));

// Parsing
app.use(express.json({ limit: config.bodyLimit }));
app.use(cookieParser());

// Logging
app.use(morgan(config.morganFormat, {
  skip: (req) => req.url === '/health' || req.url === '/api/health',
}));

// Compression
app.use(compression());

// ── Routes ────────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
