/**
 * Thin wrapper that delegates to the unified Firebase Admin module
 * at @/firebase/admin. This avoids double-initialization issues when
 * multiple files used to call admin.initializeApp() independently.
 */
import { initAdminFirestore } from '@/firebase/admin';

export function getAdminApp() {
  // Ensure the admin SDK is initialized and return the default app
  initAdminFirestore();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  return admin.app();
}

export function getAdminDb() {
  return initAdminFirestore();
}
