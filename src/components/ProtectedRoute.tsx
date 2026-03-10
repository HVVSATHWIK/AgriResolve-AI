/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication, redirecting unauthenticated users to login.
 * Shows loading spinner while auth state is being determined.
 * Preserves intended destination URL for post-login redirection.
 * 
 * Requirements: 1.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Props
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Checks authentication status and either:
 * - Shows loading spinner while auth state is being determined
 * - Redirects to login if not authenticated (preserving intended destination)
 * - Renders children if authenticated
 * 
 * @param children - The protected content to render if authenticated
 * @param redirectTo - The path to redirect to if not authenticated (default: '/login')
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving intended destination
  if (!currentUser) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};
