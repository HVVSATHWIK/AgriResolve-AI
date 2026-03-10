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

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

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
      const from = (location.state as LoginLocationState | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      // Map Firebase errors to user-friendly messages
      const errorMessage = mapAuthError(err instanceof Error ? err.message : '');
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

  /**
   * Handle Google Sign In
   */
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      const from = (location.state as LoginLocationState | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
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

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="
          w-full flex justify-center items-center gap-3
          px-6 py-3 rounded-lg border border-gray-200
          bg-white text-gray-700 font-bold text-base
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          transition-all duration-200 shadow-sm
        "
        style={{ minHeight: '44px' }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      {/* Sign Up Link */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
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
