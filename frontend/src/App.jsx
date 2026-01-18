/**
 * Main Application Component
 * Entry point with providers and routing
 * Pattern: Composite + Provider Pattern
 */
import React, { useState } from 'react';
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
  const { isAdmin, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    if (isAuthenticated) {
      return isAdmin ? 'admin-dashboard' : 'products';
    }
    return 'products';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [orderData, setOrderData] = useState(null); // Store order data for success page

  // Đảm bảo khi user hoặc admin thay đổi (login/logout), view sẽ cập nhật đúng
  React.useEffect(() => {
    if (isAuthenticated) {
      setCurrentView(isAdmin ? 'admin-dashboard' : 'products');
    } else {
      setCurrentView('products');
    }
  }, [isAdmin, isAuthenticated]);

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Reset filters when navigating away from products
    if (view !== 'products') {
      setSearchQuery('');
      setSelectedCategory(null);
    }
  };

  const handleAuthSuccess = () => {
    if (isAdmin) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('products');
    }
  };

  const handleCheckout = () => {
    setCurrentView('checkout');
  };

  const handleCheckoutSuccess = (order, paymentMethod, shippingInfo) => {
    setOrderData({ order, paymentMethod, shippingInfo });
    setCurrentView('order-success');
  };

  const handleBackToCart = () => {
    setCurrentView('products');
  };

  const handleContinueShopping = () => {
    setOrderData(null);
    setCurrentView('products');
  };

  const handleViewOrders = () => {
    setOrderData(null);
    setCurrentView('orders');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedCategory(null); // Reset category when searching
    setCurrentView('products'); // Navigate to products view
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Reset search when selecting category
    setCurrentView('products'); // Navigate to products view
  };

  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return <AuthContainer onSuccess={handleAuthSuccess} />;

      case 'products':
        return (
          <div className="products-page">
            <ProductList 
              searchQuery={searchQuery} 
              categoryId={selectedCategory}
              onCategoryChange={handleSelectCategory}
            />
            {/* Only show cart for non-admin users */}
          </div>
        );

      case 'checkout':
        return (
          <CheckoutPage 
            onBack={handleBackToCart}
            onSuccess={handleCheckoutSuccess}
          />
        );

      case 'order-success':
        return (
          <OrderSuccess
            order={orderData?.order}
            paymentMethod={orderData?.paymentMethod}
            shippingInfo={orderData?.shippingInfo}
            onContinueShopping={handleContinueShopping}
            onViewOrders={handleViewOrders}
          />
        );

      case 'orders':
        return (
          <div className="order-user">
            <button className="back-button" onClick={() => handleNavigate('products')}>
              ← Quay về Trang Chủ
            </button>
            <OrderList />
          </div>
        );

        
      case 'admin-products':
        if (!isAdmin) {
          setCurrentView('products');
          return null;
        }
        return (
          <div className="admin-page">
            <button className="back-button" onClick={() => handleNavigate('admin-dashboard')}>
              ← Quay về Trang Chủ
            </button>
            <AdminProductList />
          </div>
        );

      case 'admin-orders':
        if (!isAdmin) {
          setCurrentView('products');
          return null;
        }
        return (
          <div className="admin-page">
            <button className="back-button" onClick={() => handleNavigate('admin-dashboard')}>
              ← Quay về Trang Chủ
            </button>
            <AdminOrderList />
          </div>
        );

      case 'admin-categories':
        if (!isAdmin) {
          setCurrentView('products');
          return null;
        }
        return (
          <div className="admin-page">
            <button className="back-button" onClick={() => handleNavigate('admin-dashboard')}>
              ← Quay về Trang Chủ
            </button>
            <AdminCategoryList />
          </div>
        );

      case 'admin-dashboard':
        if (!isAdmin) {
          setCurrentView('products');
          return null;
        }
        return (
          <div className="admin-page">
            {/* <button className="back-button" onClick={() => handleNavigate('products')}>
              ← Quay về Trang Chủ
            </button> */}
            <AdminDashboard />
          </div>
        );

      case 'admin-users':
        if (!isAdmin) {
          setCurrentView('products');
          return null;
        }
        return (
          <div className="admin-page">
            <button className="back-button" onClick={() => handleNavigate('admin-dashboard')}>
              ← Quay về Trang Chủ
            </button>
            <AdminUserList />
          </div>
        );

      default:
        return <ProductList searchQuery={searchQuery} categoryId={selectedCategory} onCategoryChange={handleSelectCategory} />;
    }
  };

  return (
    <Layout
      onNavigate={handleNavigate}
      currentView={currentView}
      onSearch={setSearchQuery}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      onCheckout={handleCheckout} // truyền prop này
    >
      {renderView()}
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
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
