import { firebaseAuth, isFirebaseConfigured as isConfigured } from "./firebase-Czw1M5xv.js";
import { s as supabase } from "./AuthContext-Dat9LlRJ.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import "firebase/app";
import "react/jsx-runtime";
import "react";
import "./client-Bkk6o3Z0.js";
import "@supabase/supabase-js";
let recaptchaVerifier = null;
let confirmationResult = null;
function formatTZPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+255${cleaned.slice(1)}`;
  if (cleaned.startsWith("255")) return `+${cleaned}`;
  return `+255${cleaned}`;
}
function setupRecaptcha(buttonId) {
  if (!firebaseAuth || !isConfigured) {
    console.warn("Firebase not configured — phone OTP unavailable");
    return false;
  }
  try {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
      size: "invisible",
      callback: () => {
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired");
      }
    });
    return true;
  } catch (err) {
    console.error("setupRecaptcha failed:", err);
    return false;
  }
}
async function sendPhoneOTP(phone) {
  if (!firebaseAuth || !recaptchaVerifier) {
    return { success: false, error: "Firebase not ready. Configure VITE_FIREBASE_* env vars." };
  }
  const formattedPhone = formatTZPhone(phone);
  try {
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, recaptchaVerifier);
    return { success: true };
  } catch (err) {
    console.error("sendPhoneOTP error:", err);
    const code = err.code || "";
    if (code === "auth/invalid-phone-number") return { success: false, error: "Namba ya simu si sahihi / Invalid phone number" };
    if (code === "auth/too-many-requests") return { success: false, error: "Maombi mengi sana. Jaribu tena baadaye / Too many requests. Try later" };
    if (code === "auth/quota-exceeded") return { success: false, error: "Kiwango cha SMS kimezidi / SMS quota exceeded" };
    return { success: false, error: err.message || "Failed to send OTP" };
  }
}
async function verifyPhoneOTP(code) {
  if (!confirmationResult) {
    return { success: false, error: "No OTP pending. Send OTP first." };
  }
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    return {
      success: true,
      firebaseUid: user.uid,
      phone: user.phoneNumber || void 0
    };
  } catch (err) {
    console.error("verifyPhoneOTP error:", err);
    const code_ = err.code || "";
    if (code_ === "auth/invalid-verification-code") return { success: false, error: "OTP si sahihi / Invalid OTP code" };
    if (code_ === "auth/code-expired") return { success: false, error: "OTP imeisha muda / OTP expired. Resend." };
    return { success: false, error: err.message || "Verification failed" };
  }
}
async function syncFirebaseUserToSupabase(firebaseUid, phone) {
  try {
    const { data: existing } = await supabase.from("users").select("id, firebase_uid").eq("phone", phone).single();
    if (existing) {
      if (!existing.firebase_uid) {
        await supabase.from("users").update({ firebase_uid: firebaseUid }).eq("id", existing.id);
      }
      return { success: true, userId: existing.id, isNew: false };
    }
    const { data: byFbUid } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single();
    if (byFbUid) {
      return { success: true, userId: byFbUid.id, isNew: false };
    }
    const tempEmail = `phone_${phone.replace(/\+/g, "")}@emtaa.tz`;
    const tempPass = `Firebase_${firebaseUid.slice(0, 16)}!`;
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPass
    });
    if (authErr && !authErr.message.includes("already registered")) {
      console.warn("Supabase signUp for phone user:", authErr);
    }
    const userId = authData?.user?.id || firebaseUid;
    const { error: profileErr } = await supabase.from("users").upsert({
      id: userId,
      email: tempEmail,
      phone,
      firebase_uid: firebaseUid,
      first_name: "",
      last_name: "",
      role: "citizen",
      is_verified: false,
      account_status: "active"
    }, { onConflict: "id" });
    if (profileErr) {
      console.warn("Supabase profile upsert:", profileErr);
    }
    return { success: true, userId, isNew: true };
  } catch (err) {
    console.error("syncFirebaseUserToSupabase:", err);
    return { success: false, error: err.message || "Sync failed" };
  }
}
function cleanupRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
export {
  cleanupRecaptcha,
  formatTZPhone,
  sendPhoneOTP,
  setupRecaptcha,
  syncFirebaseUserToSupabase,
  verifyPhoneOTP
};
