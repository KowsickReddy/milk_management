// ── Server Entry Point ────────────────────────────────────────────────────
// Initializes database, runs migrations, seeds, then starts the server

require('dotenv').config();

const app = require('./app');
const { initializeDatabase } = require('./config/database');
const { createTables } = require('./utils/schema');
const { runMigrations } = require('./migrations/index');
const { seedAdmin } = require('./seeds/adminSeed');

const config = require('./config/app');

async function start() {
  try {
    // 1. Connect to database
    await initializeDatabase(true);
    
    // 2. Create tables if not exist
    await createTables();
    
    // 3. Run schema migrations
    await runMigrations();
    
    // 4. Seed default admin
    await seedAdmin();
    
    // 5. Start server
    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  API: http://localhost:${config.port}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown — close DB pool and exit
const { getPool } = require('./config/database');

async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    const pool = getPool();
    if (pool) await pool.end();
    console.log('Database pool closed.');
  } catch (err) {
    console.error('Error during shutdown:', err.message);
  }
  process.exit(0);
}

// Ensure pool.end() works with pg (both mysql2 and pg have .end())

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Only auto-start when run directly (not when imported by tests)
if (require.main === module) {
  start();
} else {
}

// Always export the app for testing
module.exports = app;

