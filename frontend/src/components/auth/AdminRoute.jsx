/**
 * AdminRoute Component
 * Wrapper for routes that require admin role
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

/**
 * AdminRoute - Requires user to be logged in AND have admin role
 * @param {React.ReactNode} children - Child components to render if authorized
 * @returns {React.ReactNode} - Children if admin, redirect otherwise
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for auth state to initialize
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to home if not admin
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Render children if admin
  return children;
}
