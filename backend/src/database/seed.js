/**
 * Database Seeder
 * Seeds the database with sample data
 */
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const config = require('../config');

/**
 * Seed users
 */
async function seedUsers() {
  console.log('Seeding users...');

  const users = [
    {
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', config.bcrypt.saltRounds),
      role: 'admin',
    },
    {
      name: 'Test User',
      email: 'user@example.com',
      password: await bcrypt.hash('user123', config.bcrypt.saltRounds),
      role: 'user',
    },
  ];

  for (const user of users) {
    try {
      await database.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [user.name, user.email, user.password, user.role]
      );
      console.log(`  ✅ User: ${user.email}`);
    } catch (error) {
      console.log(`  ⏭️  User: ${user.email} (already exists)`);
    }
  }
}

/**
 * Seed categories
 */
async function seedCategories() {
  console.log('Seeding categories...');

  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
    { name: 'Books', slug: 'books', description: 'Books and publications' },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home and garden products' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' },
    { name: 'Beauty', slug: 'beauty', description: 'Beauty and personal care products' },
  ];

  for (const category of categories) {
    try {
      await database.query(
        `INSERT INTO categories (name, slug, description) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [category.name, category.slug, category.description]
      );
      console.log(`  ✅ Category: ${category.name}`);
    } catch (error) {
      console.log(`  ⏭️  Category: ${category.name} (already exists)`);
    }
  }
}

/**
 * Seed products
 */
async function seedProducts() {
  console.log('Seeding products...');

  // Get category IDs
  const [categories] = await database.query('SELECT id, slug FROM categories');
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const products = [
    {
      name: 'iPhone 15 Pro',
      price: 28990000,
      stock: 50,
      category: 'electronics',
      description: 'Apple iPhone 15 Pro with A17 chip',
    },
    {
      name: 'Samsung Galaxy S24',
      price: 23990000,
      stock: 45,
      category: 'electronics',
      description: 'Samsung flagship smartphone',
    },
    {
      name: 'MacBook Pro 14"',
      price: 49990000,
      stock: 20,
      category: 'electronics',
      description: 'Apple MacBook Pro with M3 chip',
    },
    {
      name: 'Sony WH-1000XM5',
      price: 8490000,
      stock: 100,
      category: 'electronics',
      description: 'Premium noise-canceling headphones',
    },
    {
      name: 'Nike Air Max',
      price: 3590000,
      stock: 200,
      category: 'sports',
      description: 'Classic running shoes',
    },
    {
      name: 'Adidas Ultraboost',
      price: 4290000,
      stock: 150,
      category: 'sports',
      description: 'Premium running shoes with Boost technology',
    },
    {
      name: 'Uniqlo T-Shirt',
      price: 399000,
      stock: 500,
      category: 'clothing',
      description: 'Comfortable cotton t-shirt',
    },
    {
      name: "Levi's 501 Jeans",
      price: 1590000,
      stock: 300,
      category: 'clothing',
      description: 'Original fit jeans',
    },
    {
      name: 'Clean Code',
      price: 650000,
      stock: 100,
      category: 'books',
      description: 'A Handbook of Agile Software Craftsmanship',
    },
    {
      name: 'The Pragmatic Programmer',
      price: 750000,
      stock: 80,
      category: 'books',
      description: 'Your Journey To Mastery',
    },
  ];

  for (const product of products) {
    try {
      const categoryId = categoryMap.get(product.category);
      await database.query(
        `INSERT INTO products (name, price, stock, category_id, description) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), stock = VALUES(stock)`,
        [product.name, product.price, product.stock, categoryId, product.description]
      );
      console.log(`  ✅ Product: ${product.name}`);
    } catch (error) {
      console.log(`  ⏭️  Product: ${product.name} (error: ${error.message})`);
    }
  }
}

/**
 * Run all seeders
 */
async function runSeeders() {
  try {
    console.log('Starting database seeding...\n');

    await database.initialize();

    await seedUsers();
    await seedCategories();
    await seedProducts();

    console.log('\n✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run seeders
runSeeders();
