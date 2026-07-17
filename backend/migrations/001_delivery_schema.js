// ── Migration 001: Delivery Schema (PostgreSQL) ──────────────────────────
// Adds status and is_deleted columns, migrates old data, drops old columns

const { getPool } = require('../config/database');

async function up(repo) {
  const hasStatus = await repo.columnExists('deliveries', 'status');
  const hasIsDeleted = await repo.columnExists('deliveries', 'is_deleted');
  const hasDelivered = await repo.columnExists('deliveries', 'delivered');
  const hasLeave = await repo.columnExists('deliveries', 'leave');

  if (!hasStatus) {
    await getPool().query(
      "ALTER TABLE deliveries ADD COLUMN status VARCHAR(20) DEFAULT 'delivered' CHECK (status IN ('delivered','leave','extra'))"
    );
  }

  if (!hasIsDeleted) {
    await getPool().query(
      'ALTER TABLE deliveries ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE'
    );
  }

  if (hasDelivered || hasLeave) {
    const leaveCondition = hasLeave ? '"leave" = TRUE' : 'FALSE';
    await getPool().query(
      `UPDATE deliveries
       SET status = CASE
         WHEN ${leaveCondition} THEN 'leave'
         WHEN COALESCE(extra_milk, 0) > 0 THEN 'extra'
         ELSE 'delivered'
       END
       WHERE status IS NULL OR status = 'delivered'`
    );

    if (hasDelivered) {
      await getPool().query('ALTER TABLE deliveries DROP COLUMN IF EXISTS delivered');
    }

    if (hasLeave) {
      await getPool().query('ALTER TABLE deliveries DROP COLUMN IF EXISTS "leave"');
    }
  }

  console.log('✓ Migration 001: Delivery schema updated');
}

module.exports = { up };
