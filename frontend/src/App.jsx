/**
 * Main Application Component
 * Entry point with providers and routing
 * Pattern: Composite + Provider Pattern
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, CartProvider, useAuth } from './contexts';
import { Layout } from './components/layout';
import { AuthContainer } from './components/auth';
import { ProductList, AdminProductList } from './components/products';
import { OrderList, AdminOrderList } from './components/orders';
import { AdminCategoryList } from './components/categories';
import { CheckoutPage, OrderSuccess } from './components/checkout';
import { AdminDashboard } from './components/dashboard';
import { AdminUserList } from './components/users';

/**
 * Main App Content
 * Handles view routing
 */
function AppContent() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const handleAuthSuccess = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleCheckout = () => navigate('/checkout');

  const handleCheckoutSuccess = (order, paymentMethod, shippingInfo) => {
    setOrderData({ order, paymentMethod, shippingInfo });
    navigate('/order-success');
  };

  const handleBackToCart = () => navigate('/');
  const handleContinueShopping = () => {
    setOrderData(null);
    navigate('/');
  };

  const handleViewOrders = () => {
    setOrderData(null);
    navigate('/orders');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    navigate('/');
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    navigate('/');
  };

  return (
    <Layout onSearch={handleSearch} onCheckout={handleCheckout}>
      <Routes>
        <Route
          path="/"
          element={(
            <div className="products-page">
              <ProductList
                searchQuery={searchQuery}
                categoryId={selectedCategory}
                onCategoryChange={handleSelectCategory}
              />
            </div>
          )}
        />
        <Route path="/auth" element={<AuthContainer onSuccess={handleAuthSuccess} />} />
        <Route path="/checkout" element={<CheckoutPage onBack={handleBackToCart} onSuccess={handleCheckoutSuccess} />} />
        <Route path="/order-success" element={<OrderSuccess order={orderData?.order} paymentMethod={orderData?.paymentMethod} shippingInfo={orderData?.shippingInfo} onContinueShopping={handleContinueShopping} onViewOrders={handleViewOrders} />} />
        <Route path="/orders" element={<div className="order-user"><button className="back-button" onClick={() => navigate('/')}>← Quay về Trang Chủ</button><OrderList /></div>} />

        <Route path="/admin/products" element={<div className="admin-page"><button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Quay về Trang Chủ</button><AdminProductList /></div>} />
        <Route path="/admin/orders" element={<div className="admin-page"><button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Quay về Trang Chủ</button><AdminOrderList /></div>} />
        <Route path="/admin/categories" element={<div className="admin-page"><button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Quay về Trang Chủ</button><AdminCategoryList /></div>} />
        <Route path="/admin/dashboard" element={<div className="admin-page"><AdminDashboard /></div>} />
        <Route path="/admin/users" element={<div className="admin-page"><button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Quay về Trang Chủ</button><AdminUserList /></div>} />
      </Routes>
    </Layout>
  );
}

/**
 * App Root
 * Wraps with all providers
 */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
