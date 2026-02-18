/**
 * GuestRoute Component
 * Wrapper for routes that should only be accessible to non-authenticated users
 * Redirects to appropriate page if user is already logged in
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

/**
 * GuestRoute - Only accessible when NOT logged in
 * @param {React.ReactNode} children - Child components to render if not authenticated
 * @returns {React.ReactNode} - Children if not authenticated, redirect otherwise
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for auth state to initialize
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    // Redirect admin to dashboard, regular users to home
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if not authenticated
  return children;
}
