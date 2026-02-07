import { initAdminFirestore } from "@/firebase/admin";

// ---------------------------------------------------------------------------
// OTP entry shape stored in Firestore
// ---------------------------------------------------------------------------

export type OtpEntry = {
  hash: string;
  expiresAt: number;        // epoch ms
  sentAt: number;           // epoch ms
  attempts?: number;
  verifyAttempts?: number;
};

const COLLECTION_NAME = "emailOtps";

const docIdForKey = (key: string) => encodeURIComponent(key);

// ---------------------------------------------------------------------------
// Read OTP entry
// ---------------------------------------------------------------------------

export async function getOtpEntry(
  key: string
): Promise<OtpEntry | undefined> {
  try {
    const db = initAdminFirestore();
    const snap = await db
      .collection(COLLECTION_NAME)
      .doc(docIdForKey(key))
      .get();

    if (!snap.exists) return undefined;

    const data = snap.data();
    if (!data) return undefined;

    const expiresAt =
      typeof (data as any).expiresAt?.toMillis === "function"
        ? (data as any).expiresAt.toMillis()
        : Number((data as any).expiresAt);

    const sentAt =
      typeof (data as any).sentAt?.toMillis === "function"
        ? (data as any).sentAt.toMillis()
        : Number((data as any).sentAt);

    return {
      hash: String((data as any).hash),
      expiresAt,
      sentAt,
      attempts:
        (data as any).attempts !== undefined
          ? Number((data as any).attempts)
          : undefined,
      verifyAttempts:
        (data as any).verifyAttempts !== undefined
          ? Number((data as any).verifyAttempts)
          : undefined,
    };
  } catch (err) {
    console.error("getOtpEntry error", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Write / update OTP entry
// ---------------------------------------------------------------------------

export async function setOtpEntry(
  key: string,
  entry: OtpEntry
) {
  try {
    const db = initAdminFirestore();
    const ref = db
      .collection(COLLECTION_NAME)
      .doc(docIdForKey(key));

    // Convert epoch ms → Firestore Timestamp for TTL support
    let payload: any = { ...entry };

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require("firebase-admin");

      payload.expiresAt = admin.firestore.Timestamp.fromMillis(
        Number(entry.expiresAt)
      );
      payload.sentAt = admin.firestore.Timestamp.fromMillis(
        Number(entry.sentAt)
      );
    } catch {
      // Fallback: keep numeric values if admin import ever fails
      payload = { ...entry };
    }

    await ref.set(payload, { merge: true });
  } catch (err) {
    console.error("setOtpEntry error", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Delete OTP entry
// ---------------------------------------------------------------------------

export async function deleteOtpEntry(key: string) {
  try {
    const db = initAdminFirestore();
    await db
      .collection(COLLECTION_NAME)
      .doc(docIdForKey(key))
      .delete();
  } catch (err) {
    console.error("deleteOtpEntry error", err);
    throw err;
  }
}
