# Firebase Setup Guide

This guide explains how to set up Firebase Authentication for AgriResolve AI.

## Prerequisites

- A Google account
- Node.js 20+ installed
- Access to the Firebase Console

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "agriresolve-ai")
   - Enable Google Analytics (optional)
   - Accept terms and create project

## Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Register Your Web App

1. In the Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Enter an app nickname (e.g., "AgriResolve Web")
6. Check "Also set up Firebase Hosting" (optional)
7. Click "Register app"

## Step 4: Get Your Firebase Configuration

After registering your app, Firebase will display your configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and update the Firebase configuration values:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. Save the file

## Step 6: Verify Configuration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for the message:
   ```
   Firebase initialized successfully
   ```

3. If you see an error about missing configuration, verify:
   - All environment variables are set in `.env`
   - Variable names match exactly (including `VITE_` prefix)
   - No extra spaces or quotes around values
   - The `.env` file is in the project root directory

## Security Notes

### API Key Security

- The Firebase API key in `VITE_FIREBASE_API_KEY` is **safe to expose** in client-side code
- It identifies your Firebase project but does not authenticate requests
- Firebase Security Rules control access to your data, not the API key

### Environment Variables

- The `.env` file is excluded from version control via `.gitignore`
- Never commit real Firebase credentials to Git
- Use different Firebase projects for development, staging, and production
- Share credentials securely with team members (use a password manager or secrets management tool)

### Firebase Security Rules

After setting up authentication, configure Firebase Security Rules to protect your data:

1. Go to Firebase Console → Firestore Database (or Realtime Database)
2. Click the "Rules" tab
3. Set up rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Error: "Missing required environment variables"

**Cause**: One or more Firebase configuration values are not set in `.env`

**Solution**:
1. Check that `.env` file exists in project root
2. Verify all six Firebase variables are set
3. Restart the development server after changing `.env`

### Error: "Firebase: Error (auth/invalid-api-key)"

**Cause**: The API key is incorrect or the Firebase project is misconfigured

**Solution**:
1. Verify the API key in Firebase Console → Project Settings
2. Ensure the API key is copied correctly without extra spaces
3. Check that the Firebase project has Authentication enabled

### Error: "Firebase: Error (auth/operation-not-allowed)"

**Cause**: Email/Password authentication is not enabled in Firebase Console

**Solution**:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" authentication
3. Save changes

### Development Server Not Picking Up .env Changes

**Solution**:
1. Stop the development server (Ctrl+C)
2. Restart it with `npm run dev`
3. Vite only reads `.env` files at startup

## Next Steps

After completing Firebase setup:

1. Test authentication by creating a user account
2. Verify user appears in Firebase Console → Authentication → Users
3. Implement protected routes (Task 1.2)
4. Create authentication UI components (Task 1.3)

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
