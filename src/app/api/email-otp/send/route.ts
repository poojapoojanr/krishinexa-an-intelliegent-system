import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { getOtpEntry, setOtpEntry } from "../../otp/store";
import { initAdminFirestore } from "@/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS =
  (parseInt(process.env.OTP_TTL_MINUTES || "5", 10) || 5) * 60 * 1000;

const OTP_SECRET = process.env.OTP_SECRET || "dev-otp-secret-change-me";
const MAX_SENDS_PER_HOUR =
  parseInt(process.env.OTP_MAX_PER_HOUR || "5", 10) || 5;
const MIN_RESEND_DELAY_MS = 20_000; // 20 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashCode = (code: string, key: string) =>
  crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${key}:${code}`)
    .digest("hex");

const buildTransport = () => {
  const user = process.env.ALERT_EMAIL;
  const pass = process.env.ALERT_EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email credentials missing (ALERT_EMAIL / ALERT_EMAIL_PASS)");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
};

// ---------------------------------------------------------------------------
// POST /api/email-otp/send
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    // ✅ Firebase Admin Firestore check (single source of truth)
    const adminDb = initAdminFirestore();
    const snap = await adminDb
      .collection("users")
      .where("email", "==", normalized)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "Email not registered. Please sign up first." },
        { status: 400 }
      );
    }

    // Rate limiting
    const key = `email:${normalized}`;
    const now = Date.now();
    const entry = await getOtpEntry(key);

    if (entry) {
      const oneHourAgo = now - 60 * 60 * 1000;
      const sentAt = entry.sentAt ?? 0;
      const attempts = entry.attempts ?? 0;

      if (sentAt > oneHourAgo && attempts >= MAX_SENDS_PER_HOUR) {
        return NextResponse.json(
          { error: "Too many OTP requests. Try again later." },
          { status: 429 }
        );
      }

      if (now - sentAt < MIN_RESEND_DELAY_MS) {
        return NextResponse.json(
          { error: "Please wait before requesting another OTP." },
          { status: 429 }
        );
      }
    }

    // Generate OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    const hash = hashCode(code, key);

    await setOtpEntry(key, {
      hash,
      expiresAt: now + OTP_TTL_MS,
      sentAt: now,
      attempts: entry ? (entry.attempts ?? 0) + 1 : 1,
      verifyAttempts: 0,
    });

    // Send email
    const transport = buildTransport();
    await transport.sendMail({
      from: process.env.ALERT_EMAIL,
      to: normalized,
      subject: "Your KrishiNexa OTP",
      text: `Your OTP is ${code}. It is valid for ${Math.round(
        OTP_TTL_MS / 60000
      )} minutes.`,
    });

    return NextResponse.json({ message: "OTP sent to email" });
  } catch (err: any) {
    console.error("Email OTP send error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
