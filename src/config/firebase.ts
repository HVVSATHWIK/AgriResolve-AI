/**
 * Firebase Configuration Module
 * 
 * Initializes Firebase app with configuration from environment variables.
 * Validates required configuration and provides auth instance for the application.
 * 
 * Requirements: 2.1, 2.3, 2.5
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase configuration interface
 * All values are loaded from VITE_FIREBASE_* environment variables
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Load Firebase configuration from environment variables
 * @throws {Error} If any required configuration value is missing
 */
import appletConfig from '../../firebase-applet-config.json';

function loadFirebaseConfig(): FirebaseConfig {
  const config: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
  };

  // Validate all required configuration values are present
  const missingKeys: string[] = [];
  
  (Object.keys(config) as Array<keyof FirebaseConfig>).forEach((key) => {
    if (!config[key]) {
      missingKeys.push(`VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  });

  if (missingKeys.length > 0) {
    const errorMessage = `Firebase configuration error: Missing required environment variables:\n${missingKeys.join('\n')}\n\nPlease ensure these variables are set in your .env file.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return config;
}

/**
 * Initialize Firebase app singleton
 * @throws {Error} If Firebase configuration is invalid or initialization fails
 */
function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  try {
    const config = loadFirebaseConfig();
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = appletConfig.firestoreDatabaseId
      ? getFirestore(app, appletConfig.firestoreDatabaseId)
      : getFirestore(app);
    
    console.log('Firebase initialized successfully');
    
    return { app, auth, db };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Initialize Firebase and export instances
const { app, auth, db } = initializeFirebase();

export { app, auth, db };
