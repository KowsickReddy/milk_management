// ── Migration 003: Route Area (PostgreSQL) ──────────────────────────────
// Adds route_area column to customers

const { getPool } = require('../config/database');

async function up(repo) {
  const hasRouteArea = await repo.columnExists('customers', 'route_area');
  if (!hasRouteArea) {
    await getPool().query(
      "ALTER TABLE customers ADD COLUMN route_area VARCHAR(100) DEFAULT 'Default'"
    );
    console.log('✓ Migration 003: route_area added to customers');
  }
}

module.exports = { up };
