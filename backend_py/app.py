import os
import sys
import json
from datetime import datetime, date
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

app = Flask(__name__)

# ==================== CORS CONFIGURATION ====================
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://dairypro.netlify.app',
], supports_credentials=True)

# ==================== DATABASE CONFIG ====================
def get_db():
    """Get a new database connection for each request."""
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'root'),
        database=os.getenv('DB_NAME', 'milk_management_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )

# Custom JSON serializer for datetime objects
from flask.json.provider import DefaultJSONProvider

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)

# ==================== HELPER ====================
def to_dict(row):
    """Convert a row dict to JSON-serializable format."""
    if row is None:
        return None
    result = {}
    for key, value in row.items():
        if isinstance(value, (datetime, date)):
            result[key] = value.isoformat()
        elif isinstance(value, bytes):
            result[key] = value.decode('utf-8')
        else:
            result[key] = value
    return result

def to_list(rows):
    """Convert a list of rows to JSON-serializable format."""
    return [to_dict(r) for r in rows]


# ==================== HEALTH CHECK ====================
@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'message': 'Milk Management Backend API is running',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'health': '/health',
            'customers': '/api/customers',
            'deliveries': '/api/deliveries',
            'bills': '/api/bills',
            'payments': '/api/payments',
            'expenses': '/api/expenses',
            'users': '/api/users',
            'analytics': '/api/analytics/dashboard',
        }
    })


# ==================== CUSTOMERS ROUTES ====================
@app.route('/api/customers', methods=['GET'])
def get_customers():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM customers ORDER BY customer_type DESC, name ASC')
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/customers/<int:id>', methods=['GET'])
def get_customer(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM customers WHERE id = %s', [id])
            row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Customer not found'}), 404
        return jsonify(to_dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/customers', methods=['POST'])
def create_customer():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO customers
                (name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status,
                 default_milk_quantity, customer_type, credit_balance)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    data.get('name'),
                    data.get('phone'),
                    data.get('address', ''),
                    float(data.get('daily_milk_quantity', 0)),
                    float(data.get('milk_rate_per_liter', 0)),
                    data.get('shift', 'morning'),
                    data.get('status', 'active'),
                    float(data.get('daily_milk_quantity', 0)),
                    data.get('customer_type', 'regular'),
                    float(data.get('credit_balance', 0)),
                ]
            )
            conn.commit()
            cur.execute('SELECT * FROM customers WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except pymysql.err.IntegrityError as e:
        if 'Duplicate' in str(e):
            return jsonify({'error': 'Phone number already exists!'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE customers
                SET name = %s, phone = %s, address = %s, daily_milk_quantity = %s,
                    milk_rate_per_liter = %s, shift = %s, status = %s, customer_type = %s,
                    credit_balance = %s, updated_at = NOW()
                WHERE id = %s""",
                [
                    data.get('name'),
                    data.get('phone'),
                    data.get('address', ''),
                    float(data.get('daily_milk_quantity', 0)),
                    float(data.get('milk_rate_per_liter', 0)),
                    data.get('shift', 'morning'),
                    data.get('status', 'active'),
                    data.get('customer_type', 'regular'),
                    float(data.get('credit_balance', 0)),
                    id,
                ]
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Customer not found'}), 404
            cur.execute('SELECT * FROM customers WHERE id = %s', [id])
            row = cur.fetchone()
        return jsonify(to_dict(row))
    except pymysql.err.IntegrityError as e:
        if 'Duplicate' in str(e):
            return jsonify({'error': 'Phone number already exists!'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id FROM customers WHERE id = %s', [id])
            if not cur.fetchone():
                return jsonify({'error': 'Customer not found'}), 404
            cur.execute(
                """DELETE d, b, p FROM customers c
                LEFT JOIN deliveries d ON c.id = d.customer_id
                LEFT JOIN bills b ON c.id = b.customer_id
                LEFT JOIN payments p ON c.id = p.customer_id
                WHERE c.id = %s""", [id]
            )
            cur.execute('DELETE FROM customers WHERE id = %s', [id])
            conn.commit()
        return jsonify({'message': 'Customer and related records deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== DELIVERIES ROUTES ====================
@app.route('/api/deliveries', methods=['GET'])
def get_deliveries():
    conn = get_db()
    try:
        date_filter = request.args.get('date')
        shift = request.args.get('shift')
        customer_id = request.args.get('customerId')

        sql = 'SELECT * FROM deliveries WHERE 1=1'
        params = []
        if date_filter:
            sql += ' AND date = %s'
            params.append(date_filter)
        if shift and shift != 'all':
            sql += ' AND delivery_shift = %s'
            params.append(shift)
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        sql += ' ORDER BY date DESC, created_at DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/deliveries', methods=['POST'])
def create_delivery():
    conn = get_db()
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')

        with conn.cursor() as cur:
            cur.execute('SELECT name FROM customers WHERE id = %s', [customer_id])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            effective_session = data.get('session') or data.get('delivery_shift') or 'morning'

            cur.execute(
                """INSERT INTO deliveries
                (customer_id, customer_name, date, session, scheduled_quantity,
                 delivered_quantity, delivered, `leave`, delivery_shift, extra_milk)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    delivered = VALUES(delivered),
                    delivered_quantity = VALUES(delivered_quantity),
                    `leave` = VALUES(`leave`),
                    extra_milk = VALUES(extra_milk)""",
                [
                    customer_id,
                    customer['name'],
                    data.get('date'),
                    effective_session,
                    float(data.get('scheduled_quantity', 0)),
                    float(data.get('delivered_quantity', 0)),
                    1 if data.get('delivered') else 0,
                    1 if data.get('leave') else 0,
                    effective_session,
                    float(data.get('extra_milk', 0)),
                ]
            )
            conn.commit()

            if cur.lastrowid > 0:
                record_id = cur.lastrowid
            else:
                cur.execute(
                    'SELECT id FROM deliveries WHERE customer_id = %s AND date = %s AND delivery_shift = %s',
                    [customer_id, data.get('date'), effective_session]
                )
                record_id = cur.fetchone()['id']

            cur.execute('SELECT * FROM deliveries WHERE id = %s', [record_id])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== BILLS ROUTES ====================
@app.route('/api/bills', methods=['GET'])
def get_bills():
    conn = get_db()
    try:
        paid = request.args.get('paid')
        customer_id = request.args.get('customerId')

        sql = 'SELECT * FROM bills WHERE 1=1'
        params = []
        if paid is not None:
            sql += ' AND paid = %s'
            params.append(paid == 'true')
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        sql += ' ORDER BY bill_year DESC, bill_month DESC, created_at DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/bills/<int:id>', methods=['GET'])
def get_bill(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM bills WHERE id = %s', [id])
            row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Bill not found'}), 404
        return jsonify(to_dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/bills', methods=['POST'])
def create_bill():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute('SELECT name FROM customers WHERE id = %s', [data.get('customer_id')])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            cur.execute(
                """INSERT INTO bills
                (customer_id, customer_name, bill_month, bill_year, bill_start_date, bill_end_date,
                 total_quantity, total_amount, sent_to_customer, paid, payment_date, amount_paid,
                 balance, outstanding_balance)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    data.get('customer_id'),
                    customer['name'],
                    data.get('bill_month'),
                    data.get('bill_year'),
                    data.get('bill_start_date'),
                    data.get('bill_end_date'),
                    float(data.get('total_quantity', 0)),
                    float(data.get('total_amount', 0)),
                    1 if data.get('sent_to_customer') else 0,
                    1 if data.get('paid') else 0,
                    data.get('payment_date'),
                    float(data.get('amount_paid', 0)),
                    float(data.get('balance', 0)),
                    float(data.get('outstanding_balance', 0)),
                ]
            )
            conn.commit()
            cur.execute('SELECT * FROM bills WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/bills/<int:id>', methods=['PUT'])
def update_bill(id):
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE bills SET paid = %s, payment_date = %s, amount_paid = %s, balance = %s, updated_at = NOW() WHERE id = %s',
                [
                    1 if data.get('paid') else 0,
                    data.get('payment_date'),
                    float(data.get('amount_paid', 0)),
                    float(data.get('balance', 0)),
                    id,
                ]
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Bill not found'}), 404
            cur.execute('SELECT * FROM bills WHERE id = %s', [id])
            row = cur.fetchone()
        return jsonify(to_dict(row))
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/bills/<int:id>', methods=['DELETE'])
def delete_bill(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM bills WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Bill not found'}), 404
        return jsonify({'message': 'Bill deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== PAYMENTS ROUTES ====================
@app.route('/api/payments', methods=['GET'])
def get_payments():
    conn = get_db()
    try:
        bill_id = request.args.get('billId')
        customer_id = request.args.get('customerId')

        sql = 'SELECT * FROM payments WHERE 1=1'
        params = []
        if bill_id:
            sql += ' AND bill_id = %s'
            params.append(bill_id)
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        sql += ' ORDER BY payment_date DESC, created_at DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/payments', methods=['POST'])
def create_payment():
    conn = get_db()
    try:
        data = request.get_json()
        amount_paid = float(data.get('amount_paid', 0) or 0)

        if not data.get('bill_id') or not data.get('customer_id') or amount_paid <= 0:
            return jsonify({'error': 'bill_id, customer_id, and valid amount_paid are required'}), 400

        with conn.cursor() as cur:
            cur.execute('SELECT total_amount, amount_paid, balance FROM bills WHERE id = %s', [data['bill_id']])
            bill = cur.fetchone()
            if not bill:
                return jsonify({'error': 'Bill not found'}), 404

            current_balance = float(bill['balance'] or 0)
            total_amount = float(bill['total_amount'] or 0)
            already_paid = float(bill['amount_paid'] or 0)

            cur.execute(
                """INSERT INTO payments
                (bill_id, customer_id, amount_paid, change_given, payment_method,
                 is_partial, is_full_with_change, change_amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    data['bill_id'],
                    data['customer_id'],
                    amount_paid,
                    float(data.get('change_given', 0)),
                    data.get('payment_method', 'cash'),
                    1 if data.get('is_partial') else 0,
                    1 if data.get('is_full_with_change') else 0,
                    float(data.get('change_amount', 0)),
                ]
            )
            payment_id = cur.lastrowid

            new_total_paid = already_paid + amount_paid
            is_fully_paid = new_total_paid >= total_amount
            new_balance = 0 if is_fully_paid else total_amount - new_total_paid

            cur.execute(
                'UPDATE bills SET amount_paid = %s, paid = %s, balance = %s, updated_at = NOW() WHERE id = %s',
                [new_total_paid, 1 if is_fully_paid else 0, new_balance, data['bill_id']]
            )

            excess_credit = 0
            if new_balance <= 0 and amount_paid > current_balance:
                excess_credit = amount_paid - current_balance
                if excess_credit > 0:
                    cur.execute(
                        'UPDATE customers SET credit_balance = credit_balance + %s WHERE id = %s',
                        [excess_credit, data['customer_id']]
                    )

            conn.commit()

            cur.execute('SELECT * FROM payments WHERE id = %s', [payment_id])
            row = to_dict(cur.fetchone())

            if excess_credit > 0:
                row['credit_added'] = excess_credit
                row['message'] = f'₹{excess_credit} added to customer credit balance'

        return jsonify(row), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== CREDIT ROUTES ====================
@app.route('/api/credits/<int:customer_id>', methods=['GET'])
def get_credit(customer_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id, name, credit_balance FROM customers WHERE id = %s', [customer_id])
            row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Customer not found'}), 404
        return jsonify({
            'customer_id': row['id'],
            'customer_name': row['name'],
            'credit_balance': float(row['credit_balance'] or 0),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/credits/apply', methods=['POST'])
def apply_credit():
    conn = get_db()
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0) or 0)

        if not data.get('customer_id') or not data.get('bill_id') or amount <= 0:
            return jsonify({'error': 'customer_id, bill_id, and amount are required'}), 400

        with conn.cursor() as cur:
            cur.execute('SELECT credit_balance FROM customers WHERE id = %s', [data['customer_id']])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            available = float(customer['credit_balance'] or 0)
            apply_amount = min(amount, available)

            if apply_amount <= 0:
                return jsonify({'error': 'No credit available to apply'}), 400

            cur.execute('SELECT balance, total_amount FROM bills WHERE id = %s', [data['bill_id']])
            bill = cur.fetchone()
            if not bill:
                return jsonify({'error': 'Bill not found'}), 404

            bill_balance = float(bill['balance'] or 0)
            credit_to_apply = min(apply_amount, bill_balance)

            if credit_to_apply <= 0:
                return jsonify({'error': 'Bill has no balance to apply credit to'}), 400

            cur.execute(
                'UPDATE bills SET amount_paid = amount_paid + %s, balance = GREATEST(0, balance - %s), updated_at = NOW() WHERE id = %s',
                [credit_to_apply, credit_to_apply, data['bill_id']]
            )
            cur.execute(
                'UPDATE customers SET credit_balance = credit_balance - %s WHERE id = %s',
                [credit_to_apply, data['customer_id']]
            )
            conn.commit()

        return jsonify({
            'message': f'Credit of ₹{credit_to_apply} applied successfully',
            'credit_applied': credit_to_apply,
            'remaining_credit': available - credit_to_apply,
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/bills/unpaid-with-credit', methods=['GET'])
def get_unpaid_bills_with_credit():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*, c.credit_balance
                FROM bills b
                JOIN customers c ON b.customer_id = c.id
                WHERE b.paid = 0
                ORDER BY b.bill_year DESC, b.bill_month DESC"""
            )
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== LONG LEAVES ROUTES ====================
@app.route('/api/long-leaves', methods=['GET'])
def get_long_leaves():
    conn = get_db()
    try:
        customer_id = request.args.get('customerId')
        sql = 'SELECT * FROM long_leaves WHERE 1=1'
        params = []
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        sql += ' ORDER BY start_date DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/long-leaves', methods=['POST'])
def create_long_leave():
    conn = get_db()
    try:
        data = request.get_json()
        if not data.get('customer_id') or not data.get('start_date') or not data.get('end_date'):
            return jsonify({'error': 'customer_id, start_date, and end_date are required'}), 400

        with conn.cursor() as cur:
            cur.execute('SELECT name FROM customers WHERE id = %s', [data['customer_id']])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            cur.execute(
                'INSERT INTO long_leaves (customer_id, customer_name, start_date, end_date, reason) VALUES (%s, %s, %s, %s, %s)',
                [data['customer_id'], customer['name'], data['start_date'], data['end_date'], data.get('reason', '')]
            )
            conn.commit()
            cur.execute('SELECT * FROM long_leaves WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/long-leaves/<int:id>', methods=['PUT'])
def update_long_leave(id):
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE long_leaves SET start_date = %s, end_date = %s, reason = %s, updated_at = NOW() WHERE id = %s',
                [data.get('start_date'), data.get('end_date'), data.get('reason', ''), id]
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Leave entry not found'}), 404
            cur.execute('SELECT * FROM long_leaves WHERE id = %s', [id])
            row = cur.fetchone()
        return jsonify(to_dict(row))
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/long-leaves/<int:id>', methods=['DELETE'])
def delete_long_leave(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM long_leaves WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Leave entry not found'}), 404
        return jsonify({'message': 'Leave entry deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== LONG EXTRA MILK ROUTES ====================
@app.route('/api/long-extra-milk', methods=['GET'])
def get_long_extra_milk():
    conn = get_db()
    try:
        customer_id = request.args.get('customerId')
        sql = 'SELECT * FROM long_extra_milk WHERE 1=1'
        params = []
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        sql += ' ORDER BY start_date DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/long-extra-milk', methods=['POST'])
def create_long_extra_milk():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute('SELECT name FROM customers WHERE id = %s', [data['customer_id']])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            cur.execute(
                'INSERT INTO long_extra_milk (customer_id, customer_name, start_date, end_date, daily_extra_quantity, reason) VALUES (%s, %s, %s, %s, %s, %s)',
                [data['customer_id'], customer['name'], data['start_date'], data['end_date'],
                 float(data.get('daily_extra_quantity', 0)), data.get('reason', '')]
            )
            conn.commit()
            cur.execute('SELECT * FROM long_extra_milk WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/long-extra-milk/<int:id>', methods=['DELETE'])
def delete_long_extra_milk(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM long_extra_milk WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Extra milk entry not found'}), 404
        return jsonify({'message': 'Extra milk entry deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== EXTRA MILK ROUTES ====================
@app.route('/api/extra-milk', methods=['GET'])
def get_extra_milk():
    conn = get_db()
    try:
        customer_id = request.args.get('customerId')
        date_filter = request.args.get('date')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')

        sql = 'SELECT * FROM extra_milk WHERE 1=1'
        params = []
        if customer_id:
            sql += ' AND customer_id = %s'
            params.append(customer_id)
        if date_filter:
            sql += ' AND date = %s'
            params.append(date_filter)
        if start_date and end_date:
            sql += ' AND date BETWEEN %s AND %s'
            params.extend([start_date, end_date])
        sql += ' ORDER BY date DESC, created_at DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/extra-milk', methods=['POST'])
def create_extra_milk():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute('SELECT name FROM customers WHERE id = %s', [data['customer_id']])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            entries = []
            if data.get('type') == 'range' and data.get('start_date') and data.get('end_date'):
                from datetime import timedelta
                current = datetime.strptime(data['start_date'], '%Y-%m-%d')
                end = datetime.strptime(data['end_date'], '%Y-%m-%d')
                while current <= end:
                    entries.append([
                        data['customer_id'], customer['name'], current.strftime('%Y-%m-%d'),
                        float(data.get('extra_quantity', 0)), 'range',
                        data['start_date'], data['end_date'], data.get('reason', '')
                    ])
                    current += timedelta(days=1)
            else:
                entries.append([
                    data['customer_id'], customer['name'], data.get('date'),
                    float(data.get('extra_quantity', 0)), 'single_day',
                    None, None, data.get('reason', '')
                ])

            if not entries:
                return jsonify({'error': 'No entries to insert'}), 400

            cur.executemany(
                """INSERT INTO extra_milk
                (customer_id, customer_name, date, extra_quantity, type, start_date, end_date, reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                entries
            )
            conn.commit()

        return jsonify({
            'message': f'Added {len(entries)} extra milk entr{"y" if len(entries) == 1 else "ies"}',
            'count': len(entries),
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/extra-milk/<int:id>', methods=['DELETE'])
def delete_extra_milk(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM extra_milk WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Extra milk entry not found'}), 404
        return jsonify({'message': 'Extra milk entry deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== EXPENSES ROUTES ====================
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    conn = get_db()
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        category = request.args.get('category')

        sql = 'SELECT * FROM expenses WHERE 1=1'
        params = []
        if start_date:
            sql += ' AND expense_date >= %s'
            params.append(start_date)
        if end_date:
            sql += ' AND expense_date <= %s'
            params.append(end_date)
        if category:
            sql += ' AND category = %s'
            params.append(category)
        sql += ' ORDER BY expense_date DESC'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/expenses', methods=['POST'])
def create_expense():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO expenses (category, amount, description, expense_date) VALUES (%s, %s, %s, %s)',
                [data.get('category'), float(data.get('amount', 0)),
                 data.get('description', ''), data.get('expense_date', datetime.now().strftime('%Y-%m-%d'))]
            )
            conn.commit()
            cur.execute('SELECT * FROM expenses WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE expenses SET category = %s, amount = %s, description = %s, expense_date = %s WHERE id = %s',
                [data.get('category'), float(data.get('amount', 0)),
                 data.get('description', ''), data.get('expense_date'), id]
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Expense not found'}), 404
            cur.execute('SELECT * FROM expenses WHERE id = %s', [id])
            row = cur.fetchone()
        return jsonify(to_dict(row))
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM expenses WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Expense not found'}), 404
        return jsonify({'message': 'Expense deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== PRICE HISTORY ROUTES ====================
@app.route('/api/price-history', methods=['GET'])
def get_price_history():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM milk_price_history ORDER BY effective_date DESC')
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/price-history', methods=['POST'])
def create_price_history():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO milk_price_history (rate_per_liter, effective_date, reason, created_by) VALUES (%s, %s, %s, %s)',
                [float(data.get('rate_per_liter', 0)),
                 data.get('effective_date', datetime.now().strftime('%Y-%m-%d')),
                 data.get('reason', ''), data.get('created_by', '')]
            )
            conn.commit()
            cur.execute('SELECT * FROM milk_price_history WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== ALERTS ROUTES ====================
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    conn = get_db()
    try:
        user_id = request.args.get('userId')
        unread_only = request.args.get('unreadOnly')

        sql = 'SELECT * FROM alerts WHERE 1=1'
        params = []
        if user_id:
            sql += ' AND user_id = %s'
            params.append(user_id)
        if unread_only == 'true':
            sql += ' AND is_read = FALSE'
        sql += ' ORDER BY created_at DESC LIMIT 50'

        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/alerts/<int:id>/read', methods=['PUT'])
def mark_alert_read(id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('UPDATE alerts SET is_read = TRUE WHERE id = %s', [id])
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({'error': 'Alert not found'}), 404
        return jsonify({'message': 'Alert marked as read'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/alerts', methods=['POST'])
def create_alert():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO alerts (user_id, alert_type, message) VALUES (%s, %s, %s)',
                [data.get('user_id'), data.get('alert_type'), data.get('message')]
            )
            conn.commit()
            cur.execute('SELECT * FROM alerts WHERE id = %s', [cur.lastrowid])
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== USERS ROUTES ====================
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, username, role, full_name, phone, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
            )
            rows = cur.fetchall()
        return jsonify(to_list(rows))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/users', methods=['POST'])
def create_user():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO users (username, pin, role, full_name, phone) VALUES (%s, %s, %s, %s, %s)',
                [data.get('username'), data.get('pin'), data.get('role', 'worker'),
                 data.get('full_name'), data.get('phone')]
            )
            conn.commit()
            cur.execute(
                'SELECT id, username, role, full_name, phone, is_active, last_login, created_at FROM users WHERE id = %s',
                [cur.lastrowid]
            )
            row = cur.fetchone()
        return jsonify(to_dict(row)), 201
    except pymysql.err.IntegrityError as e:
        if 'Duplicate' in str(e):
            return jsonify({'error': 'Username already exists!'}), 400
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/users/login', methods=['POST'])
def user_login():
    conn = get_db()
    try:
        data = request.get_json()
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, username, role, full_name, phone, is_active, last_login, created_at FROM users WHERE username = %s AND pin = %s AND is_active = TRUE',
                [data.get('username'), data.get('pin')]
            )
            user = cur.fetchone()
            if not user:
                return jsonify({'error': 'Invalid credentials or account inactive'}), 401

            cur.execute('UPDATE users SET last_login = NOW() WHERE id = %s', [user['id']])
            conn.commit()

            result = to_dict(user)
            result['message'] = 'Login successful'
            return jsonify(result)
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== ANALYTICS ROUTES ====================
@app.route('/api/analytics/dashboard', methods=['GET'])
def analytics_dashboard():
    conn = get_db()
    try:
        today = datetime.now().strftime('%Y-%m-%d')

        with conn.cursor() as cur:
            cur.execute('SELECT COUNT(*) as total FROM deliveries WHERE date = %s', [today])
            total_deliveries = cur.fetchone()['total']

            cur.execute('SELECT COUNT(*) as delivered FROM deliveries WHERE date = %s AND delivered = TRUE', [today])
            delivered = cur.fetchone()['delivered']

            cur.execute('SELECT COUNT(*) as on_leave FROM deliveries WHERE date = %s AND `leave` = TRUE', [today])
            on_leave = cur.fetchone()['on_leave']

            cur.execute('SELECT COUNT(*) as total_customers FROM customers WHERE status = "active"')
            total_customers = cur.fetchone()['total_customers']

            cur.execute(
                'SELECT COALESCE(SUM(total_amount), 0) as monthly_income FROM bills WHERE bill_year = YEAR(CURDATE()) AND bill_month = MONTH(CURDATE())'
            )
            monthly_income = cur.fetchone()['monthly_income']

        return jsonify({
            'date': today,
            'total_deliveries': int(total_deliveries),
            'delivered': int(delivered),
            'on_leave': int(on_leave),
            'total_customers': int(total_customers),
            'monthly_income': float(monthly_income),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/analytics/earnings', methods=['GET'])
def analytics_earnings():
    conn = get_db()
    try:
        year = request.args.get('year', datetime.now().year)
        month = request.args.get('month', datetime.now().month)

        with conn.cursor() as cur:
            cur.execute(
                'SELECT COALESCE(SUM(total_amount), 0) as total_billed, COALESCE(SUM(amount_paid), 0) as total_paid, COALESCE(SUM(balance), 0) as total_pending FROM bills WHERE bill_year = %s AND bill_month = %s',
                [year, month]
            )
            bill = cur.fetchone()

            cur.execute(
                'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE YEAR(expense_date) = %s AND MONTH(expense_date) = %s',
                [year, month]
            )
            expense = cur.fetchone()

        total_billed = float(bill['total_billed'])
        total_paid = float(bill['total_paid'])
        total_pending = float(bill['total_pending'])
        total_expenses = float(expense['total_expenses'])

        return jsonify({
            'year': int(year),
            'month': int(month),
            'total_billed': total_billed,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'total_expenses': total_expenses,
            'profit': total_paid - total_expenses,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== REPORTS ROUTES ====================
@app.route('/api/reports/daily', methods=['GET'])
def report_daily():
    conn = get_db()
    try:
        date_filter = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

        with conn.cursor() as cur:
            cur.execute(
                'SELECT * FROM deliveries WHERE date = %s ORDER BY delivery_shift, customer_name',
                [date_filter]
            )
            deliveries = cur.fetchall()

            cur.execute(
                """SELECT COUNT(*) as total_deliveries,
                SUM(CASE WHEN delivered = TRUE THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN `leave` = TRUE THEN 1 ELSE 0 END) as leave_count,
                SUM(CASE WHEN delivered = TRUE THEN delivered_quantity ELSE 0 END) as total_milk,
                SUM(CASE WHEN delivered = TRUE THEN extra_milk ELSE 0 END) as total_extra_milk
                FROM deliveries WHERE date = %s""",
                [date_filter]
            )
            stats = cur.fetchone()

        return jsonify({
            'date': date_filter,
            'deliveries': to_list(deliveries),
            'summary': to_dict(stats),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/reports/monthly', methods=['GET'])
def report_monthly():
    conn = get_db()
    try:
        year = int(request.args.get('year', datetime.now().year))
        month = int(request.args.get('month', datetime.now().month))

        with conn.cursor() as cur:
            cur.execute(
                """SELECT c.name as customer_name,
                COUNT(d.id) as total_days,
                SUM(CASE WHEN d.delivered = TRUE THEN 1 ELSE 0 END) as delivered_days,
                SUM(CASE WHEN d.`leave` = TRUE THEN 1 ELSE 0 END) as leave_days,
                SUM(CASE WHEN d.delivered = TRUE THEN d.delivered_quantity ELSE 0 END) as total_milk,
                SUM(CASE WHEN d.delivered = TRUE THEN d.extra_milk ELSE 0 END) as total_extra_milk,
                c.milk_rate_per_liter,
                (SUM(CASE WHEN d.delivered = TRUE THEN d.delivered_quantity ELSE 0 END) +
                 SUM(CASE WHEN d.delivered = TRUE THEN d.extra_milk ELSE 0 END)) * c.milk_rate_per_liter as total_amount
                FROM customers c
                LEFT JOIN deliveries d ON c.id = d.customer_id AND YEAR(d.date) = %s AND MONTH(d.date) = %s
                GROUP BY c.id
                ORDER BY c.name""",
                [year, month]
            )
            customers = cur.fetchall()

        return jsonify({
            'year': year,
            'month': month,
            'customers': to_list(customers),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/reports/customer/<int:id>', methods=['GET'])
def report_customer(id):
    conn = get_db()
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')

        with conn.cursor() as cur:
            cur.execute('SELECT * FROM customers WHERE id = %s', [id])
            customer = cur.fetchone()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404

            delivery_sql = 'SELECT * FROM deliveries WHERE customer_id = %s'
            delivery_params = [id]
            if start_date:
                delivery_sql += ' AND date >= %s'
                delivery_params.append(start_date)
            if end_date:
                delivery_sql += ' AND date <= %s'
                delivery_params.append(end_date)
            delivery_sql += ' ORDER BY date DESC'
            cur.execute(delivery_sql, delivery_params)
            deliveries = cur.fetchall()

            cur.execute(
                'SELECT * FROM bills WHERE customer_id = %s ORDER BY bill_year DESC, bill_month DESC LIMIT 12',
                [id]
            )
            bills = cur.fetchall()

        return jsonify({
            'customer': to_dict(customer),
            'deliveries': to_list(deliveries),
            'bills': to_list(bills),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==================== START SERVER ====================
if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    print(f'[STARTED] Milk Management Backend (Python/Flask) running on port {PORT}')
    print(f'[ENV] Environment: development')
    print(f'[CORS] Open for localhost and deployed frontends')
    app.run(host='0.0.0.0', port=PORT, debug=True)
