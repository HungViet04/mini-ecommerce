/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';

/**
 * ProtectedRoute - Requires user to be logged in
 * @param {React.ReactNode} children - Child components to render if authenticated
 * @returns {React.ReactNode} - Children if authenticated, redirect to /auth otherwise
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
}
