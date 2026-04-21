const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function loadSeedData() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'milk_management_db',
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, 'backend_py', 'seed_data.sql');
    console.log(`Reading SQL file from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL script...');
    await connection.query(sql);

    console.log('Seed data loaded successfully!');
  } catch (error) {
    console.error('Failed to load seed data:', error);
  } finally {
    await connection.end();
  }
}

loadSeedData();