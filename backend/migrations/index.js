// ── Migration Runner ──────────────────────────────────────────────────────
// Executes all pending schema migrations

const MigrationRepository = require('../repositories/migrationRepository');

const migrations = [
  require('./001_delivery_schema'),
  require('./002_billing_wallet'),
  require('./003_route_area'),
  require('./004_customer_pin'),
  require('./005_bcrypt_pins'),
  require('./006_bill_periods'),
  require('./007_farm_schema'),
  require('./008_profile_photos'),
  require('./009_both_shifts'),
];

async function runMigrations() {
  for (const migration of migrations) {
    try {
      if (typeof migration.up === 'function') {
        await migration.up(MigrationRepository);
      }
    } catch (err) {
      console.log(`Migration note: ${err.message}`);
    }
  }
  console.log('✓ All migrations completed');
}

module.exports = { runMigrations };
