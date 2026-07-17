// ── Database Configuration (PostgreSQL) ──────────────────────────────────
// Connection pooling, retry logic, health checks, and transaction support
// Pool is created at module load time

require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * Determine SSL config based on the database target.
 * Cloud providers (Supabase, Neon, Railway, Render, Aiven) require SSL.
 * Localhost connections should NOT use SSL.
 * Can be overridden by setting DB_SSL=true or DB_SSL=false in env.
 */
function resolveSSLConfig() {
  // Explicit env var override
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DB_SSL === 'false') return false;

  // Auto-detect from DATABASE_URL or DB_HOST
  const url = process.env.DATABASE_URL || '';
  const host = process.env.DB_HOST || '';
  const cloudProviders = ['supabase.co', 'neon.tech', 'railway.app', 'aivencloud.com', 'render.com'];
  const isCloud = cloudProviders.some(provider => url.includes(provider) || host.includes(provider));
  if (isCloud) {
    return { rejectUnauthorized: false };
  }

  // Default: no SSL (safe for localhost and self-hosted PG)
  return false;
}

// Force IPv4 for cloud providers (IPv6 often unavailable on Render → Supabase)
const connectionFamily = process.env.DB_FAMILY ? parseInt(process.env.DB_FAMILY, 10) : undefined;

// Build connection config from individual env vars or DATABASE_URL
const dbConfig = (() => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: resolveSSLConfig(),
      family: connectionFamily || 4,  // Default to IPv4 for cloud connections
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }
  // Fall back to individual params (local dev or cloud with DB_* vars)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'milk_management_db',
    ssl: resolveSSLConfig(),
    family: connectionFamily || 4,  // Always default to IPv4 for consistent cloud connections
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
})();

// Create pool at module load time
const pool = new Pool(dbConfig);

let initialized = false;

// ── ON UPDATE CURRENT_TIMESTAMP trigger ──────────────────────────────
// PostgreSQL does not support ON UPDATE CURRENT_TIMESTAMP natively.
// This trigger function must be created during schema setup.

const TRIGGER_FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

/**
 * Create the trigger helper function in the database
 */
async function createUpdateTriggerFunction() {
  try {
    await pool.query(TRIGGER_FUNCTION_SQL);
  } catch (err) {
    // Ignore if function already exists or we don't have permission
    logger.debug('Trigger function setup (already exists or skipped): ' + err.message);
  }
}

/**
 * Apply an ON UPDATE CURRENT_TIMESTAMP trigger to a table
 * @param {string} tableName
 * @param {object} [connection] - optional pg client/pool for transactional use
 */
async function applyUpdatedAtTrigger(tableName, connection) {
  const conn = connection || pool;
  const triggerName = `set_updated_at_${tableName}`;
  try {
    await conn.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName}`);
    await conn.query(`
      CREATE TRIGGER ${triggerName}
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
  } catch (err) {
    logger.debug(`Trigger for ${tableName} skipped: ${err.message}`);
  }
}

// ── Pool helpers ─────────────────────────────────────────────────────

/**
 * Get the database connection pool
 * @returns {Pool}
 */
function getPool() {
  return pool;
}

/**
 * Initialize the database — tests the connection
 * @param {boolean} retry - Whether to retry on failure
 * @returns {Promise<Pool>}
 */
async function initializeDatabase(retry = true) {
  if (initialized) return pool;

  const maxRetries = 3;
  let attempt = 0;

  while (true) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info('Database connected successfully (PostgreSQL)');
      initialized = true;
      return pool;
    } catch (error) {
      attempt++;
      if (!retry || attempt >= maxRetries) {
        logger.error(`Database connection failed after ${attempt} attempts: ${error.message}`);
        throw error;
      }
      logger.info(`Retrying database connection (${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Check database health
 * @returns {Promise<{ok: boolean, latency: number, error?: string}>}
 */
async function checkHealth() {
  const start = Date.now();
  try {
    await pool.query('SELECT 1 AS ok');
    return { ok: true, latency: Date.now() - start };
  } catch (error) {
    return { ok: false, latency: Date.now() - start, error: error.message };
  }
}

/**
 * Get a client from the pool (for transaction support)
 * @returns {Promise<Client>}
 */
async function getConnection() {
  return await pool.connect();
}

/**
 * Execute a transaction with automatic commit/rollback
 * @param {Function} callback - async (client) => { ... }
 * @returns {Promise<any>} - Result of the callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  checkHealth,
  getConnection,
  withTransaction,
  dbConfig,
  createUpdateTriggerFunction,
  applyUpdatedAtTrigger,
};
