// ── Database Configuration (PostgreSQL) ──────────────────────────────────
// Connection pooling, retry logic, health checks, and transaction support
// Resolves hostname to IPv4 address explicitly to avoid IPv6 ENETUNREACH

require('dotenv').config();
const dns = require('dns');
const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * Determine SSL config based on the database target.
 * Cloud providers (Supabase, Neon, Railway, Render, Aiven) require SSL.
 * Can be overridden by setting DB_SSL=true or DB_SSL=false in env.
 */
function resolveSSLConfig() {
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DB_SSL === 'false') return false;

  const url = process.env.DATABASE_URL || '';
  const host = process.env.DB_HOST || '';
  const isCloud = ['supabase.co', 'neon.tech', 'railway.app', 'aivencloud.com', 'render.com']
    .some(p => url.includes(p) || host.includes(p));
  if (isCloud) return { rejectUnauthorized: false };

  return false;
}

/**
 * Resolve a hostname to its IPv4 address.
 * Some cloud providers (like Supabase) have IPv6 addresses that are
 * unreachable from Render. This forces IPv4 resolution.
 */
async function resolveHost4(hostname) {
  try {
    const addresses = await dns.promises.resolve4(hostname);
    if (addresses && addresses.length > 0) {
      logger.info(`Resolved ${hostname} → ${addresses[0]} (IPv4)`);
      return addresses[0];
    }
  } catch (err) {
    logger.warn(`DNS A-record lookup failed for ${hostname}: ${err.message}. Falling back to hostname.`);
  }
  return hostname;
}

// ── Pool Management ─────────────────────────────────────────────────────
// Pool is initially null; created by initializeDatabase()

let pool = null;
let initialized = false;
let resolvedHost = null;

/**
 * Build pool config, optionally overriding host with a resolved IPv4 address.
 */
function buildConfig(ipOverride) {
  const ssl = resolveSSLConfig();

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: ipOverride || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'milk_management_db',
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

/**
 * Get the database connection pool
 */
function getPool() {
  if (!pool) {
    // Fallback: create a pool with hostname (used before initializeDatabase is called)
    pool = new Pool(buildConfig(null));
  }
  return pool;
}

/**
 * Initialize the database — resolves IPv4, creates pool, tests connection
 */
async function initializeDatabase(retry = true) {
  if (initialized) return getPool();

  // Step 1: Resolve hostname to IPv4 address
  const hostname = process.env.DB_HOST || 
    (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : null);
  
  if (hostname && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // Not already an IP address — resolve it
    const ipv4 = await resolveHost4(hostname);
    if (ipv4 !== hostname) {
      resolvedHost = ipv4;
    }
  }

  // Step 2: Create pool (with resolved IPv4 if available)
  pool = new Pool(buildConfig(resolvedHost));

  // Step 3: Test connection with retries
  const maxRetries = 3;
  let attempt = 0;

  while (true) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info('Database connected successfully (PostgreSQL)' + 
        (resolvedHost ? ` via ${resolvedHost}` : ''));
      initialized = true;
      return pool;
    } catch (error) {
      attempt++;
      if (!retry || attempt >= maxRetries) {
        logger.error(`Database connection failed after ${attempt} attempts: ${error.message}`);
        // If IPv4 resolved but failed, try with original hostname
        if (resolvedHost) {
          logger.info('Retrying with original hostname...');
          pool = new Pool(buildConfig(null));
          resolvedHost = null;
          // One more try after switching back
          try {
            const client = await pool.connect();
            client.release();
            logger.info('Database connected successfully (PostgreSQL, via hostname fallback)');
            initialized = true;
            return pool;
          } catch (fallbackErr) {
            logger.error(`Fallback connection also failed: ${fallbackErr.message}`);
            throw error; // Throw original error
          }
        }
        throw error;
      }
      logger.info(`Retrying database connection (${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Check database health
 */
async function checkHealth() {
  const start = Date.now();
  try {
    await getPool().query('SELECT 1 AS ok');
    return { ok: true, latency: Date.now() - start };
  } catch (error) {
    return { ok: false, latency: Date.now() - start, error: error.message };
  }
}

/**
 * Get a client from the pool
 */
async function getConnection() {
  return await getPool().connect();
}

/**
 * Execute a transaction with auto commit/rollback
 */
async function withTransaction(callback) {
  const client = await getPool().connect();
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

/**
 * Create the ON UPDATE trigger function
 */
async function createUpdateTriggerFunction() {
  try {
    await getPool().query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;
    `);
  } catch (err) {
    logger.debug('Trigger function setup: ' + err.message);
  }
}

/**
 * Apply an ON UPDATE trigger to a table
 */
async function applyUpdatedAtTrigger(tableName, connection) {
  const conn = connection || getPool();
  try {
    await conn.query(`DROP TRIGGER IF EXISTS set_updated_at_${tableName} ON ${tableName}`);
    await conn.query(`CREATE TRIGGER set_updated_at_${tableName} BEFORE UPDATE ON ${tableName} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
  } catch (err) {
    logger.debug(`Trigger for ${tableName}: ${err.message}`);
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  checkHealth,
  getConnection,
  withTransaction,
  dbConfig: {},
  createUpdateTriggerFunction,
  applyUpdatedAtTrigger,
};
