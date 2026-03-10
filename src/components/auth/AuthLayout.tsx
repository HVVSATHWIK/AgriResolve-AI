/**
 * AuthLayout Component
 * 
 * Provides a consistent layout wrapper for authentication pages (login, signup).
 * Features:
 * - Centered card design with professional styling
 * - AgriResolve AI branding with real logo
 * - Mobile-first responsive layout
 * - Professional shadows and borders matching internal app vibe
 * 
 * Requirements: 4.1, 4.5, 10.1
 */

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f2] px-4 py-8 font-inter">
      <div className="max-w-md w-full space-y-8">
        {/* Branding Section */}
        <div className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <img src="/logo.png" alt="AgriResolve Logo" className="w-10 h-10 object-contain" />
            </div>
          </div>
          
          {/* Brand Name */}
          <div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight leading-none">
              AgriResolve AI
            </h1>
            <p className="text-xs font-bold text-emerald-700/80 uppercase tracking-widest mt-2">
              Field Assistant
            </p>
          </div>
        </div>

        {/* Content Card with Glassmorphic hint */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden">
          <div className="p-6 sm:p-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {title}
            </h2>
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} AgriResolve AI
        </p>
      </div>
    </div>
  );
};
