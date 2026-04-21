const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function loadSeedData() {
  console.log('Connecting to MySQL...');
  let initialConn;
  try {
    initialConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
    });
    console.log('Ensuring database exists...');
    await initialConn.query('CREATE DATABASE IF NOT EXISTS milk_management_db');
    await initialConn.end();
  } catch (err) {
    console.error('Error creating database:', err);
    if (initialConn) await initialConn.end();
    return;
  }

  console.log('Connecting to milk_management_db...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'milk_management_db',
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'backend_py', 'seed_data.sql');
    console.log(`Reading SQL file from: ${sqlPath}`);
    let sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Clearing database and resetting auto-increments...');
    const clearSql = `
      SET FOREIGN_KEY_CHECKS = 0;
      TRUNCATE TABLE payments;
      TRUNCATE TABLE bills;
      TRUNCATE TABLE deliveries;
      TRUNCATE TABLE long_leaves;
      TRUNCATE TABLE extra_milk;
      TRUNCATE TABLE expenses;
      TRUNCATE TABLE milk_price_history;
      TRUNCATE TABLE alerts;
      TRUNCATE TABLE customers;
      SET FOREIGN_KEY_CHECKS = 1;
    `;
    await connection.query(clearSql);

    console.log('Executing SQL script...');
    // Remove the DELETE statements from the script if they exist to avoid double work
    // or just let them run (they will delete 0 rows)
    await connection.query(sql);

    console.log('Seed data loaded successfully!');
  } catch (error) {
    console.error('Failed to load seed data:', error);
  } finally {
    await connection.end();
  }
}

loadSeedData();