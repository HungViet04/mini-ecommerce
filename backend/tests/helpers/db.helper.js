/**
 * Database Test Helpers
 * Utilities for integration tests that hit a real MySQL database.
 */
const database = require('../../src/config/database');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'Test@123';
let hashedPassword = null;

/**
 * Get or lazily compute the bcrypt hash for the shared test password.
 */
async function getHashedPassword() {
  if (!hashedPassword) {
    hashedPassword = await bcrypt.hash(TEST_PASSWORD, 4);
  }
  return hashedPassword;
}

/**
 * Initialise the database pool (idempotent).
 */
async function initDB() {
  await database.initialize();
}

/**
 * Run all migrations against the test database.
 */
async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(__dirname, '../../src/database/migrations');

  // Create tracking table
  await database.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [executed] = await database.query('SELECT name FROM _migrations');
  const executedNames = new Set(executed.map((m) => m.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.includes('.down.') && !f.includes('.rollback.'))
    .sort();

  for (const file of files) {
    if (executedNames.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql
      .split(';')
      .map((s) =>
        s
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      )
      .filter((s) => s.length > 0);
    for (let stmt of statements) {
      try {
        // MySQL 8.0 doesn't support ALTER TABLE ... ADD COLUMN IF NOT EXISTS (MariaDB-only).
        // Strip "IF NOT EXISTS" from ADD COLUMN so the statement is valid MySQL;
        // "Duplicate column name" errors are caught below instead.
        stmt = stmt.replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, 'ADD COLUMN');
        await database.query(stmt);
      } catch (err) {
        // Ignore errors for things that already exist or duplicate data
        const msg = err.message || '';
        if (
          msg.includes('Duplicate entry') ||
          msg.includes('Duplicate column') ||
          msg.includes('already exists')
        ) {
          // Safe to skip
        } else {
          throw err;
        }
      }
    }
    await database.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
  }
}

/**
 * Clean ALL data from the database (order matters for FK constraints).
 * Silently ignores errors for tables that don't yet exist.
 */
async function cleanDB() {
  try {
    await database.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['order_items', 'orders', 'products', 'categories', 'users']) {
      try {
        await database.query(`TRUNCATE TABLE ${table}`);
      } catch {
        // table may not exist yet — skip
      }
    }
    await database.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch {
    // pool not initialised — skip
  }
}

/**
 * Close the database connection pool.
 */
async function closeDB() {
  await database.close();
}

/**
 * Seed a standard set of test data and return references to every row.
 */
async function seedTestData() {
  const hash = await getHashedPassword();

  // Admin user
  const [adminResult] = await database.query(
    "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@test.com', ?, 'admin')",
    [hash]
  );
  const adminId = adminResult.insertId;

  // Normal user
  const [userResult] = await database.query(
    "INSERT INTO users (name, email, password, role) VALUES ('User', 'user@test.com', ?, 'user')",
    [hash]
  );
  const userId = userResult.insertId;

  // Categories
  const [cat1] = await database.query("INSERT INTO categories (name) VALUES ('Electronics')");
  const [cat2] = await database.query("INSERT INTO categories (name) VALUES ('Books')");

  // Products
  const [prod1] = await database.query(
    'INSERT INTO products (name, price, stock, category_id) VALUES (?, ?, ?, ?)',
    ['Laptop', 15000000, 10, cat1.insertId]
  );
  const [prod2] = await database.query(
    'INSERT INTO products (name, price, stock, category_id) VALUES (?, ?, ?, ?)',
    ['Phone', 8000000, 20, cat1.insertId]
  );
  const [prod3] = await database.query(
    'INSERT INTO products (name, price, stock, category_id) VALUES (?, ?, ?, ?)',
    ['Novel', 120000, 50, cat2.insertId]
  );

  return {
    admin: { id: adminId, email: 'admin@test.com', role: 'admin' },
    user: { id: userId, email: 'user@test.com', role: 'user' },
    categories: [
      { id: cat1.insertId, name: 'Electronics' },
      { id: cat2.insertId, name: 'Books' },
    ],
    products: [
      { id: prod1.insertId, name: 'Laptop', price: 15000000, stock: 10, categoryId: cat1.insertId },
      { id: prod2.insertId, name: 'Phone', price: 8000000, stock: 20, categoryId: cat1.insertId },
      { id: prod3.insertId, name: 'Novel', price: 120000, stock: 50, categoryId: cat2.insertId },
    ],
    password: TEST_PASSWORD,
  };
}

module.exports = {
  initDB,
  runMigrations,
  cleanDB,
  closeDB,
  seedTestData,
  TEST_PASSWORD,
};
