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
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyCkuKa0qw34xr8iesJCoJFk5RBSlU7UuGo',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'studio-6129823290-b6caa.firebaseapp.com',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || 'https://studio-6129823290-b6caa-default-rtdb.firebaseio.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'studio-6129823290-b6caa',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'studio-6129823290-b6caa.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID       || '98693062073',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:98693062073:web:54028356393cf1cfc3aa68',
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
