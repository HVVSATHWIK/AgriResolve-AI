/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email.
 * 
 * Requirements: 5.5, 1.4
 */

import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      if (err.message.includes('user-not-found')) {
        setError('No account found with this email address');
      } else if (err.message.includes('invalid-email')) {
        setError('Please enter a valid email address');
      } else {
        setError('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Success Message */}
        {success && (
          <div 
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            Password reset email sent! Check your inbox for instructions.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div 
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Email Field */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            onBlur={() => validateEmail(email)}
            className={`
              w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
              transition-colors duration-200
              ${emailError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
            `}
            placeholder="you@example.com"
            disabled={loading}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p 
              id="email-error" 
              className="mt-1.5 text-sm text-red-600"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full flex justify-center items-center
            px-6 py-3 rounded-lg
            text-white font-semibold text-base
            bg-emerald-600 hover:bg-emerald-700
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200
            shadow-sm hover:shadow-md
          "
          style={{ minHeight: '44px' }}
        >
          {loading ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>

        {/* Back to Login Link */}
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="
              text-sm font-medium text-emerald-600 hover:text-emerald-700
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded
              transition-colors duration-200
              inline-block px-2 py-1
            "
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
          >
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
