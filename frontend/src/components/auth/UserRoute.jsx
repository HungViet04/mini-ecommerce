/**
 * UserRoute Component
 * Wrapper for routes that require non-admin users
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useLoading } from '../../contexts';
import { LoadingOverlay } from '../ui';

/**
 * UserRoute - Requires user to be logged in and NOT admin
 * @param {React.ReactNode} children - Child components to render if authorized
 * @returns {React.ReactNode} - Children if user, redirect otherwise
 */
export function UserRoute({ children }) {
  const { user, loading } = useAuth();
  const { isLoading: isGlobalLoading } = useLoading();
  const location = useLocation();

  if (loading) {
    return isGlobalLoading ? null : <LoadingOverlay open text="Đang tải..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
