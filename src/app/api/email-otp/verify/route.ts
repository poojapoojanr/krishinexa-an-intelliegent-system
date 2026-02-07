import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOtpEntry, setOtpEntry, deleteOtpEntry } from '../../otp/store';
import { initAdminFirestore } from '@/firebase/admin';

function getAdminAuth() {
  // Ensure admin is initialized by calling initAdminFirestore first
  initAdminFirestore();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  return admin.auth();
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OTP_SECRET = process.env.OTP_SECRET || 'dev-otp-secret-change-me';
const MAX_VERIFY_ATTEMPTS = parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS || '5', 10) || 5;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashCode = (code: string, key: string) =>
  crypto.createHmac('sha256', OTP_SECRET).update(`${key}:${code}`).digest('hex');

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
    }

    const key = `email:${normalized}`;
    const entry = await getOtpEntry(key);

    if (!entry) {
      return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    }

    const attempts = entry.verifyAttempts ?? 0;
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await deleteOtpEntry(key);
      return NextResponse.json({ error: 'Too many invalid attempts. Request a new OTP.' }, { status: 429 });
    }

    if (Date.now() > entry.expiresAt) {
      await deleteOtpEntry(key);
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    }

    const hashed = hashCode(code, key);
    if (hashed !== entry.hash) {
      await setOtpEntry(key, { ...entry, verifyAttempts: attempts + 1 });
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    await deleteOtpEntry(key);

    // -----------------------------------------------------------------------
    // Generate a custom token so the client signs in as the SAME Firebase Auth
    // user that owns this email (whether created via email+password or OTP).
    // -----------------------------------------------------------------------
    try {
      const adminAuth = getAdminAuth();

      let uid: string;

      try {
        // 1. Look up the existing Firebase Auth user by email
        const existingUser = await adminAuth.getUserByEmail(normalized);
        uid = existingUser.uid;
      } catch (lookupErr: any) {
        // auth/user-not-found → email is in Firestore "users" but not yet in
        // Firebase Auth (edge case). Create a Firebase Auth account so both
        // login methods share the same UID going forward.
        if (lookupErr?.code === 'auth/user-not-found') {
          const newUser = await adminAuth.createUser({
            email: normalized,
            emailVerified: true,
          });
          uid = newUser.uid;
        } else {
          throw lookupErr;
        }
      }

      const customToken = await adminAuth.createCustomToken(uid);
      return NextResponse.json({ message: 'OTP verified', customToken, uid });
    } catch (authErr: any) {
      console.error('Failed to create custom token for OTP user:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed after OTP verification. Please try again.' },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error('Email OTP verify error', err);
    return NextResponse.json({ error: err?.message || 'Failed to verify OTP' }, { status: 500 });
  }
}
