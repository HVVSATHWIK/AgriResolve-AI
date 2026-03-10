/**
 * AuthLayout Component
 * 
 * Provides a consistent layout wrapper for authentication pages (login, signup).
 * Features:
 * - Centered card design with professional styling
 * - AgriResolve AI branding with logo
 * - Mobile-first responsive layout
 * - Professional shadows and borders
 * 
 * Requirements: 4.1, 4.5, 10.1
 */

import React from 'react';
import { AgriResolveMark } from '../AgriResolveMark';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Branding Section */}
        <div className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-lg border border-emerald-100">
              <AgriResolveMark 
                className="w-10 h-10 text-emerald-600" 
                aria-label="AgriResolve AI Logo"
              />
            </div>
          </div>
          
          {/* Brand Name */}
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              AgriResolve AI
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Intelligent Agricultural Solutions
            </p>
          </div>
          
          {/* Page Title */}
          <h2 className="text-xl font-semibold text-gray-800 pt-2">
            {title}
          </h2>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} AgriResolve AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};
