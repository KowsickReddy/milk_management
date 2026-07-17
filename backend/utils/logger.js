// ── Logger Utility ────────────────────────────────────────────────────────
// Structured logging with timestamps

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

const logger = {
  error: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) console.error(formatMessage('error', message, meta));
  },
  warn: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) console.warn(formatMessage('warn', message, meta));
  },
  info: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) console.log(formatMessage('info', message, meta));
  },
  debug: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) console.log(formatMessage('debug', message, meta));
  },
};

module.exports = logger;
