/**
 * Login Page
 * 
 * Provides user authentication interface with email/password login.
 * Integrates LoginForm component with AuthLayout for consistent branding.
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.8, 4.2
 */

import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

export const Login: React.FC = () => {
  return (
    <AuthLayout title="Sign in to your account">
      <LoginForm />
    </AuthLayout>
  );
};
