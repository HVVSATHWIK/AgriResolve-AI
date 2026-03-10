/**
 * App Integration Tests
 * 
 * Tests the routing and authentication flow integration.
 * Verifies that protected routes redirect to login and public routes are accessible.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock Firebase auth
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user logged in
    callback(null);
    return jest.fn(); // Return unsubscribe function
  }),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe('App Routing Integration', () => {
  it('should redirect to login when accessing protected route without authentication', async () => {
    // Render the app
    render(<App />);

    // Wait for auth state to be determined and redirect to happen
    await waitFor(() => {
      // Should show login page content
      expect(screen.getByText(/Sign in to AgriResolve AI/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render login page at /login route', async () => {
    // Set initial route to /login
    window.history.pushState({}, 'Login', '/login');
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to AgriResolve AI/i)).toBeInTheDocument();
    });
  });

  it('should render signup page at /signup route', async () => {
    // Set initial route to /signup
    window.history.pushState({}, 'Signup', '/signup');
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    });
  });
});
