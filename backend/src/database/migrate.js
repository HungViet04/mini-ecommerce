/**
 * Database Migration Runner
 * Runs SQL migration files in order
 */
const fs = require('fs');
const path = require('path');
const database = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...\n');

    // Initialize database connection
    await database.initialize();

    // Create migrations tracking table if not exists
    await database.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const [executed] = await database.query('SELECT name FROM _migrations');
    const executedNames = new Set(executed.map((m) => m.name));

    // Get migration files
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration file(s)`);

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of migrationFiles) {
      if (executedNames.has(file)) {
        console.log(`  ⏭️  ${file} (already executed)`);
        continue;
      }

      console.log(`  ▶️  Running ${file}...`);

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split by semicolon and filter empty statements
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        try {
          await database.query(statement);
        } catch (error) {
          // Ignore certain errors (like duplicate key on INSERT IGNORE)
          if (!error.message.includes('Duplicate entry')) {
            console.error(`    Error executing statement:`, error.message);
          }
        }
      }

      // Record migration
      await database.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`  ✅ ${file} completed`);
      migrationsRun++;
    }

    console.log(`\n✅ Migrations complete. ${migrationsRun} migration(s) executed.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration() {
  try {
    console.log('Rolling back last migration...\n');

    await database.initialize();

    const [lastMigration] = await database.query(
      'SELECT name FROM _migrations ORDER BY id DESC LIMIT 1'
    );

    if (lastMigration.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const migrationName = lastMigration[0].name;
    console.log(`Rolling back: ${migrationName}`);

    // Look for rollback file
    const rollbackFile = migrationName.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(MIGRATIONS_DIR, rollbackFile);

    if (fs.existsSync(rollbackPath)) {
      const sql = fs.readFileSync(rollbackPath, 'utf8');
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await database.query(statement);
      }
    }

    await database.query('DELETE FROM _migrations WHERE name = ?', [migrationName]);
    console.log(`✅ Rolled back: ${migrationName}`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    runMigrations();
    break;
  case 'down':
  case 'rollback':
    rollbackMigration();
    break;
  default:
    console.log('Usage: node migrate.js [up|down|migrate|rollback]');
    process.exit(1);
}
