import 'server-only';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Persist across Turbopack / Next.js dev-mode hot-reloads via globalThis.
// Module-level variables are reset on HMR, but globalThis survives.
// ---------------------------------------------------------------------------
const g = globalThis as typeof globalThis & {
  _firebaseAdmin?: any;
  _firebaseAdminDb?: any;
  _firebaseAdminLoggedError?: boolean;
};

function loadAdmin() {
  if (g._firebaseAdmin) return g._firebaseAdmin;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    g._firebaseAdmin = require('firebase-admin');
    return g._firebaseAdmin;
  } catch (_err) {
    throw new Error(
      'firebase-admin package not installed. Run `npm install firebase-admin` and set credentials.',
    );
  }
}

/**
 * Read the service-account credential JSON, trying (in order):
 *  1. FIREBASE_SERVICE_ACCOUNT  – inline JSON string
 *  2. FIREBASE_SERVICE_ACCOUNT_PATH – path to a JSON key-file
 *  3. GOOGLE_APPLICATION_CREDENTIALS – path (used by ADC)
 * Returns { mode, credential? } so the caller knows which strategy to use.
 */
function resolveCredential() {
  // 1. Inline JSON
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try {
      return { mode: 'cert' as const, credential: JSON.parse(saJson) };
    } catch (e) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is set but contains invalid JSON: ' +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  // 2. Explicit path to a key-file (advertised in .env.example)
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    const abs = path.isAbsolute(saPath) ? saPath : path.resolve(process.cwd(), saPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH points to "${abs}" which does not exist.`);
    }
    try {
      return { mode: 'cert' as const, credential: JSON.parse(fs.readFileSync(abs, 'utf-8')) };
    } catch (e) {
      throw new Error(
        `Failed to read/parse service-account file at "${abs}": ` +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  // 3. GOOGLE_APPLICATION_CREDENTIALS (resolve relative paths to absolute)
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gac) {
    const absGac = path.isAbsolute(gac) ? gac : path.resolve(process.cwd(), gac);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = absGac;
    // Also read the JSON to extract project_id (ADC alone doesn't expose it)
    let parsedCred: Record<string, any> | undefined;
    try {
      if (fs.existsSync(absGac)) {
        parsedCred = JSON.parse(fs.readFileSync(absGac, 'utf-8'));
      }
    } catch { /* best-effort */ }
    return { mode: 'adc' as const, credential: parsedCred };
  }

  return { mode: 'none' as const, credential: undefined };
}

/**
 * Initialize and return Admin Firestore instance.
 * Credentials are resolved from env vars (see resolveCredential above).
 * The singleton is stored on globalThis so it survives Turbopack HMR.
 */
export function initAdminFirestore() {
  if (g._firebaseAdminDb) return g._firebaseAdminDb;

  const adm = loadAdmin();
  const { mode, credential } = resolveCredential();

  // Initialise the app if not yet done
  if (!adm.apps.length) {
    try {
      switch (mode) {
        case 'cert':
          adm.initializeApp({ credential: adm.credential.cert(credential) });
          break;
        case 'adc':
          adm.initializeApp({ credential: adm.credential.applicationDefault() });
          break;
        default: {
          const msg =
            'Missing Firebase admin credentials. ' +
            'Set FIREBASE_SERVICE_ACCOUNT (JSON), FIREBASE_SERVICE_ACCOUNT_PATH (file), ' +
            'or GOOGLE_APPLICATION_CREDENTIALS (path).';
          if (!g._firebaseAdminLoggedError) {
            console.error(msg); // eslint-disable-line no-console
            g._firebaseAdminLoggedError = true;
          }
          throw new Error(msg);
        }
      }
    } catch (err) {
      console.error('Failed to initialize Firebase Admin SDK:', err); // eslint-disable-line no-console
      throw err;
    }
  }

  if (adm.apps.length) {
    const projectId =
      credential?.project_id ||
      adm.apps[0]?.options?.projectId ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      // Last resort: warn but don't throw – Firestore can still work if the
      // underlying credential carries the project (e.g. ADC on GCP).
      if (!g._firebaseAdminLoggedError) {
        console.warn( // eslint-disable-line no-console
          'Firebase Admin: project_id not detected from env vars or credential JSON. ' +
          'Firestore may still work if the credential carries a default project.',
        );
        g._firebaseAdminLoggedError = true;
      }
    }

    g._firebaseAdminDb = adm.firestore();
    return g._firebaseAdminDb;
  }

  throw new Error('Firebase Admin SDK not initialized.');
}

export default initAdminFirestore;
