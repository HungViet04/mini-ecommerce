# Mini E-Commerce Backend

A RESTful API backend for mini e-commerce built with Node.js, Express, and MySQL following Clean Architecture principles.

## 📋 Features

- **Authentication**: JWT-based authentication with access tokens
- **Authorization**: Role-based access control (admin/user)
- **Products**: CRUD operations with category management
- **Orders**: Order creation with stock management and status tracking
- **Categories**: Category management for products

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MySQL/MariaDB
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── index.js      # Central configuration
│   └── database.js   # Database connection pool
├── constants/        # Application constants
├── controllers/      # Request handlers
├── errors/           # Custom error classes
├── helpers/          # Helper functions
├── middlewares/      # Express middlewares
├── repositories/     # Data access layer
├── routes/           # API route definitions
├── services/         # Business logic layer
├── validators/       # Request validation
├── database/         # Database migrations
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL/MariaDB
- npm or yarn

### 1. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# Import schema
mysql -u root -p ecommerce_db < "./ecommerce_db.sql"
```

### 2. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| GET | /auth/profile | Get current user profile |
| PUT | /auth/change-password | Change password |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List all products |
| GET | /products/:id | Get product by ID |
| POST | /products | Create product (admin) |
| PUT | /products/:id | Update product (admin) |
| DELETE | /products/:id | Delete product (admin) |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /orders | List user orders |
| GET | /orders/:id | Get order by ID |
| POST | /orders | Create new order |
| PATCH | /orders/:id/status | Update order status |
| DELETE | /orders/:id | Cancel order |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | List all categories |
| GET | /categories/:id | Get category by ID |
| POST | /categories | Create category (admin) |
| PUT | /categories/:id | Update category (admin) |
| DELETE | /categories/:id | Delete category (admin) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /health/db | Database health check |

## 🗄️ Database Schema

```sql
-- Categories
categories(id, name)

<<<<<<< HEAD
-- Users
=======
-- Users  
>>>>>>> 9f8a31579ec3b169329531c5988ec58685b8af00
users(id, name, email, password, role, created_at)
  - role: enum('admin','user')

-- Products
products(id, name, price, stock, category_id, created_at)

-- Orders
orders(id, user_id, total, status, created_at)
  - status: enum('pending','paid','shipped')

-- Order Items
order_items(id, order_id, product_id, quantity, price)
```

## 🔐 Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## 📦 Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Pattern**: Business logic layer
- **Singleton Pattern**: Database connection pool
- **Middleware Pattern**: Request processing pipeline
- **Factory Pattern**: Error creation

## 👤 Default Admin User

After running migrations/seed:
- Email: admin@example.com
- Password: admin123

## 📝 Scripts

```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run db:migrate # Run migrations
npm run db:rollback # Rollback migrations
npm run db:seed    # Seed database
npm run db:reset   # Reset database
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

## 📄 License

ISC
