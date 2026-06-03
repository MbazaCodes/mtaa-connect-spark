import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { PhoneAuthProvider, RecaptchaVerifier, signInWithCredential, signInWithPhoneNumber } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCkuKa0qw34xr8iesJCoJFk5RBSlU7UuGo",
  authDomain: "studio-6129823290-b6caa.firebaseapp.com",
  databaseURL: "https://studio-6129823290-b6caa-default-rtdb.firebaseio.com",
  projectId: "studio-6129823290-b6caa",
  storageBucket: "studio-6129823290-b6caa.firebasestorage.app",
  messagingSenderId: "98693062073",
  appId: "1:98693062073:web:54028356393cf1cfc3aa68"
};
const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
let firebaseAuth = null;
if (isConfigured && getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firebaseAuth.languageCode = "sw";
}
export {
  PhoneAuthProvider,
  RecaptchaVerifier,
  firebaseAuth,
  isConfigured as isFirebaseConfigured,
  signInWithCredential,
  signInWithPhoneNumber
};
