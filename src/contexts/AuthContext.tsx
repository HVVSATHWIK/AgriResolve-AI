/**
 * Authentication Context
 * 
 * Provides global authentication state and methods to all components.
 * Uses Firebase onAuthStateChanged observer for real-time auth state updates.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error && error.message ? error.message : fallback;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods.
 * Manages Firebase auth state observer and session persistence.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Sign up a new user with email and password
   * @param email - User email address
   * @param password - User password
   * @returns Promise resolving to UserCredential
   * @throws {Error} With descriptive message if signup fails
   */
  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: unknown) {
      // Re-throw with descriptive error message
      throw new Error(getErrorMessage(error, 'Failed to create account'));
    }
  };

  /**
   * Sign in an existing user with email and password
   * @param email - User email address
   * @param password - User password
   * @returns Promise resolving to UserCredential
   * @throws {Error} With descriptive message if signin fails
   */
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: unknown) {
      // Re-throw with descriptive error message
      throw new Error(getErrorMessage(error, 'Failed to sign in'));
    }
  };

  /**
   * Sign in with Google
   * @returns Promise resolving to UserCredential
   * @throws {Error} With descriptive message if signin fails
   */
  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential;
    } catch (error: unknown) {
      // Re-throw with descriptive error message
      if (error instanceof Error && error.message.includes('popup-closed-by-user')) {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error(getErrorMessage(error, 'Failed to sign in with Google'));
    }
  };

  /**
   * Sign out the current user
   * @returns Promise resolving when signout is complete
   * @throws {Error} With descriptive message if signout fails
   */
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      // Re-throw with descriptive error message
      throw new Error(getErrorMessage(error, 'Failed to sign out'));
    }
  };

  /**
   * Send password reset email to user
   * @param email - User email address
   * @returns Promise resolving when reset email is sent
   * @throws {Error} With descriptive message if reset fails
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      // Re-throw with descriptive error message
      throw new Error(getErrorMessage(error, 'Failed to send password reset email'));
    }
  };

  /**
   * Set up Firebase auth state observer on mount
   * Cleanup observer on unmount
   */
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
