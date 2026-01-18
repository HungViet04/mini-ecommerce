/**
 * Layout Component
 * Main app layout wrapper
 * Pattern: Layout Component
 */
import React from "react";
import { Navbar } from "./Navbar";
import FloatingCart from "../cart/FloatingCart";
import { useAuth } from "../../contexts";

export function Layout({
  children,
  onNavigate,
  currentView,
  onSearch,
  onCheckout,
}) {
  const { isAdmin } = useAuth();
  const hideFooter =
    currentView === "login" ||
    currentView === "register" ||
    currentView === "auth";
  const hideCart = [
    "login",
    "register",
    "auth",
    "checkout",
    "orders",
    "order-success",
  ].includes(currentView) || isAdmin;
  return (
    <div className="app-layout">
      <Navbar
        onNavigate={onNavigate}
        currentView={currentView}
        onSearch={onSearch}
      />
      {/* Ẩn FloatingCart khi ở trang đăng nhập/đăng ký/auth hoặc là admin */}
      {!hideCart && <FloatingCart onCheckout={onCheckout} />}
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
      {!hideFooter && (
        <footer className="footer">
          <p className="footer-text">© 2026 SmartShop. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}

export default Layout;
