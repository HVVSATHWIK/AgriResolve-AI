/**
 * Signup Page
 * 
 * Provides user registration interface with email/password.
 * Integrates SignupForm component with AuthLayout for consistent branding.
 */

import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignupForm } from '../components/auth/SignupForm';

export const Signup: React.FC = () => {
  return (
    <AuthLayout title="Create your account">
      <SignupForm />
    </AuthLayout>
  );
};
