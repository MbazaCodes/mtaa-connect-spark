import "firebase/app";
import { PhoneAuthProvider, RecaptchaVerifier, signInWithCredential, signInWithPhoneNumber } from "firebase/auth";
const isConfigured = false;
let firebaseAuth = null;
export {
  PhoneAuthProvider,
  RecaptchaVerifier,
  firebaseAuth,
  isConfigured as isFirebaseConfigured,
  signInWithCredential,
  signInWithPhoneNumber
};
