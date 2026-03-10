/**
 * LoginForm Component
 * 
 * User login interface with email/password inputs, validation, and error handling.
 * 
 * Features:
 * - Email and password input fields with validation
 * - Password visibility toggle
 * - Loading state during authentication
 * - Inline error message display
 * - "Forgot Password" link
 * - Link to signup form
 * - Touch-friendly button sizes (min 44x44px)
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.8, 4.2
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
   * Validate password length
   */
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to intended destination or dashboard
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      // Map Firebase errors to user-friendly messages
      const errorMessage = mapAuthError(err.message);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Map Firebase auth errors to user-friendly messages
   */
  const mapAuthError = (errorMessage: string): string => {
    if (errorMessage.includes('user-not-found')) {
      return 'No account found with this email address';
    }
    if (errorMessage.includes('wrong-password')) {
      return 'Incorrect password. Please try again';
    }
    if (errorMessage.includes('invalid-email')) {
      return 'Please enter a valid email address';
    }
    if (errorMessage.includes('too-many-requests')) {
      return 'Too many failed attempts. Please try again later';
    }
    if (errorMessage.includes('network-request-failed')) {
      return 'Network error. Please check your connection';
    }
    if (errorMessage.includes('user-disabled')) {
      return 'This account has been disabled. Please contact support';
    }
    return 'Failed to sign in. Please try again';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Global Error Message */}
      {error && (
        <div 
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

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

      {/* Password Field */}
      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) validatePassword(e.target.value);
            }}
            onBlur={() => validatePassword(password)}
            className={`
              w-full px-4 py-3 pr-12 rounded-lg border text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
              transition-colors duration-200
              ${passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
            `}
            placeholder="Enter your password"
            disabled={loading}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          
          {/* Password Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              p-2 text-gray-500 hover:text-gray-700
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded
              transition-colors duration-200
            "
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {passwordError && (
          <p 
            id="password-error" 
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {passwordError}
          </p>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="
            text-sm font-medium text-emerald-600 hover:text-emerald-700
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded
            transition-colors duration-200
            inline-block px-2 py-1
          "
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          Forgot password?
        </Link>
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
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Sign Up Link */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="
              font-medium text-emerald-600 hover:text-emerald-700
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded
              transition-colors duration-200
              inline-block px-2 py-1
            "
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
};
