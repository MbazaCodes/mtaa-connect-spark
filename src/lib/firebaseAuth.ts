/**
 * Firebase Phone Auth — OTP helpers
 *
 * Flow:
 *   1. setupRecaptcha() — invisible reCAPTCHA on the send button
 *   2. sendPhoneOTP(phone) — Firebase sends SMS to +255...
 *   3. verifyPhoneOTP(code) — verify the 6-digit code
 *   4. syncFirebaseUserToSupabase() — create/link in Supabase users table
 *
 * After step 4, the user has both:
 *   - Firebase auth session (phone verified)
 *   - Supabase user row (for database access)
 */
import {
  firebaseAuth,
  isFirebaseConfigured,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from './firebase';
import type { ConfirmationResult } from './firebase';
import { supabase } from './supabase';

let recaptchaVerifier: InstanceType<typeof RecaptchaVerifier> | null = null;
let confirmationResult: ConfirmationResult | null = null;

/**
 * Format phone to E.164 (+255...)
 */
export function formatTZPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+255${cleaned.slice(1)}`;
  if (cleaned.startsWith('255')) return `+${cleaned}`;
  return `+255${cleaned}`;
}

/**
 * Initialize invisible reCAPTCHA on a button element.
 * Call this ONCE before sending OTP.
 * @param buttonId — DOM id of the "Send OTP" button
 */
export function setupRecaptcha(buttonId: string): boolean {
  if (!firebaseAuth || !isFirebaseConfigured) {
    console.warn('Firebase not configured — phone OTP unavailable');
    return false;
  }

  try {
    // Clear previous verifier if exists
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved — will proceed with signInWithPhoneNumber
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
      },
    });

    return true;
  } catch (err) {
    console.error('setupRecaptcha failed:', err);
    return false;
  }
}

/**
 * Send OTP to the given phone number via Firebase.
 * Returns true if OTP was sent successfully.
 */
export async function sendPhoneOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!firebaseAuth || !recaptchaVerifier) {
    return { success: false, error: 'Firebase not ready. Configure VITE_FIREBASE_* env vars.' };
  }

  const formattedPhone = formatTZPhone(phone);

  try {
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, recaptchaVerifier);
    return { success: true };
  } catch (err: any) {
    console.error('sendPhoneOTP error:', err);

    // User-friendly error messages
    const code = err.code || '';
    if (code === 'auth/invalid-phone-number') return { success: false, error: 'Namba ya simu si sahihi / Invalid phone number' };
    if (code === 'auth/too-many-requests') return { success: false, error: 'Maombi mengi sana. Jaribu tena baadaye / Too many requests. Try later' };
    if (code === 'auth/quota-exceeded') return { success: false, error: 'Kiwango cha SMS kimezidi / SMS quota exceeded' };

    return { success: false, error: err.message || 'Failed to send OTP' };
  }
}

/**
 * Verify the 6-digit OTP code.
 * Returns the Firebase user on success.
 */
export async function verifyPhoneOTP(code: string): Promise<{
  success: boolean;
  firebaseUid?: string;
  phone?: string;
  error?: string;
}> {
  if (!confirmationResult) {
    return { success: false, error: 'No OTP pending. Send OTP first.' };
  }

  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    return {
      success: true,
      firebaseUid: user.uid,
      phone: user.phoneNumber || undefined,
    };
  } catch (err: any) {
    console.error('verifyPhoneOTP error:', err);
    const code_ = err.code || '';
    if (code_ === 'auth/invalid-verification-code') return { success: false, error: 'OTP si sahihi / Invalid OTP code' };
    if (code_ === 'auth/code-expired') return { success: false, error: 'OTP imeisha muda / OTP expired. Resend.' };
    return { success: false, error: err.message || 'Verification failed' };
  }
}

/**
 * After Firebase phone auth succeeds, sync the user to Supabase.
 *
 * Looks up existing user by phone, or creates a new one.
 * Returns the Supabase user_id for session management.
 */
export async function syncFirebaseUserToSupabase(
  firebaseUid: string,
  phone: string,
): Promise<{ success: boolean; userId?: string; isNew?: boolean; error?: string }> {
  try {
    // 1. Check if user already exists by phone
    const { data: existing } = await supabase
      .from('users')
      .select('id, firebase_uid')
      .eq('phone', phone)
      .single();

    if (existing) {
      // Update firebase_uid if not set
      if (!existing.firebase_uid) {
        await supabase.from('users').update({ firebase_uid: firebaseUid }).eq('id', existing.id);
      }
      return { success: true, userId: existing.id, isNew: false };
    }

    // 2. Check by firebase_uid
    const { data: byFbUid } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (byFbUid) {
      return { success: true, userId: byFbUid.id, isNew: false };
    }

    // 3. Create new user — sign up in Supabase Auth with a random password
    //    (user will use phone OTP to login, not password)
    const tempEmail = `phone_${phone.replace(/\+/g, '')}@emtaa.tz`;
    const tempPass = `Firebase_${firebaseUid.slice(0, 16)}!`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPass,
    });

    if (authErr && !authErr.message.includes('already registered')) {
      console.warn('Supabase signUp for phone user:', authErr);
    }

    const userId = authData?.user?.id || firebaseUid;

    // 4. Upsert profile in users table
    const { error: profileErr } = await supabase.from('users').upsert({
      id: userId,
      email: tempEmail,
      phone: phone,
      firebase_uid: firebaseUid,
      first_name: '',
      last_name: '',
      role: 'citizen',
      is_verified: false,
      account_status: 'active',
    }, { onConflict: 'id' });

    if (profileErr) {
      console.warn('Supabase profile upsert:', profileErr);
    }

    return { success: true, userId, isNew: true };
  } catch (err: any) {
    console.error('syncFirebaseUserToSupabase:', err);
    return { success: false, error: err.message || 'Sync failed' };
  }
}

/**
 * Clean up reCAPTCHA (call on unmount)
 */
export function cleanupRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
