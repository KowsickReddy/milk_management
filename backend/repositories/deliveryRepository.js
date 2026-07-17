// ── Delivery Repository (PostgreSQL) ──────────────────────────────────────
// All delivery-related database queries

const { getPool } = require('../config/database');

const DeliveryRepository = {
  async findAll({ date, customerId, startDate, endDate } = {}) {
    const params = [];
    let query = `SELECT d.*,
      (d.status IN ('delivered','extra')) AS delivered,
      (d.status = 'leave') AS "leave"
      FROM deliveries d WHERE d.is_deleted = FALSE`;

    if (date) {
      params.push(date);
      query += ` AND d.date = $${params.length}::date`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND d.date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND d.date <= $${params.length}`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND d.customer_id = $${params.length}`;
    }

    query += ' ORDER BY d.date DESC, d.created_at DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await getPool().query('SELECT * FROM deliveries WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCustomerAndDate(customerId, date, shift = 'morning') {
    const result = await getPool().query(
      'SELECT * FROM deliveries WHERE customer_id = $1 AND date = $2::date AND delivery_shift = $3 AND is_deleted = FALSE',
      [customerId, date, shift]
    );
    return result.rows[0] || null;
  },

  async upsert(data, connection) {
    const conn = connection || getPool();
    const {
      customer_id, customer_name, date, scheduled_quantity,
      delivered_quantity, status, extra_milk, delivery_shift,
    } = data;

    const result = await conn.query(
      `INSERT INTO deliveries
       (customer_id, customer_name, date, scheduled_quantity, delivered_quantity, status, extra_milk, delivery_shift, is_deleted)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, FALSE)
       ON CONFLICT (customer_id, date, delivery_shift) DO UPDATE SET
       customer_name = EXCLUDED.customer_name,
       scheduled_quantity = EXCLUDED.scheduled_quantity,
       delivered_quantity = EXCLUDED.delivered_quantity,
       status = EXCLUDED.status,
       extra_milk = EXCLUDED.extra_milk,
       is_deleted = FALSE
       RETURNING *`,
      [
        customer_id, customer_name, date,
        scheduled_quantity || 0,
        status === 'leave' ? 0 : (delivered_quantity || 0),
        status || 'delivered',
        status === 'leave' ? 0 : (extra_milk || 0),
        delivery_shift || 'morning',
      ]
    );

    // RETURNING * already returns the full record
    return result.rows[0] || data;
  },

  async upsertBatch(deliveries, connection) {
    const conn = connection || getPool();
    for (const d of deliveries) {
      await conn.query(
        `INSERT INTO deliveries
         (customer_id, customer_name, date, scheduled_quantity, delivered_quantity, status, extra_milk, delivery_shift, is_deleted)
         VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, FALSE)
         ON CONFLICT (customer_id, date, delivery_shift) DO UPDATE SET
         customer_name = EXCLUDED.customer_name,
         scheduled_quantity = EXCLUDED.scheduled_quantity,
         delivered_quantity = EXCLUDED.delivered_quantity,
         status = EXCLUDED.status,
         extra_milk = EXCLUDED.extra_milk,
         is_deleted = FALSE`,
        [
          d.customer_id, d.customer_name, d.date,
          d.scheduled_quantity || 0,
          d.status === 'leave' ? 0 : (d.delivered_quantity || 0),
          d.status || 'delivered',
          d.status === 'leave' ? 0 : (d.extra_milk || 0),
          d.delivery_shift || 'morning',
        ]
      );
    }
    return { count: deliveries.length };
  },

  async softDelete(id) {
    const result = await getPool().query('UPDATE deliveries SET is_deleted = TRUE WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async checkLongLeaveConflict(customerId, date, connection) {
    const conn = connection || getPool();
    const result = await conn.query(
      'SELECT id FROM leave_requests WHERE customer_id = $1 AND $2::date BETWEEN start_date AND end_date LIMIT 1',
      [customerId, date]
    );
    return result.rows.length > 0;
  },

  /**
   * Get deliveries with leave request overlay for a date
   * This combines actual deliveries with projected leave requests
   */
  async getWithLeaveOverlay({ date, customerId } = {}) {
    const params = [];
    let query = `
      SELECT
        CAST(d.id AS text) AS id,
        d.customer_id,
        d.customer_name,
        d.date,
        d.session,
        d.scheduled_quantity,
        d.delivered_quantity,
        d.status,
        d.extra_milk,
        d.quantity_overridden,
        d.delivery_shift,
        d.is_deleted,
        d.created_at,
        d.updated_at,
        (d.status IN ('delivered', 'extra')) AS delivered,
        (d.status = 'leave') AS "leave",
        NULL::int AS leave_request_id,
        'delivery'::text AS source
      FROM deliveries d
      WHERE d.is_deleted = FALSE`;

    if (date) {
      params.push(date);
      query += ` AND d.date = $${params.length}::date`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND d.customer_id = $${params.length}`;
    }

    if (date) {
      const dateIdx = params.length;
      params.push(date, date, date, date);
      query += `
        UNION ALL
        SELECT
          CAST(('leave-' || lr.id || '-' || c.id) AS text) AS id,
          c.id AS customer_id,
          c.name AS customer_name,
          $${dateIdx + 1}::date AS date,
          c.shift AS session,
          COALESCE(c.default_milk_quantity, c.daily_milk_quantity, 0) AS scheduled_quantity,
          0 AS delivered_quantity,
          'leave' AS status,
          0 AS extra_milk,
          FALSE AS quantity_overridden,
          c.shift AS delivery_shift,
          FALSE AS is_deleted,
          lr.created_at AS created_at,
          lr.created_at AS updated_at,
          FALSE AS delivered,
          TRUE AS "leave",
          lr.id AS leave_request_id,
          'leave_request' AS source
        FROM leave_requests lr
        JOIN customers c ON c.id = lr.customer_id
        WHERE $${dateIdx + 2}::date >= lr.start_date AND (lr.end_date IS NULL OR $${dateIdx + 3}::date <= lr.end_date)
          AND c.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM deliveries d2
            WHERE d2.customer_id = c.id
              AND d2.date = $${dateIdx + 4}::date
              AND d2.is_deleted = FALSE
          )`;

      if (customerId) {
        params.push(customerId);
        query += ` AND c.id = $${params.length}`;
      }
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  // Analytics queries
  async getTodayStats(date) {
    const totalDeliveries = await getPool().query(
      'SELECT COUNT(*)::int as count FROM deliveries WHERE date = $1::date AND is_deleted = FALSE', [date]);
    const delivered = await getPool().query(
      "SELECT COUNT(*)::int as count, COALESCE(SUM(delivered_quantity + extra_milk),0) as total_milk FROM deliveries WHERE date = $1::date AND is_deleted = FALSE AND status IN ('delivered','extra')", [date]);
    const onLeave = await getPool().query(
      "SELECT COUNT(*)::int as count FROM deliveries WHERE date = $1::date AND is_deleted = FALSE AND status = 'leave'", [date]);
    return {
      total: Number(totalDeliveries.rows[0].count),
      delivered: Number(delivered.rows[0].count),
      totalMilk: Number(delivered.rows[0].total_milk || 0),
      onLeave: Number(onLeave.rows[0].count),
    };
  },

  async getMonthMilkTotal(year, month) {
    const result = await getPool().query(
      "SELECT COALESCE(SUM(delivered_quantity + extra_milk),0) as total FROM deliveries WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2 AND is_deleted=FALSE AND status IN ('delivered','extra')",
      [year, month]
    );
    return Number(result.rows[0].total || 0);
  },
};

module.exports = DeliveryRepository;
