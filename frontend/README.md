# 🛒 SmartShop Frontend

Modern e-commerce frontend built with **React 18** + **Vite** following best practices and design patterns.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:5173
```

## ⚙️ Environment Variables

Create a `.env` file (or copy from `.env.example`):

```env
VITE_API_BASE=http://localhost:3000/api/v1
```

## 📁 Project Structure

```
src/
├── components/           # UI Components
│   ├── ui/              # Reusable UI (Button, Input, Card, Alert, Loading)
│   ├── layout/          # Layout components (Navbar, Layout)
│   ├── auth/            # Authentication (LoginForm, RegisterForm, AuthContainer)
│   ├── products/        # Products (ProductCard, ProductGrid, ProductList, CreateProductForm)
│   ├── cart/            # Shopping Cart (CartItem, CartSummary)
│   ├── orders/          # Orders (OrderCard, OrderList)
│   └── index.js         # Barrel exports
│
├── contexts/            # React Context (Global State)
│   ├── AuthContext.jsx  # Authentication state & methods
│   ├── CartContext.jsx  # Shopping cart state with reducer
│   └── index.js
│
├── services/            # API Service Layer
│   ├── http.client.js   # HTTP client with interceptors
│   ├── auth.service.js  # Auth API calls
│   ├── product.service.js
│   ├── order.service.js
│   ├── category.service.js
│   └── index.js
│
├── hooks/               # Custom React Hooks
│   ├── useProducts.js   # Product data fetching
│   ├── useOrders.js     # Order data fetching
│   ├── useForm.js       # Form state management
│   └── index.js
│
├── utils/               # Utility Functions
│   ├── storage.js       # LocalStorage helpers
│   ├── format.js        # Price & date formatting
│   ├── validation.js    # Form validation
│   └── index.js
│
├── styles/
│   └── index.css        # Global styles & design tokens
│
├── App.jsx              # Main App with Providers
└── main.jsx             # Entry point
```

## 🎯 Design Patterns Used

| Pattern | Description | Example |
|---------|-------------|---------|
| **Container/Presenter** | Separates logic from UI | `AuthContainer` + `LoginForm` |
| **Custom Hooks** | Reusable stateful logic | `useProducts`, `useForm` |
| **Context + Provider** | Global state management | `AuthContext`, `CartContext` |
| **Service Layer** | API abstraction | `productService`, `authService` |
| **Reducer Pattern** | Complex state updates | `CartContext` |
| **Barrel Exports** | Clean imports | `index.js` files |

## ✨ Features

- 🔐 **Authentication** - Login / Register with JWT
- 📦 **Products** - Browse, search, filter products
- 🛒 **Shopping Cart** - Add/remove items, quantity management
- 📋 **Orders** - Place orders, view order history
- 👨‍💼 **Admin** - Create products (admin role)
- 📱 **Responsive** - Mobile-friendly design
- 🎨 **Dark Theme** - Modern dark UI with CSS custom properties

## 🛠️ Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📡 API Endpoints Used

| Feature | Endpoint |
|---------|----------|
| Register | `POST /api/v1/auth/register` |
| Login | `POST /api/v1/auth/login` |
| Products | `GET /api/v1/products` |
| Create Product | `POST /api/v1/products` |
| Create Order | `POST /api/v1/orders` |
| My Orders | `GET /api/v1/orders/my` |

## 🔧 Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool
- **CSS Custom Properties** - Design tokens
- **Fetch API** - HTTP requests

