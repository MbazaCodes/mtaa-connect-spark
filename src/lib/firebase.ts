/**
 * Firebase Configuration
 *
 * Used for:
 *   - Phone OTP Authentication (free SMS, works well in Tanzania +255)
 *   - Push Notifications (FCM) — future
 *   - Analytics — future
 *
 * Supabase remains the primary database, storage, and email auth provider.
 * Firebase handles phone auth only, then syncs to Supabase user table.
 *
 * Setup:
 *   1. Create project at https://console.firebase.google.com
 *   2. Enable Phone auth in Authentication → Sign-in method
 *   3. Copy config values into .env:
 *      VITE_FIREBASE_API_KEY=...
 *      VITE_FIREBASE_AUTH_DOMAIN=...
 *      VITE_FIREBASE_PROJECT_ID=...
 *      VITE_FIREBASE_APP_ID=...
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import type { Auth, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY     || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID  || '',
  appId:      import.meta.env.VITE_FIREBASE_APP_ID      || '',
};

// Only initialize if config is present
const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let firebaseAuth: Auth | null = null;

if (isConfigured && getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  // Set language for SMS messages
  firebaseAuth.languageCode = 'sw'; // Swahili
}

export { firebaseAuth, isConfigured as isFirebaseConfigured, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential };
export type { ConfirmationResult };
