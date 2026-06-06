/**
 * Main Application Component
 * Entry point with providers and routing
 * Pattern: Composite + Provider Pattern
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  AuthProvider,
  CartProvider,
  LoadingProvider,
  NotificationProvider,
  useAuth,
} from './contexts';
import { Layout } from './components/layout';
import { AuthContainer, AdminRoute, UserRoute, GuestRoute } from './components/auth';
import { ProductList, AdminProductList, ProductDetailPage } from './components/products';
import { OrderList, AdminOrderList } from './components/orders';
import { AdminCategoryList } from './components/categories';
import { CheckoutPage, OrderSuccess, VNPayReturn } from './components/checkout';
import { AdminDashboard } from './components/dashboard';
import { AdminUserList } from './components/users';
import { ChatBot } from './components/chatbot';

/**
 * Main App Content
 * Handles view routing
 */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isAuthRoute = location.pathname.startsWith('/auth');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [activeFloating, setActiveFloating] = useState(null);

  const handleAuthSuccess = (loggedInUser) => {
    const returnPath = location.state?.from?.pathname;
    if (returnPath) {
      navigate(returnPath, { replace: true });
      return;
    }

    navigate(loggedInUser?.role === 'admin' ? '/admin/dashboard' : '/', { replace: true });
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
    <Layout
      onSearch={handleSearch}
      onCheckout={handleCheckout}
      activeFloating={activeFloating}
      onFloatingChange={setActiveFloating}
    >
      <Routes>
        <Route
          path="/"
          element={
            <div className="products-page">
              <ProductList
                searchQuery={searchQuery}
                categoryId={selectedCategory}
                onCategoryChange={handleSelectCategory}
              />
            </div>
          }
        />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/auth"
          element={
            <GuestRoute>
              <AuthContainer onSuccess={handleAuthSuccess} />
            </GuestRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <UserRoute>
              <CheckoutPage onBack={handleBackToCart} onSuccess={handleCheckoutSuccess} />
            </UserRoute>
          }
        />
        <Route
          path="/order-success"
          element={
            <UserRoute>
              <OrderSuccess
                order={orderData?.order}
                paymentMethod={orderData?.paymentMethod}
                shippingInfo={orderData?.shippingInfo}
                onContinueShopping={handleContinueShopping}
                onViewOrders={handleViewOrders}
              />
            </UserRoute>
          }
        />
        <Route path="/payment/vnpay-return" element={<VNPayReturn />} />
        <Route
          path="/orders"
          element={
            <UserRoute>
              <div className="order-user">
                <button className="back-button" onClick={() => navigate('/')}>
                  ← Quay về Trang Chủ
                </button>
                <OrderList />
              </div>
            </UserRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <div className="admin-page">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
                  ← Quay về Trang Chủ
                </button>
                <AdminProductList />
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <div className="admin-page">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
                  ← Quay về Trang Chủ
                </button>
                <AdminOrderList />
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <div className="admin-page">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
                  ← Quay về Trang Chủ
                </button>
                <AdminCategoryList />
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <div className="admin-page">
                <AdminDashboard />
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <div className="admin-page">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
                  ← Quay về Trang Chủ
                </button>
                <AdminUserList />
              </div>
            </AdminRoute>
          }
        />
      </Routes>
      {!isAuthRoute && !isAdmin && (
        <ChatBot activeFloating={activeFloating} onFloatingChange={setActiveFloating} />
      )}
    </Layout>
  );
}

/**
 * App Root
 * Wraps with all providers
 */
export default function App() {
  return (
    <NotificationProvider>
      <LoadingProvider>
        <AuthProvider>
          <CartProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </Router>
          </CartProvider>
        </AuthProvider>
      </LoadingProvider>
    </NotificationProvider>
  );
}
